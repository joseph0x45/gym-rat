// Small helpers for showing numbers, dates and durations nicely

export const EFFORTS = [
  { value: 'easy', emoji: '😊', label: 'Easy' },
  { value: 'solid', emoji: '😐', label: 'Solid' },
  { value: 'limit', emoji: '😵', label: 'Near my limit' },
]

export const effortEmoji = (value) => EFFORTS.find((e) => e.value === value)?.emoji ?? ''

// 42.5 -> "42.5", 40 -> "40", 1736 -> "1,736" (separator depends on your phone's region)
export const formatWeight = (kg) => (Math.round(kg * 100) / 100).toLocaleString()

// plural(1, 'set') -> "1 set", plural(3, 'set') -> "3 sets"
export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

// 3725000 ms -> "1:02:05", 125000 -> "2:05"
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

// -> "Tue 29 Sep"
export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

// -> "Sep 29" (for chart axes, where space is tight)
export function formatShortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

// "40×12 · 45×10" for a list of sets
export const formatSets = (sets) => sets.map((s) => `${formatWeight(s.weight)}×${s.reps}`).join(' · ')
