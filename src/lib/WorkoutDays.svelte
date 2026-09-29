<script>
  // The Workouts tab: your workout days (Push Day A, Pull Day A, ...)
  import { liveQuery } from 'dexie'
  import { db, createWorkoutDay } from './db.js'
  import { useNav } from './nav.js'
  import DayEditor from './DayEditor.svelte'

  const nav = useNav()

  const days = liveQuery(() => db.workoutDays.toArray())
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

{#if $days?.length === 0}
  <div class="empty">
    <div class="rat">🐀</div>
    <p class="muted">No workouts yet. Create your first workout day, like "Push Day A".</p>
    <button class="btn primary" onclick={newDay}>Create a workout</button>
  </div>
{:else if $days}
  <div class="cards">
    {#each $days as day (day.id)}
      <button class="card" onclick={() => nav.push(DayEditor, { id: day.id })}>
        <div class="name">{day.name || 'Untitled workout'}</div>
        <div class="muted small">
          {day.items.length}
          {day.items.length === 1 ? 'exercise' : 'exercises'} · {day.items.reduce((sum, item) => sum + item.sets, 0)} sets
        </div>
        {#if day.items.length}
          <div class="muted small preview cap">
            {day.items.map((item) => names.get(item.exerciseId)).filter(Boolean).join(' · ')}
          </div>
        {/if}
      </button>
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

  .card {
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
    text-align: left;
  }

  .card:active {
    background: var(--surface-2);
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
