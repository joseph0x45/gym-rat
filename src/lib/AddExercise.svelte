<script>
  // Search the ExerciseDB catalog and pick exercises to add to your library
  import { liveQuery } from 'dexie'
  import { db } from './db.js'
  import { loadCatalog, searchExercises } from './exercisedb.js'
  import { useNav } from './nav.js'
  import ExerciseRow from './ExerciseRow.svelte'
  import ExerciseDetail from './ExerciseDetail.svelte'

  const nav = useNav()
  const onback = () => nav.pop()
  const onopen = (exercise) => nav.push(ExerciseDetail, { exercise })

  // $state.raw: the catalog is big and never changes, so Svelte doesn't need
  // to track changes deep inside it (faster than plain $state)
  let catalog = $state.raw([])
  let status = $state('loading') // 'loading' | 'ready' | 'error'
  let query = $state('')

  // $derived recalculates automatically whenever query or catalog changes
  let results = $derived(searchExercises(catalog, query))

  // IDs of exercises already in your library, to show a ✓ next to them
  const savedIdList = liveQuery(() => db.exercises.toCollection().primaryKeys())
  let savedIds = $derived(new Set($savedIdList ?? []))

  function load() {
    status = 'loading'
    loadCatalog().then(
      (data) => {
        catalog = data
        status = 'ready'
      },
      () => (status = 'error'),
    )
  }
  load()
</script>

<header class="topbar">
  <button class="btn back" onclick={onback}>‹ Back</button>
  <h1>Add Exercise</h1>
</header>

<div class="search">
  <input
    type="search"
    placeholder="Search e.g. chest press, lever, curl"
    bind:value={query}
    autocomplete="off"
    autocorrect="off"
    enterkeyhint="search"
  />
</div>

{#if status === 'loading'}
  <p class="message muted">Loading exercises…</p>
{:else if status === 'error'}
  <div class="message">
    <p class="muted">Couldn't load exercises. Adding exercises needs an internet connection.</p>
    <button class="btn" onclick={load}>Try again</button>
  </div>
{:else if !query.trim()}
  <p class="message muted">
    Search {catalog.length} exercises by name, muscle or equipment. Machines are usually called
    "lever".
  </p>
{:else if results.length === 0}
  <p class="message muted">No exercises match "{query}".</p>
{:else}
  {#each results as exercise (exercise.id)}
    <ExerciseRow {exercise} saved={savedIds.has(exercise.id)} onclick={() => onopen(exercise)} />
  {/each}
{/if}

<style>
  .search {
    position: sticky;
    top: calc(56px + env(safe-area-inset-top)); /* just below the top bar */
    z-index: 5;
    padding: 12px 16px;
    background: var(--bg);
  }

  input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--surface);
    color: var(--text);
  }

  input:focus {
    outline: 2px solid var(--accent);
    border-color: transparent;
  }

  .message {
    padding: 16px;
    text-align: center;
  }
</style>
