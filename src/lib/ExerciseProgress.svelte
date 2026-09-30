<script>
  // "Progress" for one exercise: stat tiles, a chart of your top weight per workout,
  // and every logged session as a list (so no number is only visible inside the chart)
  import { liveQuery } from 'dexie'
  import { exerciseHistory } from './sessions.js'
  import { formatDate, formatSets, formatWeight } from './format.js'
  import ProgressChart from './ProgressChart.svelte'

  let { exerciseId } = $props()

  const history = liveQuery(() => exerciseHistory(exerciseId))

  // Best set ever: heaviest weight, then most reps
  let best = $derived(
    $history?.reduce(
      (top, h) => (!top || h.best.weight > top.weight || (h.best.weight === top.weight && h.best.reps > top.reps) ? h.best : top),
      null,
    ),
  )
  // Change in top weight from your first workout to your latest
  let change = $derived($history?.length > 1 ? $history.at(-1).best.weight - $history[0].best.weight : null)

  // The list below the chart shows the latest 10 unless you ask for all of them
  let showAll = $state(false)
  let newestFirst = $derived(($history ?? []).toReversed())
  let visibleLog = $derived(showAll ? newestFirst : newestFirst.slice(0, 10))

  let points = $derived(
    ($history ?? []).map((h) => ({ x: h.date, y: h.best.weight, detail: `${formatSets(h.sets)} kg` })),
  )
</script>

{#if $history?.length}
  <section class="progress">
    <h3>📈 Progress</h3>

    <div class="tiles">
      <div class="tile">
        <span class="label">Best set</span>
        <span class="value">{formatWeight(best.weight)} kg × {best.reps}</span>
      </div>
      <div class="tile">
        <span class="label">Workouts</span>
        <span class="value">{$history.length}</span>
      </div>
      {#if change !== null}
        <div class="tile">
          <span class="label">Since first</span>
          <span class="value">{change > 0 ? '+' : ''}{formatWeight(change)} kg</span>
        </div>
      {/if}
    </div>

    {#if points.length >= 2}
      <p class="chart-title muted">Top weight per workout (kg). Drag across the chart for details.</p>
      <ProgressChart {points} label="Top weight per workout, from {formatDate(points[0].x)} to {formatDate(points.at(-1).x)}" />
    {:else}
      <p class="muted small">Log this exercise again to see your progress chart.</p>
    {/if}

    <!-- The same data as a list, newest first -->
    <ul class="log">
      {#each visibleLog as h (h.sessionId)}
        <li>
          <span class="date muted">{formatDate(h.date)}</span>
          <span>{formatSets(h.sets)} kg</span>
        </li>
      {/each}
    </ul>
    {#if newestFirst.length > 10 && !showAll}
      <button class="btn show-all" onclick={() => (showAll = true)}>Show all {newestFirst.length} workouts</button>
    {/if}
  </section>
{/if}

<style>
  .progress {
    margin-top: 24px;
  }

  h3 {
    margin: 0 0 12px;
  }

  .tiles {
    display: flex;
    gap: 8px;
  }

  .tile {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--surface);
  }

  .label {
    color: var(--muted);
    font-size: 12px;
  }

  .value {
    font-size: 17px;
    font-weight: 600;
    white-space: nowrap;
  }

  .chart-title {
    margin: 16px 0 36px; /* room for the tooltip above the chart */
    font-size: 13px;
  }

  .small {
    font-size: 14px;
  }

  .log {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    font-size: 14px;
  }

  .log li {
    display: flex;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
    font-variant-numeric: tabular-nums;
  }

  .date {
    min-width: 96px;
  }

  .show-all {
    width: 100%;
    margin-top: 8px;
    font-size: 14px;
  }
</style>
