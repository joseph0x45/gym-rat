// Export all your data to a JSON file, and import it back.
// Everything stays on your device: the file is just downloaded, never uploaded anywhere.
import { db } from './db.js'

const FORMAT = 'gym-rat-backup'
const VERSION = 1

// Files (the GIFs) can't go in JSON directly, so we turn them into text ("data URLs")
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob()
}

export async function exportBackup() {
  const [exercises, workoutDays, sessions] = await Promise.all([
    db.exercises.toArray(),
    db.workoutDays.toArray(),
    db.sessions.toArray(),
  ])

  const backup = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    exercises: await Promise.all(
      exercises.map(async ({ gifBlob, ...exercise }) => ({
        ...exercise,
        gifDataUrl: gifBlob ? await blobToDataUrl(gifBlob) : null,
      })),
    ),
    workoutDays,
    sessions,
  }

  // Trigger a download by clicking an invisible link to the file
  const file = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = `gym-rat-backup-${backup.exportedAt.slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000) // give the browser time to save it

  return { exercises: exercises.length, workoutDays: workoutDays.length, sessions: sessions.length }
}

// Read and check a backup file, without changing anything yet
export async function readBackup(file) {
  let backup
  try {
    backup = JSON.parse(await file.text())
  } catch {
    throw new Error("This file isn't a Gym Rat backup (it's not valid JSON).")
  }
  if (backup?.format !== FORMAT) throw new Error("This file isn't a Gym Rat backup.")
  if (backup.version > VERSION) throw new Error('This backup is from a newer version of Gym Rat. Update the app first.')
  return backup
}

// Replace ALL current data with the backup. A transaction means that if anything
// goes wrong halfway, nothing is changed.
export async function restoreBackup(backup) {
  // Convert the GIFs back to files BEFORE the transaction: an IndexedDB transaction
  // closes by itself if you wait on non-database work inside it
  const exercises = await Promise.all(
    backup.exercises.map(async ({ gifDataUrl, ...exercise }) => ({
      ...exercise,
      gifBlob: gifDataUrl ? await dataUrlToBlob(gifDataUrl) : null,
    })),
  )

  await db.transaction('rw', db.exercises, db.workoutDays, db.sessions, async () => {
    await Promise.all([db.exercises.clear(), db.workoutDays.clear(), db.sessions.clear()])
    await db.exercises.bulkAdd(exercises)
    await db.workoutDays.bulkAdd(backup.workoutDays)
    await db.sessions.bulkAdd(backup.sessions)
  })
}
