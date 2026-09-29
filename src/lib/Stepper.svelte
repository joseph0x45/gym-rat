<script>
  // A number with − and + buttons, easier to hit on a phone than typing.
  // $bindable lets the parent use bind:value={...} so changes flow back up.
  let { value = $bindable(), min = 1, max = 99, label } = $props()
</script>

<div class="stepper" role="group" aria-label={label}>
  <button onclick={() => (value = Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease {label}">−</button>
  <span class="value">{value}</span>
  <button onclick={() => (value = Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase {label}">+</button>
</div>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    border-radius: 10px;
    background: var(--surface-2);
  }

  button {
    width: 36px;
    height: 36px;
    border: none;
    background: none;
    color: var(--accent);
    font-size: 20px;
    font-weight: 600;
  }

  button:disabled {
    color: var(--muted);
    opacity: 0.4;
  }

  .value {
    min-width: 28px;
    text-align: center;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>
