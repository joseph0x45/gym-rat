<script>
  // Full-screen view of one exercise: big GIF, muscles, equipment, instructions,
  // and a button to add it to (or remove it from) your library
  import { liveQuery } from 'dexie'
  import { db, saveExercise, removeExercise, workoutDaysUsing } from './db.js'
  import { useNav } from './nav.js'
  import ExerciseGif from './ExerciseGif.svelte'
  import ExerciseProgress from './ExerciseProgress.svelte'

  let { exercise } = $props()

  const nav = useNav()
  const onclose = () => nav.pop()

  // The saved copy from the database: undefined = still checking, null = not saved
  const saved = liveQuery(async () => (await db.exercises.get(exercise.id)) ?? null)

  let busy = $state(false)
  let error = $state('')

  async function add() {
    busy = true
    error = ''
    try {
      await saveExercise(exercise)
    } catch (err) {
      console.error(err)
      error = "Couldn't save the exercise. Are you online?"
    }
    busy = false
  }

  async function remove() {
    const days = await workoutDaysUsing(exercise.id)
    const message = days.length
      ? `Remove "${exercise.name}"? It will also be removed from: ${days.map((d) => d.name || 'Untitled workout').join(', ')}.`
      : `Remove "${exercise.name}" from your library?`
    if (!confirm(message)) return
    await removeExercise(exercise.id)
  }
</script>

<div class="overlay">
  <header class="topbar">
    <button class="btn back" onclick={onclose}>‹ Back</button>
  </header>

  <div class="content">
    <div class="gif">
      <ExerciseGif exercise={$saved ?? exercise} size={270} />
    </div>

    <h2 class="cap">{exercise.name}</h2>

    <div class="chips">
      {#each exercise.target as muscle}<span class="chip target cap">{muscle}</span>{/each}
      {#each exercise.secondary as muscle}<span class="chip cap">{muscle}</span>{/each}
    </div>
    <p class="muted cap">Equipment: {exercise.equipment.join(', ')}</p>

    <!-- Only shows up once you've logged this exercise -->
    <ExerciseProgress exerciseId={exercise.id} />

    <h3>How to do it</h3>
    <ol>
      {#each exercise.instructions as step}<li>{step}</li>{/each}
    </ol>
  </div>

  <footer>
    {#if error}<p class="error">{error}</p>{/if}
    {#if $saved === null}
      <button class="btn primary full" onclick={add} disabled={busy}>
        {busy ? 'Saving…' : '+ Add to my exercises'}
      </button>
    {:else if $saved}
      <button class="btn danger full" onclick={remove}>Remove from my exercises</button>
    {/if}
  </footer>
</div>

<style>
  /* Covers the whole screen on top of the current page */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    background: var(--bg);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .gif {
    display: flex;
    justify-content: center;
  }

  h2 {
    margin: 16px 0 8px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--surface-2);
    font-size: 14px;
  }

  .chip.target {
    background: var(--accent);
    color: #1a0d05;
    font-weight: 600;
  }

  ol {
    padding-left: 20px;
    line-height: 1.5;
  }

  li {
    margin-bottom: 8px;
  }

  footer {
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--border);
  }

  .full {
    width: 100%;
    padding: 14px;
  }

  .error {
    margin: 0 0 8px;
    color: var(--danger);
    text-align: center;
  }
</style>
