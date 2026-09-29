<script>
  import { tick } from 'svelte'
  import { provideNav } from './lib/nav.js'
  import WorkoutDays from './lib/WorkoutDays.svelte'
  import Library from './lib/Library.svelte'

  // Which tab is showing at the bottom level
  let tab = $state('workouts') // 'workouts' | 'exercises'

  // Screens opened on top of the tabs, e.g. [DayEditor, ExercisePicker]. The last one is visible.
  // $state.raw: we replace the whole array on every change, so no deep tracking needed.
  let stack = $state.raw([])
  let nextId = 0

  // Remember each screen's scroll position so "Back" returns to the same spot
  const scrollPositions = []

  provideNav({
    async push(component, props = {}) {
      scrollPositions.push(window.scrollY)
      stack = [...stack, { id: nextId++, component, props }]
      await tick() // wait for Svelte to update the page
      window.scrollTo(0, 0)
    },
    async pop() {
      stack = stack.slice(0, -1)
      await tick()
      window.scrollTo(0, scrollPositions.pop() ?? 0)
    },
  })
</script>

<!-- Screens underneath stay mounted but hidden, so they keep their state (e.g. your search) -->
<div class="tabs" hidden={stack.length > 0}>
  {#if tab === 'workouts'}
    <WorkoutDays />
  {:else}
    <Library />
  {/if}

  <nav class="tabbar">
    <button class:active={tab === 'workouts'} onclick={() => (tab = 'workouts')}>
      <span class="icon">🏋️</span>Workouts
    </button>
    <button class:active={tab === 'exercises'} onclick={() => (tab = 'exercises')}>
      <span class="icon">📚</span>Exercises
    </button>
  </nav>
</div>

{#each stack as screen, i (screen.id)}
  <div class="screen" hidden={i !== stack.length - 1}>
    <screen.component {...screen.props} />
  </div>
{/each}

<style>
  .tabs {
    padding-bottom: 64px; /* room for the tab bar (body already adds the home-indicator space) */
  }

  .tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    display: flex;
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--surface);
    border-top: 1px solid var(--border);
  }

  .tabbar button {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 0;
    border: none;
    background: none;
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
  }

  .tabbar button.active {
    color: var(--accent);
  }

  .icon {
    font-size: 22px;
  }
</style>
