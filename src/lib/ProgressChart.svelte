<script>
  // A line chart drawn with plain SVG. The idea of every chart:
  //  1. "scales" turn data values into pixel positions (x for time, y for weight)
  //  2. we draw shapes (a line, dots, gridlines) at those positions
  import { formatShortDate, formatDate, formatWeight } from './format.js'

  // points: [{ x: timestamp, y: number, detail: 'text for the tooltip' }], oldest first
  let { points, unit = 'kg', label } = $props()

  // ---- Size: the chart fills its container's width
  let width = $state(0)
  const height = 200
  const pad = { top: 16, right: 52, bottom: 28, left: 40 } // room for labels around the plot
  let plotW = $derived(Math.max(0, width - pad.left - pad.right))
  const plotH = height - pad.top - pad.bottom

  // ---- Y axis: round "nice" tick values (e.g. 40, 45, 50) instead of 41.37
  function niceTicks(min, max, count = 4) {
    if (min === max) {
      min -= 5
      max += 5
    }
    const raw = (max - min) / count
    const magnitude = 10 ** Math.floor(Math.log10(raw))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)
    const lo = Math.max(0, Math.floor(min / step) * step)
    const hi = Math.ceil(max / step) * step
    const ticks = []
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
    return ticks
  }
  let ticks = $derived(niceTicks(Math.min(...points.map((p) => p.y)), Math.max(...points.map((p) => p.y))))
  let yMin = $derived(ticks[0])
  let yMax = $derived(ticks.at(-1))
  const y = (value) => pad.top + plotH - ((value - yMin) / (yMax - yMin)) * plotH

  // ---- X axis: position by date, so gaps between workouts show as gaps
  let xStart = $derived(points[0].x)
  let xEnd = $derived(points.at(-1).x)
  const x = (point, i) =>
    pad.left + (xEnd > xStart ? ((point.x - xStart) / (xEnd - xStart)) * plotW : (i / Math.max(1, points.length - 1)) * plotW)

  let coords = $derived(points.map((p, i) => ({ ...p, cx: x(p, i), cy: y(p.y) })))
  let linePath = $derived(coords.map((c, i) => `${i ? 'L' : 'M'}${c.cx},${c.cy}`).join(' '))
  // The same line, closed down to the bottom of the plot, for the soft fill underneath
  let areaPath = $derived(`${linePath} L${coords.at(-1).cx},${pad.top + plotH} L${coords[0].cx},${pad.top + plotH} Z`)
  let last = $derived(coords.at(-1))

  // ---- Touch / hover: the crosshair snaps to the nearest workout
  let active = $state(null) // index of the highlighted point

  function pick(event) {
    const box = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - box.left
    let nearest = 0
    coords.forEach((c, i) => {
      if (Math.abs(c.cx - px) < Math.abs(coords[nearest].cx - px)) nearest = i
    })
    active = nearest
  }

  // Keyboard: arrow keys move between points (same info as touch)
  function onKey(event) {
    if (event.key === 'ArrowRight') active = Math.min(points.length - 1, (active ?? -1) + 1)
    else if (event.key === 'ArrowLeft') active = Math.max(0, (active ?? points.length) - 1)
    else return
    event.preventDefault()
  }

  let tip = $derived(active === null ? null : coords[active])
  // Keep the tooltip inside the chart horizontally
  let tipLeft = $derived(tip ? Math.min(Math.max(tip.cx, 70), width - 70) : 0)
</script>

<!-- Picking one workout out of N is what a slider does, so that's the role we give it:
     screen readers announce it, and arrow keys move between workouts -->
<div
  class="chart"
  bind:clientWidth={width}
  tabindex="0"
  role="slider"
  aria-label={label}
  aria-valuemin={1}
  aria-valuemax={points.length}
  aria-valuenow={(active ?? points.length - 1) + 1}
  aria-valuetext={(() => {
    const p = points[active ?? points.length - 1]
    return `${formatDate(p.x)}: ${formatWeight(p.y)} ${unit}`
  })()}
  onkeydown={onKey}
  onblur={() => (active = null)}
  onpointerdown={pick}
  onpointermove={pick}
  onpointerleave={() => (active = null)}
>
  {#if width > 0}
    <svg {width} {height}>
      <!-- Gridlines + y tick labels -->
      {#each ticks as tick}
        <line class="grid" x1={pad.left} x2={pad.left + plotW} y1={y(tick)} y2={y(tick)} />
        <text class="tick" x={pad.left - 8} y={y(tick)} text-anchor="end" dominant-baseline="middle">{formatWeight(tick)}</text>
      {/each}

      <!-- X labels: just the first and last date, so they never collide -->
      <text class="tick" x={coords[0].cx} y={height - 8} text-anchor="start">{formatShortDate(points[0].x)}</text>
      <text class="tick" x={last.cx} y={height - 8} text-anchor="end">{formatShortDate(last.x)}</text>

      <path class="area" d={areaPath} />
      <path class="line" d={linePath} />

      {#if points.length <= 16}
        {#each coords as c}
          <circle class="dot" cx={c.cx} cy={c.cy} r="4" />
        {/each}
      {/if}

      <!-- Direct label on the latest value only (never a number on every point) -->
      <circle class="dot" cx={last.cx} cy={last.cy} r="5" />
      <text class="end-label" x={last.cx + 10} y={last.cy} dominant-baseline="middle">{formatWeight(last.y)} {unit}</text>

      {#if tip}
        <line class="crosshair" x1={tip.cx} x2={tip.cx} y1={pad.top} y2={pad.top + plotH} />
        <circle class="dot active" cx={tip.cx} cy={tip.cy} r="6" />
      {/if}
    </svg>

    {#if tip}
      <div class="tooltip" style:left="{tipLeft}px">
        <strong>{formatWeight(tip.y)} {unit}</strong>
        <span>{formatDate(tip.x)}</span>
        <span class="detail">{tip.detail}</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .chart {
    position: relative;
    outline: none;
    touch-action: pan-y; /* vertical swipes still scroll the page; horizontal drags scrub the chart */
    -webkit-user-select: none;
    user-select: none;
  }

  .chart:focus-visible {
    outline: 2px solid var(--accent);
    border-radius: 8px;
  }

  svg {
    display: block;
    overflow: visible;
  }

  .grid {
    stroke: var(--chart-grid);
    stroke-width: 1;
  }

  .tick {
    fill: var(--muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .area {
    fill: var(--chart-series);
    opacity: 0.1;
  }

  .line {
    fill: none;
    stroke: var(--chart-series);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  /* Dots get a 2px ring in the background color so they stay readable on the line */
  .dot {
    fill: var(--chart-series);
    stroke: var(--bg);
    stroke-width: 2;
  }

  .dot.active {
    stroke-width: 3;
  }

  .end-label {
    fill: var(--text);
    font-size: 12px;
    font-weight: 600;
  }

  .crosshair {
    stroke: var(--muted);
    stroke-width: 1;
  }

  .tooltip {
    position: absolute;
    top: -8px;
    transform: translate(-50%, -100%);
    display: flex;
    flex-direction: column;
    min-width: 120px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    font-size: 12px;
    pointer-events: none;
    white-space: nowrap;
  }

  .tooltip strong {
    font-size: 15px;
  }

  .tooltip span {
    color: var(--muted);
  }

  .tooltip .detail {
    color: var(--text);
  }
</style>
