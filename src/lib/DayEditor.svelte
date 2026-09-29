<script>
  // Edit one workout day: its name and its exercises with target sets × reps.
  // Every change is saved automatically.
  import { liveQuery } from 'dexie'
  import { db, deleteWorkoutDay, newDayItem } from './db.js'
  import { useNav } from './nav.js'
  import ExerciseGif from './ExerciseGif.svelte'
  import ExerciseDetail from './ExerciseDetail.svelte'
  import ExercisePicker from './ExercisePicker.svelte'
  import Stepper from './Stepper.svelte'

  let { id, isNew = false } = $props()

  const nav = useNav()

  // Our own editable copy of the workout day, loaded from the database
  let day = $state(null)
  $effect(() => {
    db.workoutDays.get(id).then((saved) => (day = saved))
  })

  const exercises = liveQuery(() => db.exercises.toArray())
  let exercisesById = $derived(new Map(($exercises ?? []).map((e) => [e.id, e])))

  // Autosave: this effect reads every field of `day`, so it re-runs after any change.
  // $state.snapshot turns Svelte's proxy back into a plain object the database can store
  // (remember the $state.raw bug from step 2).
  $effect(() => {
    if (day) db.workoutDays.put($state.snapshot(day))
  })

  function addExercise(exercise) {
    day.items.push(newDayItem(exercise.id))
  }

  function move(index, direction) {
    const [item] = day.items.splice(index, 1)
    day.items.splice(index + direction, 0, item)
  }

  function removeItem(index) {
    day.items.splice(index, 1)
  }

  async function back() {
    // Don't leave empty, unnamed workouts lying around
    if (!day.name.trim() && day.items.length === 0) await deleteWorkoutDay(id)
    nav.pop()
  }

  async function deleteDay() {
    if (!confirm(`Delete "${day.name || 'Untitled workout'}"?`)) return
    await deleteWorkoutDay(id)
    nav.pop()
  }

  // Put the cursor in the name field for brand-new workouts
  function focusIfNew(input) {
    if (isNew) input.focus()
  }
</script>

<header class="topbar">
  <button class="btn back" onclick={back}>‹ Workouts</button>
</header>

{#if day}
  <div class="content">
    <input
      class="name"
      bind:value={day.name}
      placeholder="Workout name, e.g. Push Day A"
      autocomplete="off"
      {@attach focusIfNew}
    />

    {#each day.items as item, i (item.key)}
      {@const exercise = exercisesById.get(item.exerciseId)}
      <div class="item">
        <div class="item-top">
          {#if exercise}
            <button class="exercise" onclick={() => nav.push(ExerciseDetail, { exercise })}>
              <ExerciseGif {exercise} size={48} />
              <span class="cap">{exercise.name}</span>
            </button>
          {:else}
            <span class="exercise muted">Removed exercise</span>
          {/if}
          <div class="actions">
            <button onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button onclick={() => move(i, 1)} disabled={i === day.items.length - 1} aria-label="Move down">↓</button>
            <button onclick={() => removeItem(i)} aria-label="Remove">✕</button>
          </div>
        </div>

        <div class="targets">
          <div class="target">
            <span class="label muted">Sets</span>
            <Stepper bind:value={item.sets} min={1} max={10} label="sets" />
          </div>
          <div class="target">
            <span class="label muted">Reps</span>
            <!-- min/max stop the range from crossing over (e.g. 12 to 8) -->
            <Stepper bind:value={item.repMin} min={1} max={item.repMax} label="minimum reps" />
            <span class="muted">to</span>
            <Stepper bind:value={item.repMax} min={item.repMin} max={50} label="maximum reps" />
          </div>
        </div>
      </div>
    {/each}

    <button class="btn add" onclick={() => nav.push(ExercisePicker, { onpick: addExercise })}>
      + Add exercise
    </button>

    {#if day.items.length > 0}
      <p class="tip muted">
        💡 Tip: once you hit the top of the rep range on every set, go a bit heavier next time.
      </p>
    {/if}

    <button class="btn danger delete" onclick={deleteDay}>Delete workout</button>
  </div>
{/if}

<style>
  .content {
    padding: 16px;
  }

  .name {
    width: 100%;
    margin-bottom: 16px;
    padding: 8px 0;
    border: none;
    border-bottom: 2px solid var(--border);
    background: none;
    color: var(--text);
    font-size: 24px;
    font-weight: 700;
  }

  .name:focus {
    outline: none;
    border-bottom-color: var(--accent);
  }

  .item {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
  }

  .item-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .exercise {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0;
    border: none;
    background: none;
    font-weight: 600;
    text-align: left;
  }

  .actions {
    display: flex;
  }

  .actions button {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    color: var(--muted);
    font-size: 16px;
  }

  .actions button:disabled {
    opacity: 0.3;
  }

  .targets {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .target {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .label {
    width: 40px;
    font-size: 14px;
  }

  .add {
    width: 100%;
    padding: 14px;
    border: 1px dashed var(--accent);
    background: none;
    color: var(--accent);
  }

  .tip {
    font-size: 14px;
    line-height: 1.4;
  }

  .delete {
    width: 100%;
    margin-top: 32px;
  }
</style>
