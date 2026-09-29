<script>
  // The screen you use at the gym: log weight × reps × effort for every set.
  // Everything is saved as you go, so closing the app never loses your workout.
  import { liveQuery } from 'dexie'
  import { db } from './db.js'
  import { finishSession, deleteSession, newSet, parseNumber } from './sessions.js'
  import { useNav } from './nav.js'
  import { EFFORTS, formatDuration, formatSets } from './format.js'
  import ExerciseGif from './ExerciseGif.svelte'
  import ExerciseDetail from './ExerciseDetail.svelte'
  import SessionDetail from './SessionDetail.svelte'

  let { id } = $props()

  const nav = useNav()

  // Editable copy of the session, autosaved on every change (same idea as DayEditor)
  let session = $state(null)
  $effect(() => {
    db.sessions.get(id).then((saved) => (session = saved))
  })
  $effect(() => {
    if (session) db.sessions.put($state.snapshot(session))
  })

  const exercises = liveQuery(() => db.exercises.toArray())
  let exercisesById = $derived(new Map(($exercises ?? []).map((e) => [e.id, e])))

  // Ticking clock for the workout timer
  let now = $state(Date.now())
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 1000)
    return () => clearInterval(timer)
  })

  // The set you just tried to check off with a missing weight or reps, to highlight it
  let invalidSet = $state(null)

  function toggleDone(set) {
    if (set.done) {
      set.done = false
      return
    }
    if (parseNumber(set.weight) === null || parseNumber(set.reps) === null) {
      invalidSet = set
      return
    }
    invalidSet = null
    set.weight = String(parseNumber(set.weight)) // "42,5" -> "42.5"
    set.done = true
  }

  function addSet(entry) {
    entry.sets.push(newSet(entry.sets.at(-1)?.weight))
  }

  // Hit the top of the rep range on every set last time? Time to go heavier.
  function readyToProgress(entry) {
    const { previous, target } = entry
    return previous.length >= target.sets && previous.every((s) => s.reps >= target.repMax)
  }

  let totalSets = $derived(session?.entries.reduce((n, e) => n + e.sets.length, 0) ?? 0)
  let doneSets = $derived(session?.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0) ?? 0)

  async function finish() {
    if (doneSets === 0) {
      alert('Check off at least one set first (tap ✓), or discard the workout.')
      return
    }
    const unchecked = totalSets - doneSets
    if (unchecked && !confirm(`${unchecked} set${unchecked === 1 ? " isn't" : "s aren't"} checked off and won't be saved. Finish anyway?`))
      return
    const final = $state.snapshot(session)
    session = null // stops the autosave
    await finishSession(final)
    await nav.pop()
    nav.push(SessionDetail, { id, justFinished: true })
  }

  async function discard() {
    if (!confirm('Discard this workout? Nothing from it will be saved.')) return
    session = null
    await deleteSession(id)
    nav.pop()
  }
</script>

<header class="topbar">
  <button class="btn back" onclick={() => nav.pop()}>‹ Back</button>
  {#if session}
    <h1>{session.dayName}</h1>
    <span class="timer">{formatDuration(now - session.startedAt)}</span>
  {/if}
</header>

{#if session}
  <div class="content">
    {#each session.entries as entry (entry.key)}
      {@const exercise = exercisesById.get(entry.exerciseId)}
      <section class="entry">
        <button class="entry-head" onclick={() => exercise && nav.push(ExerciseDetail, { exercise })}>
          {#if exercise}<ExerciseGif {exercise} size={44} />{/if}
          <div>
            <div class="name cap">{entry.name}</div>
            <div class="muted small">Target: {entry.target.sets} × {entry.target.repMin}–{entry.target.repMax}</div>
          </div>
        </button>

        {#if entry.previous.length}
          <p class="previous muted small">Last time: {formatSets(entry.previous)} kg</p>
          {#if readyToProgress(entry)}
            <p class="progress small">💪 You hit {entry.target.repMax} reps on every set last time. Go heavier!</p>
          {/if}
        {/if}

        <div class="sets">
          <div class="set-row labels muted">
            <span>Set</span><span>kg</span><span>Reps</span><span>Effort</span><span></span>
          </div>
          {#each entry.sets as set, i}
            <div class="set-row" class:done={set.done}>
              <span class="set-number">{i + 1}</span>
              <input
                inputmode="decimal"
                placeholder={entry.previous[i] ? String(entry.previous[i].weight) : 'kg'}
                bind:value={set.weight}
                class:invalid={invalidSet === set && parseNumber(set.weight) === null}
                disabled={set.done}
                aria-label="Set {i + 1} weight in kg"
              />
              <input
                inputmode="numeric"
                placeholder={entry.previous[i] ? String(entry.previous[i].reps) : `${entry.target.repMin}–${entry.target.repMax}`}
                bind:value={set.reps}
                class:invalid={invalidSet === set && parseNumber(set.reps) === null}
                disabled={set.done}
                aria-label="Set {i + 1} reps"
              />
              <div class="efforts">
                {#each EFFORTS as effort}
                  <button
                    class:selected={set.effort === effort.value}
                    onclick={() => (set.effort = set.effort === effort.value ? null : effort.value)}
                    aria-label={effort.label}
                    aria-pressed={set.effort === effort.value}>{effort.emoji}</button
                  >
                {/each}
              </div>
              <button class="check" class:checked={set.done} onclick={() => toggleDone(set)} aria-label="Set {i + 1} done">✓</button>
            </div>
          {/each}
        </div>

        <div class="set-buttons">
          <button class="btn small-btn" onclick={() => addSet(entry)}>+ Add set</button>
          {#if entry.sets.length > 1 && !entry.sets.at(-1).done}
            <button class="btn small-btn" onclick={() => entry.sets.pop()}>− Remove set</button>
          {/if}
        </div>
      </section>
    {/each}

    <button class="btn primary finish" onclick={finish}>Finish workout ({doneSets}/{totalSets} sets)</button>
    <button class="btn danger discard" onclick={discard}>Discard workout</button>
  </div>
{/if}

<style>
  .timer {
    color: var(--accent);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .content {
    padding: 12px 12px 32px;
  }

  .entry {
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface);
  }

  .entry-head {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    text-align: left;
  }

  .name {
    font-weight: 700;
  }

  .small {
    font-size: 14px;
  }

  .previous {
    margin: 10px 0 0;
  }

  .progress {
    margin: 6px 0 0;
    color: var(--accent);
    font-weight: 600;
  }

  .sets {
    margin-top: 10px;
  }

  /* Set | kg | reps | effort | ✓ */
  .set-row {
    display: grid;
    /* Fixed effort width (3 × 32px) so every row, including the labels, lines up */
    grid-template-columns: 28px 1fr 1fr 96px 40px;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
  }

  .labels {
    font-size: 12px;
  }

  .labels span:nth-child(2),
  .labels span:nth-child(3),
  .labels span:nth-child(4) {
    text-align: center;
  }

  .set-number {
    color: var(--muted);
    font-weight: 600;
    text-align: center;
  }

  .set-row input {
    width: 100%;
    min-width: 0;
    height: 40px;
    padding: 0 4px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    text-align: center;
    font-weight: 600;
  }

  .set-row input::placeholder {
    color: #5c5e66;
    font-weight: 400;
  }

  .set-row input:focus {
    outline: 2px solid var(--accent);
    border-color: transparent;
  }

  .set-row input.invalid {
    border-color: var(--danger);
  }

  .set-row.done input {
    border-color: transparent;
    background: none;
    color: var(--text);
    -webkit-text-fill-color: var(--text); /* Safari greys out disabled inputs */
    opacity: 1;
  }

  .efforts {
    display: flex;
  }

  .efforts button {
    width: 32px;
    height: 40px;
    padding: 0;
    border: none;
    background: none;
    font-size: 18px;
    opacity: 0.3;
    filter: grayscale(1);
  }

  .efforts button.selected {
    opacity: 1;
    filter: none;
  }

  .check {
    height: 40px;
    border: none;
    border-radius: 8px;
    background: var(--surface-2);
    color: var(--muted);
    font-size: 18px;
    font-weight: 700;
  }

  .check.checked {
    background: var(--accent);
    color: #1a0d05;
  }

  .set-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .small-btn {
    padding: 8px 12px;
    font-size: 14px;
  }

  .finish {
    width: 100%;
    margin-top: 8px;
    padding: 16px;
    font-size: 17px;
  }

  .discard {
    width: 100%;
    margin-top: 12px;
  }
</style>
