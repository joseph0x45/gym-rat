// Logged workouts ("sessions"). A session looks like:
// {
//   id, dayId, dayName: 'Push Day A', startedAt, finishedAt (null while in progress),
//   exerciseIds: ['DOoWcnA', ...],
//   entries: [{
//     key, exerciseId, name: 'lever chest press',
//     target: { sets: 3, repMin: 8, repMax: 12 },
//     previous: [{ weight: 40, reps: 12 }, ...],   // what you did last time
//     sets: [{ weight: '40', reps: '12', effort: 'easy', done: true }, ...],
//   }]
// }
// Names are copied into the session so your history still makes sense
// even if you later remove an exercise or rename a workout.
import { db } from './db.js'

// The sets from the most recent finished session that included this exercise
async function lastSetsFor(exerciseId) {
  const sessions = await db.sessions
    .where('exerciseIds')
    .equals(exerciseId)
    .filter((s) => s.finishedAt)
    .reverse()
    .sortBy('startedAt')
  const entry = sessions[0]?.entries.find((e) => e.exerciseId === exerciseId)
  return entry ? entry.sets.map(({ weight, reps }) => ({ weight, reps })) : []
}

export async function startSession(dayId) {
  const day = await db.workoutDays.get(dayId)
  const exercises = await db.exercises.bulkGet(day.items.map((item) => item.exerciseId))

  const entries = []
  for (const [i, item] of day.items.entries()) {
    const exercise = exercises[i]
    if (!exercise) continue
    const previous = await lastSetsFor(item.exerciseId)
    entries.push({
      key: crypto.randomUUID(),
      exerciseId: item.exerciseId,
      name: exercise.name,
      target: { sets: item.sets, repMin: item.repMin, repMax: item.repMax },
      previous,
      // Start each set with last time's weight for that set, if we have one
      sets: Array.from({ length: item.sets }, (_, s) =>
        newSet(previous[s]?.weight ?? previous.at(-1)?.weight),
      ),
    })
  }

  return db.sessions.add({
    dayId,
    dayName: day.name || 'Untitled workout',
    startedAt: Date.now(),
    finishedAt: null,
    exerciseIds: entries.map((e) => e.exerciseId),
    entries,
  })
}

export function newSet(weight) {
  return { weight: weight == null ? '' : String(weight), reps: '', effort: null, done: false }
}

export function activeSession() {
  return db.sessions.filter((s) => !s.finishedAt).first()
}

// "42,5" or "42.5" -> 42.5. Returns null for empty or invalid input.
export function parseNumber(value) {
  const text = String(value ?? '').trim().replace(',', '.')
  const n = Number(text)
  return text !== '' && Number.isFinite(n) && n >= 0 ? n : null
}

// Save a finished session: keep only checked-off sets, as numbers
export function finishSession(session) {
  const entries = session.entries.map((entry) => ({
    ...entry,
    sets: entry.sets
      .filter((set) => set.done)
      .map((set) => ({ weight: parseNumber(set.weight), reps: parseNumber(set.reps), effort: set.effort })),
  }))
  return db.sessions.put({
    ...session,
    finishedAt: Date.now(),
    entries,
    exerciseIds: entries.filter((e) => e.sets.length).map((e) => e.exerciseId),
  })
}

// Every finished session that included this exercise, oldest first, with its best set
// (heaviest weight; if tied, most reps). Used for the progress chart.
export async function exerciseHistory(exerciseId) {
  const sessions = await db.sessions
    .where('exerciseIds')
    .equals(exerciseId)
    .filter((s) => s.finishedAt)
    .sortBy('startedAt')

  return sessions
    .map((session) => {
      const sets = session.entries.find((e) => e.exerciseId === exerciseId)?.sets ?? []
      const best = sets.reduce(
        (top, set) => (!top || set.weight > top.weight || (set.weight === top.weight && set.reps > top.reps) ? set : top),
        null,
      )
      return { sessionId: session.id, date: session.startedAt, sets, best }
    })
    .filter((h) => h.best)
}

export function deleteSession(id) {
  return db.sessions.delete(id)
}
