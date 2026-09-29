<script>
  // A finished workout: what you did for every exercise
  import { liveQuery } from 'dexie'
  import { db } from './db.js'
  import { deleteSession } from './sessions.js'
  import { useNav } from './nav.js'
  import { effortEmoji, formatDate, formatDuration, formatWeight } from './format.js'

  let { id, justFinished = false } = $props()

  const nav = useNav()
  const session = liveQuery(() => db.sessions.get(id))

  let setCount = $derived($session?.entries.reduce((n, e) => n + e.sets.length, 0) ?? 0)
  // Total kg moved: weight × reps, added up over every set
  let volume = $derived(
    $session?.entries.reduce((sum, e) => sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0) ?? 0,
  )

  async function remove() {
    if (!confirm('Delete this workout from your history?')) return
    await deleteSession(id)
    nav.pop()
  }
</script>

<header class="topbar">
  <button class="btn back" onclick={() => nav.pop()}>‹ Back</button>
</header>

{#if $session}
  <div class="content">
    {#if justFinished}<div class="celebrate">🐀🎉</div>{/if}
    <h2>{justFinished ? 'Workout complete!' : $session.dayName}</h2>
    <p class="muted">
      {[justFinished && $session.dayName, formatDate($session.startedAt), formatDuration($session.finishedAt - $session.startedAt)]
        .filter(Boolean)
        .join(' · ')}
    </p>

    <div class="stats">
      <div><strong>{setCount}</strong><span class="muted">{setCount === 1 ? 'set' : 'sets'}</span></div>
      <div><strong>{formatWeight(volume)}</strong><span class="muted">kg lifted</span></div>
    </div>

    {#each $session.entries as entry (entry.key)}
      <section class="entry">
        <div class="name cap">{entry.name}</div>
        {#if entry.sets.length}
          <ol>
            {#each entry.sets as set}
              <li>{formatWeight(set.weight)} kg × {set.reps} {effortEmoji(set.effort)}</li>
            {/each}
          </ol>
        {:else}
          <p class="muted small">Skipped</p>
        {/if}
      </section>
    {/each}

    <button class="btn danger delete" onclick={remove}>Delete from history</button>
  </div>
{/if}

<style>
  .content {
    padding: 16px;
  }

  .celebrate {
    font-size: 56px;
    text-align: center;
  }

  h2 {
    margin: 8px 0 4px;
  }

  p {
    margin: 0;
  }

  .stats {
    display: flex;
    gap: 12px;
    margin: 16px 0;
  }

  .stats div {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px;
    border-radius: 12px;
    background: var(--surface);
  }

  .stats strong {
    font-size: 22px;
  }

  .entry {
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }

  .name {
    font-weight: 700;
  }

  ol {
    margin: 6px 0 0;
    padding-left: 22px;
    line-height: 1.6;
    font-variant-numeric: tabular-nums;
  }

  .small {
    margin-top: 4px;
    font-size: 14px;
  }

  .delete {
    width: 100%;
    margin-top: 32px;
  }
</style>
