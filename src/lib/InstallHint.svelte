<script>
  // iPhones never offer to install web apps by themselves, so we explain how.
  // Only shown in Safari on iPhone/iPad, not once installed.
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isInstalled = navigator.standalone || matchMedia('(display-mode: standalone)').matches

  // Remember "dismissed" in this browser. localStorage can fail (e.g. private mode),
  // so wrap it in try/catch.
  let dismissed = $state(false)
  try {
    dismissed = localStorage.getItem('installHintDismissed') === '1'
  } catch {}

  function dismiss() {
    dismissed = true
    try {
      localStorage.setItem('installHintDismissed', '1')
    } catch {}
  }
</script>

{#if isIOS && !isInstalled && !dismissed}
  <div class="hint">
    <div class="text">
      <strong>Install Gym Rat</strong>
      <p>
        Tap <span class="share" aria-label="Share">⬆︎</span> Share, then <strong>Add to Home Screen</strong>. It'll open
        like an app and work without internet.
      </p>
      <p class="note">
        Heads up: the installed app has its own storage, separate from Safari. Install it before logging workouts.
      </p>
    </div>
    <button class="close" onclick={dismiss} aria-label="Dismiss">✕</button>
  </div>
{/if}

<style>
  .hint {
    display: flex;
    gap: 8px;
    margin: 16px 16px 0;
    padding: 14px;
    border: 1px solid var(--accent);
    border-radius: 14px;
    background: var(--surface);
    font-size: 14px;
    line-height: 1.4;
  }

  .text {
    flex: 1;
  }

  p {
    margin: 4px 0 0;
  }

  .note {
    color: var(--muted);
  }

  .share {
    display: inline-block;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--surface-2);
    color: #4da3ff;
  }

  .close {
    align-self: flex-start;
    padding: 4px 8px;
    border: none;
    background: none;
    color: var(--muted);
  }
</style>
