<script>
  // The History tab: every finished workout, newest first
  import { liveQuery } from 'dexie'
  import { db } from './db.js'
  import { useNav } from './nav.js'
  import { formatDate, formatDuration, plural } from './format.js'
  import SessionDetail from './SessionDetail.svelte'

  const nav = useNav()

  const sessions = liveQuery(() =>
    db.sessions
      .orderBy('startedAt')
      .reverse()
      .filter((s) => s.finishedAt)
      .toArray(),
  )

  const countSets = (session) => session.entries.reduce((n, e) => n + e.sets.length, 0)
</script>

<header class="topbar">
  <h1>History</h1>
</header>

{#if $sessions?.length === 0}
  <div class="empty">
    <div class="rat">🐀</div>
    <p class="muted">No workouts logged yet. Your finished workouts will show up here.</p>
  </div>
{:else if $sessions}
  {#each $sessions as session (session.id)}
    <button class="row" onclick={() => nav.push(SessionDetail, { id: session.id })}>
      <div class="date">{formatDate(session.startedAt)}</div>
      <div class="info">
        <div class="name">{session.dayName}</div>
        <div class="muted small">
          {plural(countSets(session), 'set')} · {formatDuration(session.finishedAt - session.startedAt)}
        </div>
      </div>
      <span class="muted">›</span>
    </button>
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

  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    border: none;
    border-bottom: 1px solid var(--border);
    background: none;
    text-align: left;
  }

  .row:active {
    background: var(--surface);
  }

  .date {
    min-width: 84px;
    white-space: nowrap;
    color: var(--accent);
    font-size: 14px;
    font-weight: 600;
  }

  .info {
    flex: 1;
  }

  .name {
    font-weight: 600;
  }

  .small {
    font-size: 14px;
  }
</style>
