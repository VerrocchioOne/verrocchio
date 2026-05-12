# Verrocchio — Code Quality & Crash Audit

**Date:** 2026-05-12
**Source:** parallel review subagent (code quality, lean)
**Status:** authoritative input for master-plan.md Wave 1 (ErrorBoundary + global handlers) and Wave 3 (anti-pattern fixes).

## 1. Executive summary

- **Overall risk: HIGH for production. Score: 4/10.** App works for happy path but has zero crash-resistance scaffolding.
- **Top blockers:** no ErrorBoundary, no global error handlers, partial safe-area-inset coverage, 3 `console.log` in `wipeAllData`, timer/listener leak risk.
- **Anti-pattern discipline is otherwise strong:** zero `toISOString()` date-key violations, zero in-place `h.completions` mutations outside fresh-clone demo seed, zero unwrapped `localStorage.setItem`, **one** unsanitized `userDoc().set()` at `index.html:3971`, zero `dangerouslySetInnerHTML`.

## 2. BLOCKER findings

- **CQ-B-01 — No React error boundary.** Single uncaught exception → white screen.
- **CQ-B-02 — No global error / unhandledrejection handlers.** Async errors bypass React tree.
- **CQ-B-03 — `console.log` in `wipeAllData`** (`index.html:6787, 6817, 6825`).
- **CQ-B-04 — Safe-area-inset only 13 usages** for a multi-modal Capacitor app — partial coverage.
- **CQ-B-05 — Timer/listener leak risk: 35 setTimeout/setInterval vs 29 clears** (~6 unaccounted).

## 3. HIGH findings

- **CQ-H-01 — No retry UI for failed Firestore writes** (`index.html:6603, 6640, 6765` — `.catch(err => {})` silent).
- **CQ-H-02 — `wipeAllData` `userDoc().set()` (line 6824) has no timeout** — flaky network hangs spinner.
- **CQ-H-03 — Achievement timestamp uses `toISOString()` (line 6956).** Mixes with epoch elsewhere; standardize on `Date.now()`.
- **CQ-H-04 — Demo seed mutation pattern (lines 3828-3836)** — technically safe (fresh clone) but grep-noisy. Rewrite with spread.
- **CQ-H-05 — `userDoc(auth.currentUser.uid).set(seeded)` at `index.html:3971` — NO `sanitizeForFirestore`.** Fix: `userDoc(...).set(sanitizeForFirestore(seeded))`.
- **CQ-H-06 — No Capacitor App lifecycle hooks** — background→foreground transitions don't refresh listeners. Register `App.addListener('appStateChange', ...)`.
- **CQ-H-07 — `JSON.parse(localStorage.getItem(...))` likely unwrapped in some sites** — corrupt entry throws at startup. Wrap each in try/catch with fallback.
- **CQ-H-08 — Demo password hardcoded** (cross-ref SEC-C-01).

## 4. MEDIUM findings

- **CQ-M-01** — Firestore `.set().catch(err => {})` silent at 6603/6640. Add `console.warn`.
- **CQ-M-02** — `archivedAt: completedAt.toISOString()` (line 3865) mixes ISO + epoch.
- **CQ-M-03** — No CSP meta tag. Add via `firebase.json` headers.
- **CQ-M-04** — Long inline spread on `goals` journal write (line 12660) — readability.
- **CQ-M-05** — Verify `<meta name="viewport" content="..., viewport-fit=cover">`.

## 5. LOW findings

- **CQ-L-01** — Replace ISO with `Date.now()` for achievements.
- **CQ-L-02** — Wrap `wipeAllData` set in try/catch for clarity.
- **CQ-L-03** — Add comment on local `Map.set()` to reduce grep noise (11769, 18542, 18743).
- **CQ-L-04** — Split `localStorage.setItem` paired at 3958/3959 (one try wraps two sets).

## 6. Anti-pattern violation count

| Rule | Violations |
|---|---|
| `toISOString()` as date key | **0** (14 hits are timestamps) |
| In-place mutation of `h.completions[k]`, `h.completionTimes[k]`, `h.completionUnits[k]` | **2** writes in demo seed (3828, 3829, 3836) on fresh clone |
| Unwrapped `localStorage.setItem` / `removeItem` | **0** |
| `userDoc().set()` without `sanitizeForFirestore` | **1** (line 3971) |
| `console.log/info/debug` in production | **3** (6787, 6817, 6825) |
| `dangerouslySetInnerHTML` / `innerHTML =` | **0** |

## 7. ErrorBoundary (paste after React UMD loads, before App component)

```js
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) {
    try { console.error("[verrocchio:boundary]", err, info && info.componentStack); } catch (_) {}
    try { localStorage.setItem("v-last-error", JSON.stringify({ msg: String(err && err.message || err), at: Date.now() })); } catch (_) {}
  }
  reset = () => { this.setState({ err: null }); };
  render() {
    if (!this.state.err) return this.props.children;
    return React.createElement("div", {
      style: { padding: 24, textAlign: "center", color: "var(--c-text, #222)",
               paddingTop: "calc(env(safe-area-inset-top) + 24px)" }
    },
      React.createElement("div", { style: { fontSize: 48, marginBottom: 12 } }, "⚠️"),
      React.createElement("h2", null, "Something went wrong"),
      React.createElement("p", { style: { opacity: 0.7, marginBottom: 16 } },
        "Your data is safe. Tap retry to continue."),
      React.createElement("button", {
        onClick: this.reset,
        style: { padding: "10px 20px", borderRadius: 10, border: "none",
                 background: "var(--accent, #2d5a2d)", color: "#fff", fontWeight: 600 }
      }, "Retry"),
      React.createElement("button", {
        onClick: () => location.reload(),
        style: { padding: "10px 20px", marginLeft: 8, borderRadius: 10,
                 border: "1px solid var(--c-border, #ccc)", background: "transparent" }
      }, "Reload app")
    );
  }
}
```

## 8. Global error handlers (paste in `<head>` before React loads)

```js
(function () {
  function record(kind, payload) {
    try {
      localStorage.setItem("v-last-error", JSON.stringify({
        kind: kind, msg: String(payload && (payload.message || payload.reason || payload)),
        at: Date.now()
      }));
    } catch (_) {}
    try { console.error("[verrocchio:" + kind + "]", payload); } catch (_) {}
  }
  window.addEventListener("error", function (e) { record("error", e.error || e.message); });
  window.addEventListener("unhandledrejection", function (e) { record("unhandledrejection", e.reason); });
})();
```

## 9. Safe-area-inset coverage assessment

**PARTIALLY COVERED — 13 usages.** Expected ~20–30 for a Capacitor app with multiple full-screen modals, tab bar, sticky headers, goals drawer, bottom-sticky CTAs. Required: physical-device test of every modal/sheet on a notched iPhone before submission.

## 10. Test-gap priority list

1. **`sanitizeForFirestore` round-trip** for every habit shape (with `null`/`undefined` fields, empty mood, missing completionUnits).
2. **Sign-out → sign-in-as-different-user data isolation** (Firestore offline IDB).
3. **`wipeAllData` partial-failure recovery** (local cleared, server set failed).
4. **JSON.parse fallbacks** for every `localStorage.getItem`.
5. **Streak math across DST + timezone changes** (NYC→LA mid-day).
