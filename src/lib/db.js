// The app's database, stored in the browser (IndexedDB) so it works offline.
// Dexie is a small library that makes IndexedDB much nicer to use.
import Dexie from 'dexie'

export const db = new Dexie('gym-rat')

// Each version lists the tables and which fields are indexed (searchable/sortable).
// The first field is the primary key ("++" means an auto-increasing number).
// Other fields are stored too, just not indexed.
// Never edit an old version: add a new one, and Dexie upgrades existing data for you.
db.version(1).stores({
  exercises: 'id, name', // your saved exercises: ExerciseDB data + the GIF file itself
})

db.version(2).stores({
  // e.g. { id: 1, name: 'Push Day A', items: [{ key, exerciseId, sets: 3, repMin: 8, repMax: 12 }] }
  workoutDays: '++id',
})

// ---- Exercises ----

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

// Removes the exercise from your library AND from any workout days that use it.
// A transaction makes both changes happen together, or not at all.
export function removeExercise(id) {
  return db.transaction('rw', db.exercises, db.workoutDays, async () => {
    await db.exercises.delete(id)
    await db.workoutDays.toCollection().modify((day) => {
      day.items = day.items.filter((item) => item.exerciseId !== id)
    })
  })
}

// ---- Workout days ----

export function workoutDaysUsing(exerciseId) {
  return db.workoutDays.filter((day) => day.items.some((item) => item.exerciseId === exerciseId)).toArray()
}

export function createWorkoutDay() {
  return db.workoutDays.add({ name: '', items: [], createdAt: Date.now() }) // returns the new id
}

export function deleteWorkoutDay(id) {
  return db.workoutDays.delete(id)
}

// A new exercise in a workout day, with a beginner-friendly default of 3 × 8–12
export function newDayItem(exerciseId) {
  return { key: crypto.randomUUID(), exerciseId, sets: 3, repMin: 8, repMax: 12 }
}
