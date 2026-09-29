<script>
  // Registers the service worker, and shows a notice when a new version of the app
  // has been deployed. We never reload by ourselves: you might be mid-set.
  import { registerSW } from 'virtual:pwa-register'

  let needRefresh = $state(false)

  const updateSW = registerSW({
    onNeedRefresh() {
      needRefresh = true
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return
      // iPhone apps often stay open in the background for days, so check for
      // a new version whenever you come back to the app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) registration.update()
      })
    },
  })
</script>

{#if needRefresh}
  <div class="toast" role="status">
    <span>🐀 A new version of Gym Rat is ready</span>
    <button class="btn primary" onclick={() => updateSW(true)}>Reload</button>
    <button class="btn close" onclick={() => (needRefresh = false)} aria-label="Later">✕</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(76px + env(safe-area-inset-bottom)); /* above the tab bar */
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 10px 10px 14px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--surface-2);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    font-size: 14px;
  }

  span {
    flex: 1;
  }

  .close {
    padding: 10px;
    background: none;
    color: var(--muted);
  }
</style>
