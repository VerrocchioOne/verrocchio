// lib/constants.js — Wave 3 (App() constants & pure helpers extraction).
//
// Pure data constants currently defined inline in index.html. This file
// is the destination of the Wave 3 lift. It is NOT yet wired in via a
// `<script src>` tag in index.html — that integration step is deferred
// until Wave 2 (component extractions) commits to avoid a parallel-edit
// collision. When the index.html alias-swap lands, follow the pattern
// in docs/superpowers/patterns/view-extraction.md §"Per-component task
// pattern" and the per-constant line numbers documented in
// docs/superpowers/plans/2026-05-23-full-decomposition-wave3-status.md.
//
// Browser dependencies: NONE. Pure data (numbers, strings, objects).
// CSS-var strings inside style objects are resolved by the browser at
// render time, not at module load.
//
// Node dependencies: NONE. The bottom-of-file CommonJS export is what
// makes this module usable from `tests/*.test.mjs` via `createRequire`.
//
// Originally lived inline in index.html at:
//   IMP                                                     L1363
//   HT                                                      L1379
//   SECTIONS                                                L1445
//   DURS                                                    L1641
//   FREQ                                                    L1722
//   DUR_MIN / DUR_MAX / DUR_STEP   (inside App)             L6603
//   I / IS / S / AB                (inside App)             L11125-L11166

// ── PRIORITY / IMPORTANCE TAXONOMY ────────────────────────────────
// Three-tier importance ladder used to color habit chips, weight goal
// progress, and sort filtered lists. Order matters — index 0 is the
// highest priority (Non-Negotiable). Values are user-facing strings;
// don't rename without a migration.
const IMP = [{
  value: "Non-Negotiable",
  color: "var(--c-tint-danger-fg)",
  bg: "var(--c-tint-danger-bg)",
  border: "var(--c-tint-danger-border)"
}, {
  value: "Important",
  color: "var(--c-tint-warn-fg)",
  bg: "var(--c-tint-warn-bg)",
  border: "var(--c-tint-warn-border)"
}, {
  value: "Additive",
  color: "var(--c-text-faint)",
  bg: "var(--c-surface-raised)",
  border: "var(--c-border)"
}];

// ── HABIT TYPE TAXONOMY ───────────────────────────────────────────
// Seven categories the user assigns to each habit. Determines the
// row's accent color across the app and is the X-axis of the habit-
// type distribution chart on the Brief tab.
const HT = [{
  value: "Physical",
  color: "var(--c-tint-success-fg)",
  bg: "var(--c-tint-success-bg)",
  border: "var(--c-tint-success-border)"
}, {
  value: "Mental",
  color: "var(--c-tint-travel-fg)",
  bg: "var(--c-tint-travel-bg)",
  border: "var(--c-tint-travel-border)"
}, {
  value: "Career",
  color: "var(--c-tint-info-fg)",
  bg: "var(--c-tint-info-bg)",
  border: "var(--c-tint-info-border)"
}, {
  value: "Spiritual",
  color: "var(--c-tint-purple-fg)",
  bg: "var(--c-tint-purple-bg)",
  border: "var(--c-tint-purple-border)"
}, {
  value: "Social",
  color: "var(--c-tint-pink-fg)",
  bg: "var(--c-tint-pink-bg)",
  border: "var(--c-tint-pink-border)"
}, {
  value: "Wealth",
  color: "var(--c-tint-warn-fg)",
  bg: "var(--c-tint-warn-bg)",
  border: "var(--c-tint-warn-border)"
}, {
  value: "Creative",
  color: "var(--c-tint-teal-fg)",
  bg: "var(--c-tint-teal-bg)",
  border: "var(--c-tint-teal-border)"
}];

// ── TIME-OF-DAY SECTIONS ──────────────────────────────────────────
// Five buckets the habit list groups into: morning / afternoon /
// evening / all-day / avoid. The first three are time-bounded by
// `data.timeRanges` (or DEFAULT_TIME_RANGES). `all-day` is ambient
// (water, posture). `avoid` is constructive-negative (don't-do).
const SECTIONS = [{
  value: "morning",
  label: "Morning",
  icon: "🌅",
  color: "var(--c-tint-warn-fg)",
  bg: "var(--c-tint-warn-bg)",
  border: "var(--c-tint-warn-border)"
}, {
  value: "afternoon",
  label: "Afternoon",
  icon: "☀️",
  color: "var(--c-tint-orange-fg)",
  bg: "var(--c-tint-orange-bg)",
  border: "var(--c-tint-orange-border)"
}, {
  value: "evening",
  label: "Evening",
  icon: "🌙",
  color: "var(--c-tint-purple-fg)",
  bg: "var(--c-tint-purple-bg)",
  border: "var(--c-tint-purple-border)"
}, {
  value: "all-day",
  label: "Daily Completion",
  icon: "🔁",
  color: "var(--c-tint-teal-fg)",
  bg: "var(--c-tint-teal-bg)",
  border: "var(--c-tint-teal-border)"
}, {
  value: "avoid",
  label: "Avoid",
  icon: "🚫",
  color: "var(--c-tint-danger-fg)",
  bg: "var(--c-tint-danger-bg)",
  border: "var(--c-tint-danger-border)"
}];

// ── DURATION PRESETS ──────────────────────────────────────────────
// Picker options for habit duration. Values are minute strings to
// match the underlying `habit.duration` field (stored as a string for
// historical reasons; do not change without a migration).
const DURS = [
  { value: "5",   label: "5 min" },
  { value: "10",  label: "10 min" },
  { value: "15",  label: "15 min" },
  { value: "20",  label: "20 min" },
  { value: "30",  label: "30 min" },
  { value: "45",  label: "45 min" },
  { value: "60",  label: "1 hr" },
  { value: "90",  label: "1.5 hr" },
  { value: "120", label: "2 hr" },
  { value: "150", label: "2.5 hr" },
  { value: "180", label: "3 hr" },
  { value: "240", label: "4 hr" },
  { value: "300", label: "5 hr" },
  { value: "360", label: "6 hr" },
  { value: "420", label: "7 hr" },
  { value: "480", label: "8 hr" },
  { value: "540", label: "9 hr" },
  { value: "600", label: "10 hr" },
  { value: "660", label: "11 hr" },
  { value: "720", label: "12 hr" }
];

// Duration-filter slider bounds (minutes). The Habits-tab dual-thumb
// range filter clamps to [DUR_MIN, DUR_MAX] in DUR_STEP increments.
// When min === DUR_MIN && max === DUR_MAX the filter is treated as
// "Any" (no filtering).
const DUR_MIN = 0;
const DUR_MAX = 720;
const DUR_STEP = 5;

// ── HABIT FREQUENCY CADENCES ──────────────────────────────────────
// `rank` orders cadences from most-often (1) to least-often (7) when
// a goal expands its linked habits. `daily` is the pre-existing
// implicit default — legacy habits without a `.frequency` field are
// treated as daily by `getFreq()`.
//
// Per-cadence frequency shape:
//   daily      — no extra fields
//   weekdays   — `days: number[]`  (0..6 Sun..Sat; multi-select)
//   weekly     — `day: number`     (0..6 Sun..Sat; single day)
//   monthly    — `monthDay: 1..31`
//   quarterly  — `month: 0..11` + `monthDay: 1..31`
//                (anchor; repeats every 3 months from the anchor)
//   annual     — `month: 0..11` + `monthDay: 1..31`
//                (anchor; repeats every year)
//
// Historical note: earlier builds had `weekly` (no day) and
// `weekly-day` (with day). They've been merged into a single `weekly`
// that always carries a `day`. Legacy `weekly-day` habits are
// migrated on read by `getFreq()`.
const FREQ = [
  { value: "daily",     label: "Daily",       icon: "\u{1F4C5}", rank: 1 },
  { value: "weekdays",  label: "Select Days", icon: "\u{1F5D3}", rank: 2 },
  { value: "weekly",    label: "Weekly",      icon: "\u{1F5D3}", rank: 3 },
  { value: "monthly",   label: "Monthly",     icon: "\u{1F4C6}", rank: 5 },
  { value: "quarterly", label: "Quarterly",   icon: "\u{1F4C6}", rank: 6 },
  { value: "annual",    label: "Annual",      icon: "\u{1F4C6}", rank: 7 }
];

// ── HABIT FREQUENCY HELPERS ──────────────────────────────────────
// Canonical implementations of `getFreq` and `isHabitDueOn`. These are
// the authoritative source; lib/domains/calendar.js carries local copies
// (_getFreq/_isHabitDueOn) inside its IIFE for Node-test isolation, but
// those should always mirror these exactly.
//
// Browser: constants.js loads as a <script> before index.html's inline
// script, so `getFreq` and `isHabitDueOn` are available as script-scope
// globals everywhere in the page (no window.* prefix needed).
// Node: exported via module.exports below for unit testing.

// Normalize a habit's `.frequency` field — collapses the legacy
// "weekly-day" type (deprecated alias) into "weekly" and fills in
// missing numeric fields with null so callers can rely on the shape.
const getFreq = h => {
  const f = h && h.frequency;
  if (!f || !f.type) return { type: "daily", days: [], day: null, monthDay: null, month: null };
  const rawType = f.type === "weekly-day" ? "weekly" : f.type;
  return {
    type: rawType,
    days: Array.isArray(f.days) ? f.days : [],
    day:      typeof f.day      === "number" ? f.day      : null,
    monthDay: typeof f.monthDay === "number" ? f.monthDay : null,
    month:    typeof f.month    === "number" ? f.month    : null
  };
};

// Returns true if habit `h` is scheduled to fire on `dateKey`
// (YYYY-MM-DD). Does NOT check startDate — that guard lives in the
// caller (e.g. allYesterdayHabitsReviewed's dueYesterday filter).
const isHabitDueOn = (h, dateKey) => {
  const fq = getFreq(h);
  if (!fq || fq.type === "daily") return true;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || "");
  if (!m) return true; // unparsable → don't hide
  const dt = new Date(+m[1], +m[2] - 1, +m[3]);
  const dow = dt.getDay();
  const day = dt.getDate();
  const mon = dt.getMonth();
  if (fq.type === "weekdays") return Array.isArray(fq.days) && fq.days.includes(dow);
  if (fq.type === "weekly")   return (fq.day == null ? 1 : fq.day) === dow;
  if (fq.type === "monthly")  return (fq.monthDay || 1) === day;
  if (fq.type === "quarterly") {
    const anchorMonth = fq.month == null ? 0 : fq.month;
    const anchorDay   = fq.monthDay || 1;
    return ((mon - anchorMonth) % 3 + 3) % 3 === 0 && anchorDay === day;
  }
  if (fq.type === "annual") {
    const anchorMonth = fq.month == null ? 0 : fq.month;
    const anchorDay   = fq.monthDay || 1;
    return mon === anchorMonth && day === anchorDay;
  }
  return true;
};

// ── FORM ELEMENT STYLES ───────────────────────────────────────────
// Inline style objects for the inline new-habit form (and several
// other form blocks). `I` is the base input style; `IS` is the
// secondary/smaller-input variant that spreads from `I`. `S` is the
// select style. `AB` is the primary action button. Currently defined
// inside App() at L11125-L11166 — Wave 3 lift moves them to module
// scope here so cross-view forms can share them once SettingsView /
// Onboarding / etc. are extracted in Wave 4.
//
// CSS-var strings are resolved by the browser at render time; passing
// these objects through Node doesn't touch them.
const I = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 14px",
  color: "var(--c-text)",
  fontSize: 14,
  boxShadow: "0 1px 2px rgba(0,0,0,.04)"
};

const IS = {
  ...I,
  fontSize: 13,
  padding: "9px 12px"
};

const S = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px",
  // §5.3 — was fontSize: 12 but the adjacent `IS` input is 13, so a
  // <select> next to an <input> in the same row produced a visible
  // 12-vs-13 jump on iOS (where the system also inflates <select>
  // text independently). Match the input scale.
  fontSize: 13,
  cursor: "pointer",
  color: "var(--c-text-soft)",
  boxShadow: "0 1px 2px rgba(0,0,0,.04)"
};

const AB = {
  background: "#2d5a2d",
  border: "none",
  borderRadius: 8,
  padding: "10px 18px",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer"
};

// CommonJS export for Node-side tests. The `typeof module` guard
// means the browser path (no CommonJS) is untouched and the consts
// above remain script-scope globals usable from index.html's inline
// scripts and from other `<script src>` modules loaded after this
// file.
// ── APP-DATA TABLES (Wave 5.4) ─────────────────────────────────────
// Pure data lifted out of index.html (FEATURES + ACHIEVEMENT_TIERS +
// ACHIEVEMENTS + ACHIEVEMENT_CATEGORIES + MOODS + JTAGS). Declared at
// top-level classic-script scope so the inline body App() references
// them by bare name — same pattern as IMP/HT/SECTIONS above.
// ACHIEVEMENTS's last entry depends on FEATURES.length, so FEATURES
// must be declared first.

const FEATURES = [
  { id: "home.view",              label: "Daily briefing",          cat: "Daily",  tipWhenMissing: false },
  { id: "habits.view",            label: "Habits tab",              cat: "Daily",  tipWhenMissing: false },
  { id: "goals.view",             label: "Goals tab",               cat: "Daily",  tipWhenMissing: false },
  { id: "todos.view",             label: "Tasks tab",               cat: "Daily",  tipWhenMissing: true,  tipDesc: "Tasks pair one-off reminders with the goals they ladder up to." },
  { id: "reflection.view",        label: "Reflection tab",          cat: "Daily",  tipWhenMissing: true,  tipDesc: "Journaling unlocks the AI insights and your history." },
  { id: "habit.create",           label: "Create a habit",          cat: "Create", tipWhenMissing: false },
  { id: "habit.subunits",         label: "Habit with a target",     cat: "Create", tipWhenMissing: true,  tipDesc: "Target + units (e.g. 8 cups) lets you tap-to-log partial progress." },
  { id: "goal.create",            label: "Create a goal",           cat: "Create", tipWhenMissing: true,  tipDesc: "Goals give habits something to ladder up to." },
  { id: "todo.create",            label: "Add a task",              cat: "Create", tipWhenMissing: true,  tipDesc: "Quick one-off reminders pinned to a goal." },
  { id: "journal.create",         label: "Write a journal entry",   cat: "Create", tipWhenMissing: true,  tipDesc: "Reflection drives the AI insights." },
  { id: "calendar.view",          label: "Browse the calendar",     cat: "Review", tipWhenMissing: true,  tipDesc: "Day-by-day history with color-coded completion." },
  { id: "calendar.daySnapshot",   label: "Open a day snapshot",     cat: "Review", tipWhenMissing: true,  tipDesc: "Tap any day in the calendar to see that day's habits, goals, tasks, and journal entries." },
  { id: "travel.mark",            label: "Mark a travel day",       cat: "Review", tipWhenMissing: true,  tipDesc: "Different habit routine when you're on the road." },
  { id: "home.intention",         label: "Set today's intention",   cat: "Daily",  tipWhenMissing: true,  tipDesc: "A one-line focus that sits at the top of the day's ritual." },
  { id: "todo.archive",           label: "Archive a task",          cat: "Create", tipWhenMissing: true,  tipDesc: "Send completed or no-longer-relevant tasks out of the active list without deleting them." },
  { id: "brand.pronounce",        label: "Hear “Verrocchio”", cat: "Settings", tipWhenMissing: true,  tipDesc: "Tap the speaker icon next to the brand name to hear how it's pronounced." },
  { id: "profile.view",           label: "Open your Profile",       cat: "Settings", tipWhenMissing: false },
  { id: "settings.view",          label: "Visit App Settings",      cat: "Settings", tipWhenMissing: false },
  { id: "settings.tone",          label: "Pick a briefing tone",    cat: "Settings", tipWhenMissing: true,  tipDesc: "Warm / Neutral / Tough love — make the briefing sound right." },
  { id: "settings.location",      label: "Set home location",       cat: "Settings", tipWhenMissing: true,  tipDesc: "Unlocks the when-you-leave-home notification." },
  { id: "settings.notifications", label: "Enable notifications",    cat: "Settings", tipWhenMissing: true,  tipDesc: "Get pinged when you're out with habits to log." },
  { id: "ai.crowdingReorder",     label: "Re-prioritize a habit",   cat: "Review",   tipWhenMissing: false }
];
/* ── Achievements definitions ──
   Each achievement has a `stat` (the derived number we compare) and a
   `threshold`. When stats[stat] >= threshold, the achievement is
   unlocked. Tiers are purely cosmetic (Bronze/Silver/Gold/Platinum/
   Diamond) and inform the badge color. Adding a new achievement is a
   one-liner — the Level-bar modal + unlock logic pick it up
   automatically. Ordered: within each category, easier tiers come
   first so the UI can render them left-to-right as a ladder. */
const ACHIEVEMENT_TIERS = {
  Bronze:   { color: "var(--c-tint-warn-fg)",   bg: "var(--c-tint-warn-bg)",   border: "var(--c-tint-warn-border)" },
  Silver:   { color: "var(--c-tint-slate-fg)",  bg: "var(--c-tint-slate-bg)",  border: "var(--c-tint-slate-border)" },
  Gold:     { color: "var(--c-tint-yellow-fg)", bg: "var(--c-tint-yellow-bg)", border: "var(--c-tint-yellow-border)" },
  Platinum: { color: "var(--c-tint-travel-fg)", bg: "var(--c-tint-travel-bg)", border: "var(--c-tint-travel-border)" },
  Diamond:  { color: "var(--c-tint-purple-fg)", bg: "var(--c-tint-purple-bg)", border: "var(--c-tint-purple-border)" }
};
const ACHIEVEMENTS = [
  // DEDICATION — days you opened the app. Icon ladder tracks the time
  // horizon: seedling (first day) → sunrise (one week of showing up) →
  // calendar (one month) → century mark → full year lap around the sun.
  { id:"visit-1",   cat:"Dedication", tier:"Bronze",   icon:"🌱", name:"Show Up",          desc:"Open the app for the first time.",          threshold:1,   stat:"visits" },
  { id:"visit-7",   cat:"Dedication", tier:"Silver",   icon:"🌅", name:"Week Warrior",     desc:"Open the app on 7 different days.",         threshold:7,   stat:"visits" },
  { id:"visit-30",  cat:"Dedication", tier:"Gold",     icon:"🗓️", name:"Steady Rhythm",    desc:"Open the app on 30 different days.",        threshold:30,  stat:"visits" },
  { id:"visit-100", cat:"Dedication", tier:"Platinum", icon:"💯", name:"Century Mind",     desc:"Open the app on 100 different days.",       threshold:100, stat:"visits" },
  { id:"visit-365", cat:"Dedication", tier:"Diamond",  icon:"🌍", name:"Full Lap",         desc:"Open the app on 365 different days.",       threshold:365, stat:"visits" },
  // STREAKS — longest streak on any habit (all-time, across all habits)
  { id:"streak-3",   cat:"Streaks",    tier:"Bronze",   icon:"✨", name:"Spark",           desc:"Hit a 3-day streak on any habit.",          threshold:3,   stat:"bestStreak" },
  { id:"streak-7",   cat:"Streaks",    tier:"Silver",   icon:"🔥", name:"On Fire",         desc:"Hit a 7-day streak on any habit.",          threshold:7,   stat:"bestStreak" },
  { id:"streak-30",  cat:"Streaks",    tier:"Gold",     icon:"⚡", name:"Unbreakable",     desc:"Hit a 30-day streak on any habit.",         threshold:30,  stat:"bestStreak" },
  { id:"streak-100", cat:"Streaks",    tier:"Platinum", icon:"🌋", name:"Century Streak",  desc:"Hit a 100-day streak on any habit.",        threshold:100, stat:"bestStreak" },
  { id:"streak-365", cat:"Streaks",    tier:"Diamond",  icon:"☄️", name:"Year-Long Blaze", desc:"Hit a 365-day streak on any habit.",        threshold:365, stat:"bestStreak" },
  // ACHIEVER — goals completed
  { id:"goal-1",   cat:"Achiever",   tier:"Bronze",   icon:"🎯", name:"First Win",        desc:"Complete your first goal.",                 threshold:1,   stat:"goals" },
  { id:"goal-3",   cat:"Achiever",   tier:"Silver",   icon:"🏅", name:"Triple Threat",    desc:"Complete 3 goals.",                         threshold:3,   stat:"goals" },
  { id:"goal-10",  cat:"Achiever",   tier:"Gold",     icon:"🏆", name:"Ten Tall",         desc:"Complete 10 goals.",                        threshold:10,  stat:"goals" },
  { id:"goal-25",  cat:"Achiever",   tier:"Platinum", icon:"👑", name:"Quarter Master",   desc:"Complete 25 goals.",                        threshold:25,  stat:"goals" },
  { id:"goal-50",  cat:"Achiever",   tier:"Diamond",  icon:"🌠", name:"Half a Hundred",   desc:"Complete 50 goals.",                        threshold:50,  stat:"goals" },
  // ACHIEVER (bonus — quality + clean-slate achievements). These live in
  // the Achiever category because they reward goal-level commitment, not
  // just count. `smart-1` lands after the user fills every SMART field
  // on a single goal (proof they actually used the framework, not just
  // typed a name). `active-cleared` is the clean-slate moment — zero
  // active goals after having completed at least one, awarded as a
  // one-time psychological reset.
  { id:"smart-1",       cat:"Achiever", tier:"Silver", icon:"🎯", name:"SMART Set",    desc:"Fill every SMART field on a goal.",          threshold:1, stat:"smartGoals" },
  { id:"active-cleared",cat:"Achiever", tier:"Gold",   icon:"🧹", name:"Clean Slate",  desc:"Complete every active goal.",                threshold:1, stat:"activeGoalsCleared" },
  // BUILDER — active habits ever stacked at once
  { id:"habit-1",  cat:"Builder",    tier:"Bronze",   icon:"🧱", name:"Breaking Ground",  desc:"Add your first habit.",                     threshold:1,   stat:"habitsActive" },
  { id:"habit-5",  cat:"Builder",    tier:"Silver",   icon:"🏗️", name:"Foundation",       desc:"Have 5 active habits at once.",             threshold:5,   stat:"habitsActive" },
  { id:"habit-10", cat:"Builder",    tier:"Gold",     icon:"🏛️", name:"Full Routine",     desc:"Have 10 active habits at once.",            threshold:10,  stat:"habitsActive" },
  { id:"habit-20", cat:"Builder",    tier:"Platinum", icon:"🗼", name:"Master Architect", desc:"Have 20 active habits at once.",            threshold:20,  stat:"habitsActive" },
  // BUILDER (bonus — goal-creation milestones + habit-per-goal link).
  // `goalsCreated` tracks every goal the user has EVER created (live +
  // archived), so completing a goal doesn't claw back progress on these
  // tiers. `habit-per-goal` requires every active goal to have at least
  // one linked habit — the app's core value prop is "daily reps ladder
  // up to real goals", so this one rewards actually wiring the ladder.
  { id:"goals-created-1",  cat:"Builder", tier:"Bronze",   icon:"🌱", name:"First Goal",     desc:"Create your first goal.", threshold:1,  stat:"goalsCreated" },
  { id:"goals-created-3",  cat:"Builder", tier:"Silver",   icon:"🌿", name:"Three-Pointer",  desc:"Create 3 goals.",         threshold:3,  stat:"goalsCreated" },
  { id:"goals-created-5",  cat:"Builder", tier:"Gold",     icon:"🌳", name:"High Five",      desc:"Create 5 goals.",         threshold:5,  stat:"goalsCreated" },
  { id:"goals-created-10", cat:"Builder", tier:"Platinum", icon:"🏛️", name:"Double Digits",  desc:"Create 10 goals.",        threshold:10, stat:"goalsCreated" },
  { id:"goals-created-25", cat:"Builder", tier:"Diamond",  icon:"🏆", name:"Quartercentury", desc:"Create 25 goals.",        threshold:25, stat:"goalsCreated" },
  { id:"habit-per-goal",   cat:"Builder", tier:"Gold",     icon:"🔗", name:"Laddered Up",    desc:"Link at least one habit to every goal.", threshold:1, stat:"habitPerGoal" },
  // XP
  { id:"xp-500",    cat:"XP",         tier:"Bronze",   icon:"⚡", name:"Level 2",          desc:"Reach Level 2 (500 XP).",                   threshold:500,    stat:"xp" },
  { id:"xp-2500",   cat:"XP",         tier:"Silver",   icon:"⚡", name:"Level 6",          desc:"Reach Level 6 (2,500 XP).",                 threshold:2500,   stat:"xp" },
  { id:"xp-10000",  cat:"XP",         tier:"Gold",     icon:"⚡", name:"Level 21",         desc:"Earn 10,000 XP.",                           threshold:10000,  stat:"xp" },
  { id:"xp-50000",  cat:"XP",         tier:"Platinum", icon:"⚡", name:"Level 101",        desc:"Earn 50,000 XP.",                           threshold:50000,  stat:"xp" },
  { id:"xp-250000", cat:"XP",         tier:"Diamond",  icon:"⚡", name:"XP Legend",        desc:"Earn 250,000 XP.",                          threshold:250000, stat:"xp" },
  // EXPLORER — reward the user for discovering parts of the app. The
  // underlying signal is `data.featureAccess` (touchFeature writes a
  // timestamp the first time each FEATURES entry fires), and the stat
  // `featuresExplored` counts how many of those timestamps exist. Tiers
  // ladder from "tapped your first tab" all the way to "touched
  // everything we built" so the shelf visibly rewards poking around.
  { id:"explore-1",   cat:"Explorer",   tier:"Bronze",   icon:"🧭", name:"First Step",       desc:"Open any part of the app for the first time.",  threshold:1,                  stat:"featuresExplored" },
  { id:"explore-5",   cat:"Explorer",   tier:"Silver",   icon:"🗺️", name:"Wandering In",     desc:"Try 5 different parts of the app.",              threshold:5,                  stat:"featuresExplored" },
  { id:"explore-10",  cat:"Explorer",   tier:"Gold",     icon:"🔭", name:"Feature Finder",   desc:"Try 10 different parts of the app.",             threshold:10,                 stat:"featuresExplored" },
  { id:"explore-all", cat:"Explorer",   tier:"Diamond",  icon:"🏅", name:"Completionist",    desc:"Unlock every part of the app.",                  threshold:FEATURES.length,    stat:"featuresExplored" }
];
const ACHIEVEMENT_CATEGORIES = ["Dedication", "Streaks", "Achiever", "Builder", "XP", "Explorer"];
const MOODS = [{
  label: "Energized",
  icon: "⚡",
  color: "#d97706"
}, {
  label: "Focused",
  icon: "🎯",
  color: "#16a34a"
}, {
  label: "Calm",
  icon: "🌊",
  color: "#0891b2"
}, {
  label: "Grateful",
  icon: "🙏",
  color: "#7c3aed"
}, {
  label: "Tired",
  icon: "😴",
  color: "#9ca3af"
}, {
  label: "Anxious",
  icon: "😰",
  color: "#ea580c"
}, {
  label: "Happy",
  icon: "😊",
  color: "#d97706"
}, {
  label: "Reflective",
  icon: "🪞",
  color: "#db2777"
}];
const JTAGS = ["daily-recap", "reflection", "gratitude", "wins", "challenges", "ideas", "feelings", "goals", "learning"];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { IMP, HT, SECTIONS, DURS, DUR_MIN, DUR_MAX, DUR_STEP, FREQ, I, IS, S, AB, FEATURES, ACHIEVEMENT_TIERS, ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, MOODS, JTAGS, getFreq, isHabitDueOn };
}
