<script>
  // "My Exercises": everything you've saved to your library
  import { liveQuery } from 'dexie'
  import { db } from './db.js'
  import ExerciseRow from './ExerciseRow.svelte'

  let { onadd, onopen } = $props()

  // liveQuery re-runs automatically whenever the exercises table changes,
  // so the list updates by itself when you add or remove something.
  // Read it with $exercises (undefined while loading).
  const exercises = liveQuery(() => db.exercises.orderBy('name').toArray())
</script>

<header class="topbar">
  <h1>My Exercises</h1>
  <button class="btn primary" onclick={onadd}>+ Add</button>
</header>

{#if $exercises?.length === 0}
  <div class="empty">
    <div class="rat">🐀</div>
    <p class="muted">No exercises yet. Let's find some!</p>
    <button class="btn primary" onclick={onadd}>Find exercises</button>
  </div>
{:else if $exercises}
  {#each $exercises as exercise (exercise.id)}
    <ExerciseRow {exercise} onclick={() => onopen(exercise)} />
  {/each}
{/if}

<style>
  .empty {
    padding: 64px 16px;
    text-align: center;
  }

  .rat {
    font-size: 56px;
  }
</style>
