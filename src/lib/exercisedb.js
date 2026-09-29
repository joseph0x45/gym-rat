// Loading and searching the full ExerciseDB catalog (1,500 exercises).
// The catalog comes from our own server, so searching needs internet,
// but exercises you save are stored locally (see db.js).

let catalogPromise

export function loadCatalog() {
  // Only download the list once per app launch
  catalogPromise ??= fetch('/exercisedb/exercises.json').then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  })
  // If it failed (e.g. offline), forget the failure so the next try starts fresh
  catalogPromise.catch(() => (catalogPromise = undefined))
  return catalogPromise
}

// Every typed word must appear in the name, muscles, body part or equipment.
// Matches in the name rank higher, so "chest press" finds "lever chest press" before
// exercises that merely target the chest.
export function searchExercises(catalog, query, limit = 40) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []

  const matches = []
  for (const ex of catalog) {
    const name = ex.name.toLowerCase()
    const extra = [...ex.target, ...ex.bodyParts, ...ex.equipment].join(' ')
    if (!words.every((w) => name.includes(w) || extra.includes(w))) continue

    let score = words.filter((w) => name.includes(w)).length * 10
    if (name.startsWith(words[0])) score += 5
    matches.push({ ex, score })
  }

  return matches
    .sort((a, b) => b.score - a.score || a.ex.name.length - b.ex.name.length)
    .slice(0, limit)
    .map((m) => m.ex)
}
