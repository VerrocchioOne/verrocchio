# View Extraction Pattern

The conventions for splitting a top-level view out of `index.html` into a self-contained module pair (`lib/views/<Name>View.js` + `lib/domains/<name>.js`). Follow this exactly. Deviations break Phase C integration.

## Files per extraction

- `lib/domains/<name>.js` — pure-function module. NO React. NO DOM. No `latestData.current` references. Inputs are plain data; outputs are plain data or new data objects.
- `lib/views/<Name>View.js` — React functional component. NO state mutation outside `dispatch` calls. View-local `useState` is fine for ephemeral UI flags (open/close, drafts, anim refs).
- `tests/domains/<name>.test.mjs` — `node --test` over the domain module. Mirror `tests/merge.test.mjs` structure (createRequire bootstrap, AAA test pattern, ≥5 tests covering happy path + edge cases).

## Domain function shapes

**Derivations (READ):** `name(data, ...args) => derivedValue`. Pure. No side effects.

```js
const groupedBySection = (data) => {
  const habits = (data.habits || []).filter(h => !h.parentId);
  // ... section grouping logic ...
  return { morning: [...], afternoon: [...], evening: [...], avoid: [...] };
};
```

**Mutations (WRITE):** `name(...args) => (data) => newData`. Curried. Inner call is pure.

```js
const markDayVisited = (dateKey) => (data) => ({
  ...data,
  dayVisits: data.dayVisits?.includes(dateKey)
    ? data.dayVisits
    : [...(data.dayVisits || []), dateKey],
});
```

## Dual-load guard

Every domain and view module ends with:

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { <exportName> };
} else if (typeof window !== "undefined") {
  window.<exportName> = <exportName>;
}
```

Where `<exportName>` is `<name>Domain` for domains and `<Name>View` for views.

## View prop signature (FROZEN)

```js
function <Name>View({ data, dispatch, deviceProfile, callbacks }) {
  // ...
  return React.createElement(...);
}
```

- `data` — the full `data` object. Read-only from the view's perspective. Never mutate.
- `dispatch` — App's dispatch helper. Pass it a curried domain action: `dispatch(xDomain.markDayVisited(key))`.
- `deviceProfile` — `window.__deviceProfile` snapshot at render time. Read-only.
- `callbacks` — flat object of per-view named callbacks for cross-domain or App-scope actions. Spec §3 lists exact names per view.

DO NOT add additional top-level props. If you need more context, add a named entry under `callbacks`.

## Dispatch helper (App-side, for reference)

```js
const dispatch = React.useCallback((transform) => {
  const cur = latestData.current || data;
  const next = typeof transform === "function" ? transform(cur) : transform;
  if (next && next !== cur) save(next);
}, [data, save]);
```

## Test conventions

- Use `node:test` and `node:assert/strict`.
- Bootstrap CJS require via `createRequire(import.meta.url)` (see `tests/merge.test.mjs` for the pattern).
- One `test(...)` block per behavior. AAA structure.
- For READ derivations: feed synthetic `data` shaped like `DD` (see `index.html` near "const DD = {").
- For WRITE mutations: assert immutability — input data must not equal output data, but unaffected fields must be reference-equal.

## Browser + iOS verification gate

Per `.claude/CLAUDE.md`, no UI change is "done" without:
1. Desktop screenshot at >=1024px
2. iOS-width screenshot at ~390px
3. Dark-mode check if any color/border was touched
4. `npm run test:unit` green if any pure logic changed

Plus for extractions specifically: switch to the tab in browser, verify rendering matches pre-extraction behavior. The pre-extraction screenshot is your reference.

## Cross-domain calls

If your view needs to call a helper that belongs to a different domain (e.g. CalendarView needs to toggle habits), DO NOT import the other domain. Use the `callbacks` prop — App provides the cross-domain action as a named callback. This keeps domain boundaries explicit and lets each view be tested in isolation.

As more domains get extracted in follow-up plans, callbacks can be replaced with direct `dispatch(otherDomain.fn(...))` calls. For now, callbacks are the universal cross-domain primitive.
