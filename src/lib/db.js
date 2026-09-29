// The app's database, stored in the browser (IndexedDB) so it works offline.
// Dexie is a small library that makes IndexedDB much nicer to use.
import Dexie from 'dexie'

export const db = new Dexie('gym-rat')

// Each version lists the tables and which fields are indexed (searchable/sortable).
// The first field is the primary key. Other fields are stored too, just not indexed.
// When we add tables later (workout days, sessions), we'll add db.version(2).
db.version(1).stores({
  exercises: 'id, name', // your saved exercises: ExerciseDB data + the GIF file itself
})

// Save an exercise to your library, including its GIF, so it works offline forever
export async function saveExercise(exercise) {
  // Re-adding something you just removed? We still have its GIF, no need to download it again
  let gifBlob = exercise.gifBlob
  if (!gifBlob) {
    const res = await fetch(exercise.gif)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    gifBlob = await res.blob()
  }
  await db.exercises.put({ ...exercise, gifBlob, addedAt: Date.now() })
}

export function removeExercise(id) {
  return db.exercises.delete(id)
}
