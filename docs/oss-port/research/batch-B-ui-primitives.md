# Research Batch B — UI primitives

Vetted: 2026-05-15 against criteria in `docs/superpowers/plans/2026-05-15-oss-port-tdd-rebuild.md` §"Vetting Criteria" / §"Constraints".

## Port #6 + #9 — Dialog primitive + focus trap (treated as one port)

**Candidate:** `a11y-dialog` (KittyGiraudel) — single library satisfies both ports (open/close API + focus trap + Esc + focus return).

| Field | Value |
|---|---|
| owner/repo | `KittyGiraudel/a11y-dialog` |
| Stars | 2,482 |
| Last pushed | 2026-05-13 (this week) |
| License | MIT |
| Latest npm | `8.1.5` (2026-02-06) |
| UMD CDN | `https://cdn.jsdelivr.net/npm/a11y-dialog@8.1.5/dist/a11y-dialog.min.js` (HTTP 200) |
| Gzipped JS | **~1.8 KB** |
| Tests dir | `tests/` + Cypress |
| Global | `window.A11yDialog` |
| CSS | None — bring your own. Verrocchio's inline-styles + `var(--c-…)` tokens stay intact. |

**Key APIs:** `new A11yDialog(rootEl)`, `.show()`, `.hide()`, `.on('show'|'hide'|'destroy', cb)`, follows ARIA APG Dialog (Modal) pattern, focus auto-traps inside, Esc closes by default, focus returns to trigger.

**Usage (createElement style for verrocchio):**
```js
// In a useEffect mount:
const root = document.getElementById('edit-habit-dialog');
const dlg = new A11yDialog(root);
dlg.on('hide', () => onClose());
// open/close from React handlers:
const openModal = () => dlg.show();
const closeModal = () => dlg.hide();
// Markup (createElement):
React.createElement('div', {
  id: 'edit-habit-dialog', 'aria-hidden': 'true', className: 'dialog-container',
}, React.createElement('div', { className: 'dialog-overlay', 'data-a11y-dialog-hide': true }),
   React.createElement('div', { role: 'document', className: 'dialog-content' }, /* form */));
```

**iOS Safari 15+:** Works. Uses standard ARIA + native focus management; no ResizeObserver dependency. Library is explicitly tested in modern Safari per maintainer docs site.

**Verdict:** **PASS**

**Code reduction estimate:** ~600 (modal/sheet/drawer + focus trap, plan row "B") + ~600 (edit-habit + add-goal + complete-goal modals folded onto same primitive) − ~50 glue lines = **~1,150 lines removed**.

---

## Port #10 — Toast / banner

**Proposed:** `notyf` — **FAILS** on staleness: last pushed 2023-01-07, more than 12 months stale relative to today (2026-05-15). Last release v3.0 was 2019. Criteria require ≤ 12 months.

**Alternative chosen:** `apvarun/toastify-js`

| Field | Value |
|---|---|
| owner/repo | `apvarun/toastify-js` |
| Stars | 2,519 |
| Last pushed | 2024-08-19 (~9 months past 12-month window, but closest viable) |
| License | MIT |
| Latest npm | `1.12.0` (2022-07-21) |
| UMD CDN JS | `https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.js` (HTTP 200) |
| CSS CDN | `https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.css` (HTTP 200) |
| Gzipped JS | **~2.3 KB** |
| Gzipped CSS | **~0.8 KB** (small enough that inline override works) |
| Global | `window.Toastify` |

**Note on staleness:** Both notyf (2023-01) and toastify-js (2024-08) miss the strict 12-month threshold. Among viable UMD toast libs, toastify-js is the most-recently-maintained option with sufficient stars (>2k) and a stable, feature-complete API. The library is small enough to fork-and-vendor if it goes fully unmaintained. Marking **TENTATIVE — recommended with vendoring escape hatch**.

**Key APIs:** `Toastify({ text, duration, gravity, position, style, onClick, close }).showToast()`. Queueing happens implicitly via the DOM (each call appends a stacked toast).

**Usage:**
```js
Toastify({
  text: 'Saved',
  duration: 2000,
  gravity: 'top',
  position: 'center',
  style: { background: 'var(--c-success, #16a34a)' },
}).showToast();
```

**iOS Safari 15+:** Works. Pure DOM + CSS transitions, no platform-specific APIs.

**CSS isolation note (yellow flag):** Library injects a fixed-position container and uses its own classnames. Dark-mode legacy override in verrocchio (`body.dark [style*="rgb(…)"]`) will not catch library-generated styles; we'll need to scope a small `body.dark .toastify { … }` block in `index.html`'s `<style>` tag — trivially small (5-10 lines).

**Verdict:** **TENTATIVE** (winner among viable; less-than-ideal recency)

**Code reduction estimate:** Plan does not quantify (hand-rolled inline). Realistic: ~80 lines of toast UI + queue state removed − 15 glue = **~65 lines**.

---

## Port #8 — Long-press detection

**Candidate:** `john-doherty/long-press-event`

| Field | Value |
|---|---|
| owner/repo | `john-doherty/long-press-event` |
| Stars | **351** (below the ≥1,000 threshold) |
| Last pushed | 2026-04-21 (active!) |
| License | MIT |
| Latest npm | `2.5.2` (2026-04-21) |
| UMD CDN | `https://cdn.jsdelivr.net/npm/long-press-event@2.5.2/dist/long-press-event.min.js` (HTTP 200) |
| Gzipped | **~1.1 KB** |
| Tests dir | `tests/` |
| Global | none — auto-attaches a global `long-press` event delegate on `document` |
| CSS | none |

**Key APIs:** Loading the script auto-installs delegated listeners; consumer code adds `document.addEventListener('long-press', handler)` or per-element. Per-element override via `data-long-press-delay="500"`. Bubbles, cancelable via `preventDefault()`.

**Usage (verrocchio):**
```js
// In an effect that runs once on mount:
React.useEffect(() => {
  const handler = (e) => {
    const habitId = e.target.closest('[data-habit-id]')?.dataset.habitId;
    if (habitId) openPillSheet(habitId);
  };
  document.addEventListener('long-press', handler);
  return () => document.removeEventListener('long-press', handler);
}, []);
// Markup: add data-long-press-delay="500" and data-habit-id attrs to habit pills.
```

**iOS Safari 15+:** Library detects `PointerEvent`/`ontouchstart` and falls back accordingly; supports modern iOS Safari (works in Cordova/PhoneGap per README, which is a strict subset). Recent commits explicitly fix mobile long-press issues (latest tag is literally titled "Fix mobile long press issue").

**Searched for alternatives:** No vanilla long-press lib >1k stars exists. Closest alternatives are jQuery-based or React-coupled (out of scope). `web-long-press` (9 stars), `jquery-longpress` (65), nothing viable.

**Verdict:** **TENTATIVE** — fails stars threshold (351 < 1,000) but:
- Active maintenance (this month)
- Only 1.1 KB gzipped — easy to vendor if needed
- No alternative passes the stars bar either
- Replaces ~500 hand-rolled lines

**Code reduction estimate:** ~500 hand-rolled − ~20 glue = **~480 lines removed**.

**KEEP fallback:** If stars-bar is treated as a hard gate, KEEP the hand-rolled implementation. The current code is debugged for iOS and works; the win is purely line-count reduction, not capability gain. Decision deferred to plan author.

---

## Port #7 — Emoji / icon picker

**Candidate:** `nolanlawson/emoji-picker-element`

| Field | Value |
|---|---|
| owner/repo | `nolanlawson/emoji-picker-element` |
| Stars | 1,736 |
| Last pushed | 2026-05-13 (this week) |
| License | Apache-2.0 |
| Latest npm | `1.29.1` |
| Loadable via | `<script type="module" src="https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1/index.js">` (HTTP 200; all relative imports — no bundling needed) |
| Gzipped total | **~31 KB** (index.js + picker.js ~22 KB + database.js ~9 KB, all fetched on first use) |
| Tests dir | `test/` + `vitest.config.js` |
| Custom element | `<emoji-picker>` |
| Built-in storage | IndexedDB (auto-managed) |

**Note on ESM vs UMD:** The plan's constraints require UMD OR custom-element loadable via `<script type="module">`. This library is the latter — explicitly designed as a custom element with native module loading per its README's documented load pattern. The README's *recommended* load is exactly:
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js"></script>
```
This **satisfies the constraint** as written (no bundler, no Vite, plain `<script type="module">`).

**Key APIs:** `<emoji-picker>` custom element fires `emoji-click` events with `{detail: {emoji, unicode}}`. Programmatic API: `picker.skinToneEmoji`, `picker.locale`, `picker.database`. CSS variables on the host element for theming.

**Usage (verrocchio createElement):**
```js
// In a useEffect after a modal opens:
const pickerEl = document.querySelector('#habit-icon-picker emoji-picker');
const onPick = (e) => {
  setHabit({ ...habit, icon: e.detail.unicode });
  closePicker();
};
pickerEl.addEventListener('emoji-click', onPick);
return () => pickerEl.removeEventListener('emoji-click', onPick);
// Markup inside the dialog:
React.createElement('emoji-picker', { id: 'habit-icon-picker',
  style: { '--background': 'var(--c-bg)', '--border-color': 'var(--c-border)' } });
```

**iOS Safari 15+:** Officially supports "latest versions of Safari." The README documents a known Safari Clipboard-API quirk and provides `emoji-click-sync` as a workaround. For our use (picking an icon, no clipboard), the standard `emoji-click` event works fine. Uses IndexedDB which is supported on iOS Safari 15+.

**CSS isolation:** Library is a custom element with Shadow DOM, so CSS is fully encapsulated. Dark-mode theming is via documented CSS custom properties (`--background`, `--border-color`, etc.) — clean integration with verrocchio's `var(--c-…)` tokens. **Green flag, not yellow.**

**Verdict:** **PASS**

**Code reduction estimate:** ~150 hand-rolled − ~15 glue = **~135 lines removed**. Bonus: instead of verrocchio's small icon set, users get the full Unicode emoji catalog with search, skin-tone variants, and recently-used tracking.

---

## Cross-port observations

- **Single library serves multiple ports:** `a11y-dialog` handles both Port #6 (dialog primitive) and Port #9 (focus trap) — the plan already groups them. No other doubling-up.
- **CSS injection / isolation:**
  - `a11y-dialog` injects nothing — clean.
  - `emoji-picker-element` uses Shadow DOM — clean.
  - `toastify-js` injects raw classes into document — minor yellow flag, requires a tiny `body.dark .toastify { … }` rule.
  - `long-press-event` injects nothing — clean.
- **iOS Safari 15+:** All four candidates support iOS Safari 15+. `emoji-picker-element` uses IndexedDB (supported in iOS Safari 15+) and ResizeObserver (also supported). No blockers.
- **Combined gzipped JS additions:** 1.8 + 2.3 + 1.1 + 31 ≈ **36 KB** for ~2,300 lines of hand-rolled code removed. Strong ratio.
- **Total estimated line reduction across batch B:** ~1,830 lines.

---

## Recommended winners

- **Port #6 + #9:** `a11y-dialog@8.1.5` — `https://cdn.jsdelivr.net/npm/a11y-dialog@8.1.5/dist/a11y-dialog.min.js` — **~1.8 KB gzipped** — PASS
- **Port #10:** `toastify-js@1.12.0` — `https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.js` + `…/toastify.min.css` — **~2.3 KB JS + 0.8 KB CSS gzipped** — TENTATIVE (recency yellow flag; recommended over notyf which fails staleness criterion outright)
- **Port #8:** `long-press-event@2.5.2` — `https://cdn.jsdelivr.net/npm/long-press-event@2.5.2/dist/long-press-event.min.js` — **~1.1 KB gzipped** — TENTATIVE (351 stars below threshold but actively maintained, no viable alternative; KEEP if stars-bar is a hard gate)
- **Port #7:** `emoji-picker-element@1.29.1` — `https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1/index.js` (`<script type="module">`) — **~31 KB gzipped total** — PASS
