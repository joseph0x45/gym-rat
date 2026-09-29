<script>
  // Pick an exercise from your library (used when adding exercises to a workout day)
  import { liveQuery } from 'dexie'
  import { db } from './db.js'
  import { useNav } from './nav.js'
  import ExerciseRow from './ExerciseRow.svelte'
  import AddExercise from './AddExercise.svelte'

  // onpick: function the parent gives us, called with the chosen exercise
  let { onpick } = $props()

  const nav = useNav()
  const exercises = liveQuery(() => db.exercises.orderBy('name').toArray())

  function pick(exercise) {
    onpick(exercise)
    nav.pop()
  }
</script>

<header class="topbar">
  <button class="btn back" onclick={() => nav.pop()}>‹ Back</button>
  <h1>Choose Exercise</h1>
</header>

<!-- Exercises you add from the search show up here right away (liveQuery) -->
<button class="find" onclick={() => nav.push(AddExercise)}>🔍 Find new exercises</button>

{#if $exercises?.length === 0}
  <p class="message muted">Your library is empty. Find some exercises first!</p>
{:else if $exercises}
  {#each $exercises as exercise (exercise.id)}
    <ExerciseRow {exercise} onclick={() => pick(exercise)} />
  {/each}
{/if}

<style>
  .find {
    display: block;
    width: 100%;
    padding: 16px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: none;
    color: var(--accent);
    font-weight: 600;
    text-align: left;
  }

  .message {
    padding: 16px;
    text-align: center;
  }
</style>
