// Downloads the open-source ExerciseDB dataset (exercise list + GIFs) into public/exercisedb/.
// These files are NOT committed to git (see .gitignore). This script runs automatically
// before `npm run dev` and `npm run build`, and skips the download if everything is already there.
//
// Source: https://github.com/bootstrapping-lab/exercisedb-api

import { mkdir, writeFile, readFile, access } from 'node:fs/promises'

// Pinned to a specific commit so the data never changes under our feet
const COMMIT = '7cdc82e1a14b06799d16c819d1082f3debb425ce'
const BASE = `https://raw.githubusercontent.com/bootstrapping-lab/exercisedb-api/${COMMIT}`

const OUT_DIR = new URL('../public/exercisedb/', import.meta.url)
const MEDIA_DIR = new URL('media/', OUT_DIR)
const JSON_FILE = new URL('exercises.json', OUT_DIR)

const exists = (url) => access(url).then(() => true, () => false)

async function download(path) {
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`)
  return Buffer.from(await res.arrayBuffer())
}

// Turn the raw ExerciseDB entry into the shape our app uses
function toExercise(raw) {
  return {
    id: raw.exerciseId,
    name: raw.name,
    gif: `/exercisedb/media/${raw.exerciseId}.gif`,
    target: raw.targetMuscles,
    secondary: raw.secondaryMuscles,
    bodyParts: raw.bodyParts,
    equipment: raw.equipments,
    // "Step:1 Stand with..." -> "Stand with..."
    instructions: raw.instructions.map((s) => s.replace(/^Step:\d+\s*/, '')),
  }
}

// Fast path: if we already have the list and every GIF, there's nothing to do (works offline too)
if (await exists(JSON_FILE)) {
  const existing = JSON.parse(await readFile(JSON_FILE, 'utf8'))
  const gifChecks = await Promise.all(existing.map((e) => exists(new URL(`${e.id}.gif`, MEDIA_DIR))))
  if (gifChecks.every(Boolean)) {
    console.log(`ExerciseDB: ${existing.length} exercises already downloaded ✓`)
    process.exit(0)
  }
}

console.log('ExerciseDB: downloading exercise list...')
const exercises = JSON.parse(await download('src/data/exercises.json')).map(toExercise)

await mkdir(MEDIA_DIR, { recursive: true })

// Download GIFs 16 at a time, skipping ones we already have
const missing = []
for (const e of exercises) {
  if (!(await exists(new URL(`${e.id}.gif`, MEDIA_DIR)))) missing.push(e.id)
}
console.log(`ExerciseDB: downloading ${missing.length} GIFs...`)

let done = 0
const failed = []
async function worker() {
  while (missing.length) {
    const id = missing.pop()
    try {
      await writeFile(new URL(`${id}.gif`, MEDIA_DIR), await download(`media/${id}.gif`))
    } catch (err) {
      failed.push(id)
      console.warn(`  failed: ${id} (${err.message})`)
    }
    if (++done % 100 === 0) console.log(`  ${done} done`)
  }
}
await Promise.all(Array.from({ length: 16 }, worker))

if (failed.length) {
  console.error(`ExerciseDB: ${failed.length} GIFs failed to download. Run the command again to retry.`)
  process.exit(1)
}

// Written last, so a half-finished download never looks complete
await writeFile(JSON_FILE, JSON.stringify(exercises))
console.log(`ExerciseDB: ${exercises.length} exercises ready ✓`)
