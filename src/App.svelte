<script>
  import Library from './lib/Library.svelte'
  import AddExercise from './lib/AddExercise.svelte'
  import ExerciseDetail from './lib/ExerciseDetail.svelte'

  // Which screen is showing. $state makes the page update when it changes.
  let screen = $state('library') // 'library' | 'add'

  // The exercise being viewed in detail (shown on top of the current screen), or null.
  // $state.raw keeps the object as-is: plain $state would wrap it in a "proxy" to track
  // changes inside it, and the database can't store proxies.
  let viewing = $state.raw(null)
</script>

{#if screen === 'library'}
  <Library onadd={() => (screen = 'add')} onopen={(ex) => (viewing = ex)} />
{:else if screen === 'add'}
  <AddExercise onback={() => (screen = 'library')} onopen={(ex) => (viewing = ex)} />
{/if}

{#if viewing}
  <ExerciseDetail exercise={viewing} onclose={() => (viewing = null)} />
{/if}
