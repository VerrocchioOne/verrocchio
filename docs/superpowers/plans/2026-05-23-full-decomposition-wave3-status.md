# Wave 3 — App() constants & pure helpers — status

> **Companion to** `2026-05-23-full-decomposition.md` §"Wave 3". This file
> records the in-parallel Wave 3 work done while the Wave 2 agent was
> still extracting components.

## What's done

- **`lib/constants.js`** — new file. Contains verbatim copies of the
  Wave-3-scope constants from index.html:
  - `IMP`     (importance ladder)          — was inline at index.html L1363
  - `HT`      (habit-type taxonomy)        — was inline at index.html L1379
  - `SECTIONS` (time-of-day buckets)       — was inline at index.html L1445
  - `DURS`    (duration presets)           — was inline at index.html L1641
  - `FREQ`    (frequency cadences)         — was inline at index.html L1722
  - `DUR_MIN`, `DUR_MAX`, `DUR_STEP`       — was inline INSIDE App() at L6603
  - `I`       (base input style)           — was inline INSIDE App() at L11125
  - `IS`      (smaller-input variant; spreads from `I`) — App() L11138
  - `S`       (select style)               — was inline INSIDE App() at L11143
  - `AB`      (primary action-button style) — was inline INSIDE App() at L11157

  All constants are pure literal data. No React, no DOM, no closure
  dependencies on App-scope state. `IS` was reviewed and confirmed to
  only depend on `I` (which is included alongside it).

- **Verification done:**
  - `node -e "require('./lib/constants.js')"` loads cleanly and
    `IS` correctly contains the spread of `I` plus its own overrides.
  - `npm run test:unit` → 259/259 green (no Node-side regression).

## What's intentionally NOT done

`lib/constants.js` is **not yet wired into index.html.** No
`<script src="./lib/constants.js">` tag was added; no inline
definitions were removed. This is deliberate — the parallel Wave 2
agent currently has `index.html` modified and is mid-flight on the
component extractions documented in `2026-05-23-full-decomposition.md`
§"Wave 2 (RE-ATTEMPT)". Editing the same file from two agents would
guarantee a conflict.

## Integration steps (run AFTER Wave 2 commits)

Sequence is short — ~5 minutes once Wave 2 lands.

### Step 1 — Add the script tag

In `index.html` `<head>`, find the existing run of `<script src>` tags
for `lib/` modules (the same block that loads `lib/components/Sparkline14.js`
after Wave 2 commits). Add **immediately before the domain modules**
(constants must load before any domain that references them):

```html
<script src="./lib/constants.js"></script>
```

### Step 2 — Delete the module-scope inline definitions

In `index.html`, delete the entire `const IMP = [...];` block at L1363
through the closing `}];` of the array (~16 LOC).

Repeat for:
- `HT` at L1379 (~36 LOC through closing `}];`)
- `SECTIONS` at L1445 (~40 LOC through closing `}];`)
- `DURS` at L1641 (~61 LOC through closing `];`)
- `FREQ` at L1722 (~8 LOC through closing `];`)

Total module-scope reduction: ~160 LOC out of index.html.

After deleting each, **do not** add an alias. These constants are
already module-scope; once the `<script src>` is loaded earlier in the
document, the bindings exist in the same global scope and no alias is
needed. (This differs from the Wave 2 component pattern, which uses
`const Name = window.Name;` aliases because the components live inside
App's render closure.)

### Step 3 — Replace App()-scope inline definitions

These are inside `function App() { ... }` so the same module-scope
script-global trick works — once `lib/constants.js` is loaded, the
identifiers `DUR_MIN`, `DUR_MAX`, `DUR_STEP`, `I`, `IS`, `S`, `AB`
resolve to the module-scope bindings from anywhere they're referenced.

At L6603, replace:
```js
const DUR_MIN = 0, DUR_MAX = 720, DUR_STEP = 5;
```
…with: nothing. Delete the line.

At L11125-L11166, replace the entire `I` / `IS` / `S` / `AB` block
(~42 LOC) with: nothing. Same reasoning.

Note: leave `EI` and any other style objects in that cluster alone —
they were not part of the Wave 3 scope (and `EI` may reference
App-scope closures; verify before lifting in a follow-up).

### Step 4 — Verify

```powershell
npm run test:unit             # expect: 259/259
npx playwright test --project=desktop  # expect: 20/20 (after Wave 2 regression is also fixed)
```

Browser smoke per CLAUDE.md verification gate:
- Desktop screenshot at >=1024px — load index.html, click Habits tab, click "+", confirm the inline new-habit form renders with the expected input/select/button styles (any visual regression here means an `I/IS/S/AB` reference was missed).
- iOS-width screenshot at ~390px — same checks.
- Dark-mode toggle — confirm input/select/button colors still adapt.

### Step 5 — Commit

```
refactor(constants): lift Wave 3 data constants & form styles to lib/constants.js

Move IMP, HT, SECTIONS, DURS, FREQ from inline module scope and
DUR_MIN/MAX/STEP, I, IS, S, AB from inside App() to a new dedicated
module. Net: -~200 LOC from index.html, 0 behavioral change, 259/259
unit + 20/20 E2E green.

Wave 3 of full-decomposition. See
docs/superpowers/plans/2026-05-23-full-decomposition-wave3-status.md.
```

## Follow-ups not in this wave

Several constants live in the same neighborhood of index.html and are
plausible candidates for `lib/constants.js` in a later pass:

- `FEATURES` (L1329)
- `DEFAULT_TIME_RANGES` (L1418) — referenced by helpers; lift those too
- `GLYPH_PATHS` + `Glyph(...)` (L1492-L1526) — small module, candidate
  for `lib/components/Glyph.js`
- `ACHIEVEMENT_TIERS`, `ACHIEVEMENTS`, `ACHIEVEMENT_CATEGORIES` (L1535-L1606)
  — large data table, candidate for `lib/data/achievements.js`
- `MOODS`, `JTAGS` (L1607, L1640)
- `MONTHS_SHORT`, `MONTHS_LONG`, `DOW_ABBR`, `DOW_ORDER` + `ordSuffix`
  and `dowDisplayRank` helpers (L1730-L1751) — candidate for
  `lib/dateFormat.js` or as additions to `utils.js`
- `EI` (App() L11167) — style object near I/IS/S/AB but not in Wave 3
  plan scope; review for closure deps before lifting

None of these are blocking; they're notes for whoever runs the next
constants-extraction wave.

## Risks

- **Load order.** If `<script src="./lib/constants.js">` lands AFTER
  the inline `<script>` that currently defines `const IMP = [...]`,
  there will be a duplicate-binding error. The deletion of the inline
  definitions in Step 2 is what avoids this. Make sure the deletion
  commit lands together with the script-tag addition — don't split
  them.
- **DUR_MIN closure capture.** Currently `DUR_MIN/MAX/STEP` are
  declared just before `const [durRange, setDurRange] = useState([DUR_MIN, DUR_MAX])`.
  After the move, `useState` will read the module-scope values
  directly. Behavior is identical (same literal values), but flag this
  for code-review.
- **`I`/`IS`/`S`/`AB` cross-view drift.** These style objects are
  currently App-scope; lifting them to module scope means any future
  inline tweak in App() that meant "just this view" would silently
  apply to all consumers. Worth adding a one-line comment in
  `lib/constants.js` calling this out. (Done — see header in the
  style-objects section.)
