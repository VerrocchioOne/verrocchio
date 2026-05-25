// lib/fmt.js
//
// Pure display formatters extracted from index.html:
//   MONTHS_SHORT / MONTHS_LONG — month name lookups (Jan / January).
//   ordSuffix(n)               — 1st / 2nd / 3rd / 4th ... 21st ...
//   sanitizeDecimal(raw)       — habit target / increment input cleaner.
//   fmtDur(minutes)            — "30m" / "1h" / "1h 30m" or null.
//   fmtT(iso)                  — "6:00 AM" style time.
//   fmtD(iso)                  — "Mon, May 25" style date.
//
// Originally inline at index.html L1450-L1457 (months + ordSuffix)
// and L1634-L1664 (sanitizeDecimal + fmtDur + fmtT + fmtD).
// All declared at top-level classic-script scope so the inline body
// App() picks them up by bare name (same pattern as lib/constants.js).

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// Ordinal suffix for day-of-month display (1st, 2nd, 3rd, 4th, … 21st, …).
const ordSuffix = n => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return n + "th";
  switch (n % 10) { case 1: return n + "st"; case 2: return n + "nd"; case 3: return n + "rd"; default: return n + "th"; }
};

// Decimal-input sanitizer for habit target / increment fields.
// Strips anything that isn't a digit or dot, collapses extra dots so
// the user can't type "1.2.3", and caps the fractional portion at
// 2 chars so saved values stay 2-decimal-place precision (4.50, not
// 4.5000). An empty string survives untouched so the input can be
// cleared without snapping back to "0".
const sanitizeDecimal = (raw) => {
  const cleaned = String(raw == null ? "" : raw).replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot < 0) return cleaned;
  const intPart = cleaned.slice(0, firstDot);
  const fracPart = cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  return intPart + "." + fracPart;
};
const fmtDur = v => {
  if (!v) return null;
  const n = parseInt(v);
  if (isNaN(n)) return null;
  if (n < 60) return `${n}m`;
  if (n % 60 === 0) return `${n / 60}h`;
  return `${Math.floor(n / 60)}h ${n % 60}m`;
};
const fmtT = iso => new Date(iso).toLocaleTimeString("en-US", {
  hour: "numeric",
  minute: "2-digit"
});
const fmtD = iso => new Date(iso).toLocaleDateString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric"
});
