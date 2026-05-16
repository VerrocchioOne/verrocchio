# Research Batch C — Visualization & calendar

Scope: ports #11 (month grid), #12 (14-day sparkline), #13 (year heatmap).
Hard rules: no build step, no JSX, no TypeScript, UMD-only via jsdelivr/unpkg.
Existing dep already in tree: Chart.js 4.4.0 UMD (~69 KB gzipped) lazy-loaded
for the Habit-Stats radar (`index.html:3512–3524`).

Current hand-rolled targets in `index.html`:
- `renderMonth` at L21583–21714 (~130 lines month grid)
- `Sparkline14` at L2639–2665 (~27 lines SVG sparkline)
- `YearHeatmap` at L2844–2896 (~52 lines SVG heatmap)

---

## Port #11 — Calendar grid (month view)

### Candidate A — `vanilla-calendar-pro`

- **owner/repo**: uvarov-frontend/vanilla-calendar-pro
- **Stars**: 1,042 — **Forks**: 93 — **License**: MIT
- **Last pushed**: 2026-02-01
- **Latest version**: 3.1.0 (npm)
- **CDN UMD**: `https://cdn.jsdelivr.net/npm/vanilla-calendar-pro@3.1.0/index.js` → **HTTP 200**, UMD factory header confirmed
- **CSS**: `https://cdn.jsdelivr.net/npm/vanilla-calendar-pro@3.1.0/styles/index.css`
- **Gzipped**: 14.5 KB JS + ~3 KB CSS (~17 KB total)
- **Dependencies**: zero runtime deps (verified `"dependencies": {}` in package.json)
- **Usage (vanilla, no JSX)**:
  ```js
  const cal = new VanillaCalendarPro.Calendar('#cal', {
    type: 'default',
    onClickDate(self, evt) {
      const isoDate = self.context.selectedDates[0]; // YYYY-MM-DD
      openDaySnapshot(isoDate);
    },
    inputModeChange: false,
  });
  cal.init();
  // Per-day decoration via the `popups` option or by querying
  // [data-vc-date="YYYY-MM-DD"] after init() and injecting our own dots.
  ```
- **Verdict**: **PASS**. Smallest credible option with per-day decoration via
  `popups` option + DOM hooks (`[data-vc-date]`). Active maintenance.
- **Code reduction**: ~130 lines deleted, ~40 lines glue (config + dot
  injection) = net –90 LOC. Adds ~17 KB gzipped (lazy-loaded).

### Candidate B — `flatpickr` (inline mode)

- **Stars**: 16,458 — **License**: MIT — **Last pushed**: 2024-08-02
- **CDN UMD**: `https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js` → 200
- **Gzipped**: 14.1 KB
- **Verdict**: **TENTATIVE**. Designed as a date *picker*, not a month-grid
  with arbitrary per-day decoration. Day decoration is only via
  `onDayCreate(dObj, dStr, fp, dayElem)` and styling is fighting the picker
  CSS. Functional but more friction than vanilla-calendar-pro.

### Candidate C — `fullcalendar` (global build)

- **License**: MIT — **Latest**: 6.1.20
- **CDN UMD**: `https://cdn.jsdelivr.net/npm/fullcalendar@6.1.20/index.global.min.js` → 200
- **Gzipped**: 81 KB
- **Verdict**: **FAIL** for this port. 5× heavier than vanilla-calendar-pro,
  with event/timezone/recurrence machinery we don't need. Right tool if we
  ever ship a full event calendar; wrong tool for a month-grid with dots.

### Winner: `vanilla-calendar-pro@3.1.0` (17 KB gzipped, MIT, zero deps).

---

## Port #12 — 14-day sparkline (per habit row)

### Option (a) — Reuse already-loaded Chart.js

Sparklines render *on every habit card*. The card list can show 10–30+ habits.
Chart.js is already in the tree (69 KB gzipped lazy) so reusing it adds
**zero new download cost**. But:

- Chart.js spins up a `<canvas>` per chart + an animation frame loop per
  chart. 20 sparklines = 20 canvases = noticeable scroll jank on mid-tier
  Android per Chart.js issue tracker.
- The current SVG sparkline is ~25 lines, declarative, GC-free, prints
  cleanly in dark mode (no canvas pixel-density issues), and is already
  React-friendly.
- Glue cost: ~40 lines per use site for Chart.js (canvas ref, useEffect,
  destroy on unmount, config object).

**Verdict (a)**: **TENTATIVE — net negative for sparklines.** Saves zero KB
(already loaded), adds boilerplate, adds canvas overhead at exactly the spot
where rows multiply.

### Option (b) — Dedicated tiny lib: `@fnando/sparkline`

- **owner/repo**: fnando/sparkline
- **Stars**: 547 — **License**: MIT — **Last pushed**: 2023-10-17
- **CDN UMD**: `https://cdn.jsdelivr.net/npm/@fnando/sparkline@0.3.10/dist/sparkline.js` → 200
- **Gzipped**: **1.5 KB**
- **Dependencies**: zero
- **Usage (vanilla, no JSX)**:
  ```js
  // Render into an <svg ref={el}>:
  sparkline.sparkline(el, last14Values, {
    onmousemove(e, datapoint) { /* tooltip */ },
    interactive: true,
  });
  ```
- **Verdict (b)**: **TENTATIVE**. Generates SVG (good — matches existing
  style). Pure JS, zero deps. But the bar+line+dots compound style our
  current `Sparkline14` uses is *not* a standard sparkline.js mode —
  `@fnando/sparkline` is line-only with optional spot dots, no per-day bar
  alternation, no missed-vs-empty distinction.

### Final recommendation for Port #12: **DO NOT PORT** — keep the hand-rolled SVG.

Rationale: the existing 25-line component is shorter than the glue code for
either alternative, has zero new download cost, no canvas/GC overhead at row
scale, and already encodes domain-specific rendering (done = filled dot,
missed = empty dot, baseline tick) that no generic library expresses cleanly.
The "150 LOC budget" assumed in the plan was over-estimated; the actual
hand-rolled cost here is below the floor where a dependency pays back.

If the OSS-port committee insists on a swap, `@fnando/sparkline` (1.5 KB) is
the only candidate that doesn't make the code worse, and even then it loses
the bar/missed distinction.

---

## Port #13 — Year heatmap (7×53 grid)

### Candidate A — `cal-heatmap@4.2.4` (proposed)

- **owner/repo**: wa0x6e/cal-heatmap
- **Stars**: 3,113 — **License**: MIT — **Last pushed**: 2026-05-12 (active)
- **CDN UMD**: `https://cdn.jsdelivr.net/npm/cal-heatmap@4.2.4/dist/cal-heatmap.js` → 200
- **Gzipped (cal-heatmap.js alone)**: 107 KB
- **CSS**: `.../dist/cal-heatmap.css` (583 B gzipped)
- **Transitive UMD deps** (per the official `cal-heatmap.com` install snippet):
  - `https://d3js.org/d3.v7.min.js` — **93 KB gzipped**
  - `https://unpkg.com/@popperjs/core@2` — **7.4 KB gzipped** (only if Tooltip plugin used)
  - Plus optional plugin scripts (Tooltip / Legend / LegendLite / CalendarLabel)
- **Total bundle for year-view + no plugins**: 107 + 93 = **~200 KB gzipped**.
- **Usage (vanilla, no JSX)**:
  ```js
  const cal = new CalHeatmap();
  cal.paint({
    itemSelector: '#year-heatmap',
    data: { source: completionRows, x: 'date', y: 'value' },
    date: { start: new Date(Date.now() - 365*86400e3) },
    range: 13, domain: { type: 'month' }, subDomain: { type: 'day' },
    scale: { color: { type: 'threshold', range: ['#eef', '#2d5a2d'], domain: [1] } },
  });
  ```
- **Verdict**: **FAIL on size.** Replacing a 52-line SVG component with a
  200 KB dependency tree is a regression by every measure. The existing
  `YearHeatmap` also implements *domain-specific* rendering — habit-type
  color, missed-red cells, low-opacity tint of brand color for empty — that
  cal-heatmap doesn't express natively (it's a threshold-scale heatmap, not
  a tri-state state-machine renderer).

### Candidate B — `react-calendar-heatmap`

- **Verdict**: **FAIL.** Ships JSX/React-specific. UMD bundle exists but
  pulling it in just to render a 365-cell grid is the same trap as A.

### Candidate C — None viable at small size

There's no maintained ~5–10 KB year-heatmap library on npm. Every option
ships with d3 or its own grid engine.

### Final recommendation for Port #13: **DO NOT PORT** — keep the hand-rolled SVG.

Same reasoning as #12: the cost of swapping in cal-heatmap (200 KB transitive
gzipped + d3 globals leak into our scope + a CSS file we'd then have to
overlay our design tokens onto) wildly exceeds the savings from deleting 52
lines of dead-simple SVG that already does exactly what we want. The cell
state-machine (done / missed / empty + per-type color) is the actual logic;
the rendering is trivial.

---

## Cross-port observations

- **Library sharing**: vanilla-calendar-pro renders an interactive month
  picker — it cannot double as a year heatmap (different shape, different
  interaction model). cal-heatmap *could* technically render the month grid
  (`domain.type: 'month'`, `subDomain.type: 'day'`), but at 200 KB with d3
  it's a non-starter — and it doesn't give us the per-day chip slot we need
  for goal targets and sparse-habit names that the current month view
  shows. **No port can serve both #11 and #13.**

- **Chart.js reuse**: tempting for sparklines (zero net KB) but loses on
  per-row canvas overhead and glue verbosity. Not recommended.

- **Pattern**: this batch reveals an asymmetry — port #11 (month grid with
  navigation + per-day click + decoration slots) has real complexity worth
  outsourcing; ports #12 and #13 are static SVG renderers where a
  dependency is pure overhead.

---

## Recommended winners

| Port | Library | CDN URLs | Gzipped |
|---|---|---|---|
| **#11 Calendar grid** | `vanilla-calendar-pro@3.1.0` | `https://cdn.jsdelivr.net/npm/vanilla-calendar-pro@3.1.0/index.js` + `https://cdn.jsdelivr.net/npm/vanilla-calendar-pro@3.1.0/styles/index.css` | ~17 KB |
| **#12 Sparkline** | **NO PORT — keep `Sparkline14` (~25 lines SVG)** | — | 0 KB |
| **#13 Year heatmap** | **NO PORT — keep `YearHeatmap` (~52 lines SVG)** | — | 0 KB |

**Net deliverable from Batch C**: one port (#11) yielding a ~–90 LOC reduction
in `index.html` for a ~17 KB lazy-loaded gzipped cost, with two explicit "do
not port" recommendations backed by transitive-size math and domain-rendering
fit. Lazy-load `vanilla-calendar-pro` only when the calendar modal is opened
(mirror `ensureChartJs` pattern at `index.html:3512`).
