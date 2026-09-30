<script>
  // Export your data to a file, or restore it from one
  import { useNav } from './nav.js'
  import { exportBackup, readBackup, restoreBackup } from './backup.js'
  import { formatDate, plural } from './format.js'

  const nav = useNav()

  // When you last exported, remembered in this browser only (it's just a reminder)
  let lastExport = $state(null)
  try {
    lastExport = Number(localStorage.getItem('lastBackupAt')) || null
  } catch {}

  let status = $state('') // message shown after an action
  let error = $state('')
  let busy = $state(false)

  async function doExport() {
    busy = true
    error = status = ''
    try {
      const counts = await exportBackup()
      lastExport = Date.now()
      try {
        localStorage.setItem('lastBackupAt', String(lastExport))
      } catch {}
      status = `Exported ${plural(counts.exercises, 'exercise')}, ${plural(counts.workoutDays, 'workout')} and ${plural(counts.sessions, 'logged session')}.`
    } catch (err) {
      console.error(err)
      error = "Couldn't create the backup file."
    }
    busy = false
  }

  async function doImport(event) {
    const file = event.currentTarget.files[0]
    event.currentTarget.value = '' // so picking the same file again still works
    if (!file) return
    error = status = ''
    try {
      const backup = await readBackup(file)
      const summary = `${plural(backup.exercises.length, 'exercise')}, ${plural(backup.workoutDays.length, 'workout')} and ${plural(backup.sessions.length, 'logged session')}`
      if (!confirm(`Restore this backup from ${formatDate(Date.parse(backup.exportedAt))}?\n\nIt has ${summary}.\n\nThis REPLACES everything currently in the app.`))
        return
      busy = true
      await restoreBackup(backup)
      status = `Restored ${summary}.`
    } catch (err) {
      console.error(err)
      error = err.message || "Couldn't restore that file."
    }
    busy = false
  }
</script>

<header class="topbar">
  <button class="btn back" onclick={() => nav.pop()}>‹ Back</button>
  <h1>Backup</h1>
</header>

<div class="content">
  <p class="muted">
    Your data lives only on this phone. Export a backup file now and then and keep it somewhere safe. On iPhone,
    choose <strong>On My iPhone</strong> in Files to keep it local.
  </p>

  <section>
    <h2>Export</h2>
    <p class="muted small">
      {lastExport ? `Last exported ${formatDate(lastExport)}.` : "You haven't exported a backup yet."}
    </p>
    <button class="btn primary full" onclick={doExport} disabled={busy}>⬇ Export backup file</button>
  </section>

  <section>
    <h2>Restore</h2>
    <p class="muted small">Replaces everything in the app with the contents of a backup file.</p>
    <!-- A styled label opens the hidden file picker when tapped -->
    <label class="btn full import" class:disabled={busy}>
      ⬆ Restore from file
      <input type="file" accept=".json,application/json" onchange={doImport} disabled={busy} hidden />
    </label>
  </section>

  {#if status}<p class="status">✅ {status}</p>{/if}
  {#if error}<p class="error">{error}</p>{/if}
</div>

<style>
  .content {
    padding: 16px;
    line-height: 1.5;
  }

  section {
    margin-top: 24px;
  }

  h2 {
    margin: 0 0 4px;
    font-size: 18px;
  }

  .small {
    margin: 0 0 12px;
    font-size: 14px;
  }

  .full {
    display: block;
    width: 100%;
    padding: 14px;
    text-align: center;
  }

  .import {
    cursor: pointer;
  }

  .import.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .status {
    margin-top: 24px;
    color: #6fdc8c;
  }

  .error {
    margin-top: 24px;
    color: var(--danger);
  }
</style>
