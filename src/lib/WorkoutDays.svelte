<script>
  // The Workouts tab: your workout days (Push Day A, Pull Day A, ...)
  import { liveQuery } from 'dexie'
  import { db, createWorkoutDay } from './db.js'
  import { useNav } from './nav.js'
  import { startSession, activeSession } from './sessions.js'
  import { plural } from './format.js'
  import DayEditor from './DayEditor.svelte'
  import LogWorkout from './LogWorkout.svelte'

  const nav = useNav()

  const days = liveQuery(() => db.workoutDays.toArray())
  const active = liveQuery(() => activeSession()) // a workout you started but haven't finished

  async function start(day) {
    const current = await activeSession()
    if (current) {
      if (confirm(`You already have "${current.dayName}" in progress. Resume it?`)) {
        nav.push(LogWorkout, { id: current.id })
      }
      return
    }
    const id = await startSession(day.id)
    nav.push(LogWorkout, { id })
  }
  const exercises = liveQuery(() => db.exercises.toArray())

  // Look up an exercise's name by its id
  let names = $derived(new Map(($exercises ?? []).map((e) => [e.id, e.name])))

  async function newDay() {
    const id = await createWorkoutDay()
    nav.push(DayEditor, { id, isNew: true })
  }
</script>

<header class="topbar">
  <h1>Workouts</h1>
  <button class="btn primary" onclick={newDay}>+ New</button>
</header>

{#if $active}
  <button class="banner" onclick={() => nav.push(LogWorkout, { id: $active.id })}>
    <span>🔥 <strong>{$active.dayName}</strong> in progress</span>
    <span>Resume ›</span>
  </button>
{/if}

{#if $days?.length === 0}
  <div class="empty">
    <div class="rat">🐀</div>
    <p class="muted">No workouts yet. Create your first workout day, like "Push Day A".</p>
    <button class="btn primary" onclick={newDay}>Create a workout</button>
  </div>
{:else if $days}
  <div class="cards">
    {#each $days as day (day.id)}
      <div class="card">
        <div class="name">{day.name || 'Untitled workout'}</div>
        <div class="muted small">
          {plural(day.items.length, 'exercise')} · {plural(day.items.reduce((sum, item) => sum + item.sets, 0), 'set')}
        </div>
        {#if day.items.length}
          <div class="muted small preview cap">
            {day.items.map((item) => names.get(item.exerciseId)).filter(Boolean).join(' · ')}
          </div>
        {/if}
        <div class="card-buttons">
          <button class="btn primary" onclick={() => start(day)} disabled={day.items.length === 0}>▶ Start</button>
          <button class="btn" onclick={() => nav.push(DayEditor, { id: day.id })}>Edit</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .empty {
    padding: 64px 16px;
    text-align: center;
  }

  .rat {
    font-size: 56px;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .banner {
    display: flex;
    justify-content: space-between;
    width: calc(100% - 32px);
    margin: 16px 16px 0;
    padding: 14px 16px;
    border: none;
    border-radius: 14px;
    background: var(--accent);
    color: #1a0d05;
    font-weight: 600;
  }

  .card {
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
  }

  .card-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .card-buttons .primary {
    flex: 1;
  }

  .name {
    margin-bottom: 4px;
    font-size: 18px;
    font-weight: 700;
  }

  .small {
    font-size: 14px;
  }

  .preview {
    margin-top: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
