<script>
  // One tappable exercise in a list (used by both My Exercises and the search results)
  import ExerciseGif from './ExerciseGif.svelte'

  let { exercise, saved = false, onclick } = $props()
</script>

<button class="row" {onclick}>
  <ExerciseGif {exercise} />
  <div class="info">
    <div class="name cap">{exercise.name}</div>
    <div class="details muted cap">{exercise.target.join(', ')} · {exercise.equipment.join(', ')}</div>
  </div>
  {#if saved}<span class="check" aria-label="In your library">✓</span>{/if}
</button>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 16px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: none;
    text-align: left;
  }

  .row:active {
    background: var(--surface);
  }

  .info {
    flex: 1;
    min-width: 0; /* lets long names shrink instead of overflowing */
  }

  .name {
    font-weight: 600;
  }

  .details {
    margin-top: 2px;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .check {
    color: var(--accent);
    font-weight: 700;
  }
</style>
