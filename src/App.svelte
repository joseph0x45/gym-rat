<script>
  // Logic for this component goes here. Nothing yet: this is just the home screen.
</script>

<main>
  <div class="logo">🐀</div>
  <h1>Gym Rat</h1>
  <p>Your workouts, tracked. Coming soon.</p>
</main>

<style>
  /* Styles in a .svelte file only apply to this component */
  main {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
    text-align: center;
  }

  .logo {
    font-size: 72px;
  }

  h1 {
    margin: 8px 0 4px;
    font-size: 32px;
    color: var(--accent);
  }

  p {
    margin: 0;
    color: var(--muted);
  }
</style>
