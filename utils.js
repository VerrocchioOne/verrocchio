// Pure date/streak utilities shared by the Verrocchio app and the
// test suite. Loaded from index.html as a classic <script>, which
// puts the `const` bindings in the shared Script scope so the inline
// app script below can reference them by name (dk, tk, pastDays, …).
// Also exports via CommonJS when the file is required from Node so
// tests/*.test.mjs can import the same source of truth.

// Local YYYY-MM-DD for a Date. Using toISOString() here would convert
// to UTC first, which silently shifts the "day" by ±1 near midnight
// for users east/west of UTC — breaking streaks, "today" lookups, and
// calendar keys.
const dk = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const tk = () => dk(new Date());

function pastDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return dk(d);
  });
}

function getStreak(h) {
  let s = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (h.completions?.[dk(d)]) s++;
    else break;
  }
  return s;
}

// How many days back we have to look to find the most recent completion.
// Returns null if there has never been a completion in the last year.
function daysSinceLast(h) {
  for (let i = 1; i <= 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (h.completions?.[dk(d)]) return i;
  }
  return null;
}

function getCR(h) {
  return {
    pct: Math.round(pastDays(30).filter(d => h.completions?.[d]).length / 30 * 100)
  };
}

function getLast14(h) {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const k = dk(d);
    return { k, done: !!h.completions?.[k] };
  });
}

// CommonJS export for Node-side tests. The `typeof module` guard means
// the browser path (no CommonJS) is untouched.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { dk, tk, pastDays, getStreak, daysSinceLast, getCR, getLast14 };
}
