// Seed a small group of demo Verrocchio accounts with a couple weeks of
// simulated habit data. Each persona is shaped to surface a different
// kind of insight (strong correlation, falling-off-the-wagon, steady
// mid-range, brand-new-user) so you can log in as each and see how the
// briefing, tips, and patterns render against realistic data.
//
// Usage:
//   node scripts/seed-demo-users.mjs
//
// Requirements:
//   • Node 18+ (for built-in fetch)
//   • Firebase email/password provider enabled for the project (it is,
//     per the main app's sign-in flow)
//   • Internet (hits Google Identity Toolkit + Firestore REST APIs)
//
// Behavior:
//   For each persona: try to create a new Firebase account. If an
//   account with that email already exists (re-running the script),
//   sign in with the same password instead. Either way, overwrite the
//   user's Firestore doc with a fresh two-week seed. So re-running is
//   safe and idempotent.
//
// Output:
//   A list of { email, password } pairs on success — paste those into
//   the app's sign-in screen to explore each persona.

const FIREBASE_API_KEY    = "AIzaSyDqweiDzza1Jkk-Amppy9ZfMvhc8AHHC_k";
const FIREBASE_PROJECT_ID = "verrocchio-1b116";
const DEMO_PASSWORD       = "verrocchio-demo-1";

const PERSONAS = [
  { email: "alex.morning@demo.verrocchio.app", name: "Alex (Morning Runner)",   recipe: "morning-consistent" },
  { email: "blair.slipping@demo.verrocchio.app", name: "Blair (Slipping Off)",   recipe: "falling-off"        },
  { email: "casey.steady@demo.verrocchio.app",   name: "Casey (Steady Middle)",  recipe: "steady-average"     },
  { email: "dani.new@demo.verrocchio.app",       name: "Dani (Brand New)",       recipe: "brand-new"          }
];

// ─── Firebase REST helpers ────────────────────────────────────────

async function signUpOrIn(email, password) {
  const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const signinUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const body = JSON.stringify({ email, password, returnSecureToken: true });
  const headers = { "Content-Type": "application/json" };
  let r = await fetch(signupUrl, { method: "POST", headers, body });
  let j = await r.json();
  if (r.ok) return { mode: "created", idToken: j.idToken, localId: j.localId };
  const msg = j.error?.message || "";
  if (msg.includes("EMAIL_EXISTS")) {
    r = await fetch(signinUrl, { method: "POST", headers, body });
    j = await r.json();
    if (r.ok) return { mode: "reused",  idToken: j.idToken, localId: j.localId };
    throw new Error(`Sign-in failed for existing account: ${j.error?.message || r.status}`);
  }
  throw new Error(`Signup failed: ${msg || r.status}`);
}

// Convert a JS value tree to Firestore's typed-JSON format. The
// Firestore REST API wants every leaf wrapped in { <type>Value: ... },
// every object wrapped in { mapValue: { fields: {...} } }, etc. Only
// handles the types we actually seed; anything else falls back to
// stringValue so a surprising value doesn't crash the write.
function toFirestoreValue(v) {
  if (v === null || v === undefined)      return { nullValue: null };
  if (typeof v === "boolean")             return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string")              return { stringValue: v };
  if (Array.isArray(v))                   return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") {
    const fields = {};
    for (const [k, val] of Object.entries(v)) fields[k] = toFirestoreValue(val);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

async function writeUserDoc(uid, idToken, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({ fields })
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Firestore write failed (${r.status}): ${err}`);
  }
}

// ─── Persona data builders ────────────────────────────────────────

function dkFor(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeHabit(id, text, section, type, importance, extras = {}) {
  return {
    id, text, section, type, importance,
    frequency: { type: "daily", days: [], day: null, monthDay: 1, month: 0 },
    completions: {},
    completionTimes: {},
    completionUnits: {},
    notes: null,
    duration: null,
    goalId: null,
    location: "both",
    icon: null,
    startDate: null,
    target: null,
    unitLabel: null,
    increment: null,
    _order: 0,
    ...extras
  };
}

function buildPersona(recipe) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - i); return dkFor(d);
  });

  if (recipe === "morning-consistent") {
    // Strong morning person; should trigger a correlation between a
    // completed-early run and a completed evening read (lift > 0.20).
    const h = [
      makeHabit(101, "Morning Run", "morning", "Physical", "Non-Negotiable", { target: 30, unitLabel: "min", increment: 10, _order: 0 }),
      makeHabit(102, "Meditate",    "morning", "Mental",   "Important",     { _order: 1 }),
      makeHabit(103, "Read before bed", "evening", "Mental", "Important",  { _order: 0 }),
      makeHabit(104, "Drink Water", "afternoon", "Physical", "Additive",    { target: 8, unitLabel: "cups", increment: 1, _order: 0 })
    ];
    for (let i = 0; i < 14; i++) {
      const k = days[i];
      const runEarly = i < 12;                                          // 12/14 on-time
      if (runEarly) {
        h[0].completions[k]      = "done";
        h[0].completionTimes[k]  = "06:30";
        h[0].completionUnits[k]  = 30;
      }
      if (i < 13) {
        h[1].completions[k]     = "done";
        h[1].completionTimes[k] = "07:10";
      }
      // Read at night on 10/12 of the run-early days → lift pops up
      if (runEarly && i !== 4 && i !== 8) {
        h[2].completions[k]     = "done";
        h[2].completionTimes[k] = "22:00";
      }
      // Water partial most days, hits target on weekends (i % 7 < 2)
      const cups = (i % 7 < 2) ? 8 : 5 + (i % 3);
      h[3].completionUnits[k]  = cups;
      h[3].completionTimes[k]  = "21:00";
      if (cups >= 8) h[3].completions[k] = "done";
    }
    return {
      habits: h,
      goals: [{
        id: 201, text: "Complete a half-marathon",
        type: "Physical",
        smart: {
          specific:    "Finish an official half-marathon race",
          measurable:  "42",
          measurableUnit: "km",
          achievable:  "Currently running 20km/week",
          relevant:    "Long-term cardio fitness goal",
          timebound:   "2026-08-15"
        },
        completed: false, _order: 0
      }],
      xp: 620,
      aiTone: "encouraging"
    };
  }

  if (recipe === "falling-off") {
    // Strong first week, noticeable slip in the second → triggers the
    // off-schedule tip and a low-completion nudge.
    const h = [
      makeHabit(111, "Gym workout",   "afternoon", "Physical", "Important", { target: 45, unitLabel: "min", increment: 15, _order: 0 }),
      makeHabit(112, "Journal",       "evening",   "Mental",   "Additive",  { _order: 0 }),
      makeHabit(113, "Skip sugar",    "avoid",     "Physical", "Important", { _order: 0 })
    ];
    for (let i = 0; i < 14; i++) {
      const k = days[i];
      const oldWeek = i >= 7;
      if (oldWeek) {
        h[0].completions[k] = "done";  h[0].completionTimes[k] = "17:00"; h[0].completionUnits[k] = 45;
        h[1].completions[k] = "done";  h[1].completionTimes[k] = "22:30";
        if (i !== 10) { h[2].completions[k] = "done"; h[2].completionTimes[k] = "20:00"; }
      } else {
        // Recent week: gym landing late (off-schedule), journal gone
        if (i === 0 || i === 2) {
          h[0].completions[k]     = "done";
          h[0].completionTimes[k] = "21:30"; // well past the 6pm cutoff
          h[0].completionUnits[k] = 45;
        } else if (i === 4) {
          h[0].completions[k]     = "missed";
          h[0].completionTimes[k] = "23:00";
        } else if (i === 5) {
          h[0].completions[k]     = "done";
          h[0].completionTimes[k] = "22:00";
          h[0].completionUnits[k] = 45;
        }
        if (i === 1) { h[1].completions[k] = "done"; h[1].completionTimes[k] = "23:30"; }
        if (i === 3) { h[2].completions[k] = "missed"; h[2].completionTimes[k] = "14:00"; }
      }
    }
    return {
      habits: h,
      goals: [{ id: 211, text: "Get back to 3 gym sessions a week", type: "Physical", smart: {}, completed: false, _order: 0 }],
      xp: 240,
      aiTone: "tough-love"
    };
  }

  if (recipe === "steady-average") {
    // Middle-of-the-road user — ~55-65% completion across habits.
    const h = [
      makeHabit(121, "Morning stretch", "morning",   "Physical", "Additive",  { _order: 0 }),
      makeHabit(122, "Read for 20 min", "evening",   "Mental",   "Important", { target: 20, unitLabel: "min", increment: 5, _order: 0 }),
      makeHabit(123, "Walk outside",    "afternoon", "Physical", "Important", { _order: 0 }),
      makeHabit(124, "Call a friend",   "evening",   "Social",   "Additive",  { _order: 1 })
    ];
    for (let i = 0; i < 14; i++) {
      const k = days[i];
      if (i % 3 !== 0) { h[0].completions[k] = "done"; h[0].completionTimes[k] = "07:30"; }
      if (i % 2 === 0) { h[1].completions[k] = "done"; h[1].completionTimes[k] = "21:00"; h[1].completionUnits[k] = 20; }
      if (i % 4 !== 3) { h[2].completions[k] = "done"; h[2].completionTimes[k] = "13:00"; }
      if (i % 5 === 0) { h[3].completions[k] = "done"; h[3].completionTimes[k] = "19:00"; }
    }
    return {
      habits: h,
      goals: [{ id: 221, text: "Read 12 books this year", type: "Mental", smart: {}, completed: false, _order: 0 }],
      xp: 310,
      aiTone: "neutral"
    };
  }

  if (recipe === "brand-new") {
    // Just signed up; three days of data. Briefing should fall back
    // to the "log N more days" welcome copy; correlations should be
    // silent (no 14-day support yet).
    const h = [
      makeHabit(131, "Drink water", "morning",   "Physical", "Important", { target: 8, unitLabel: "cups", increment: 1, _order: 0 }),
      makeHabit(132, "Go outside",  "afternoon", "Physical", "Additive",  { _order: 0 })
    ];
    for (let i = 0; i < 3; i++) {
      const k = days[i];
      h[0].completionUnits[k] = 3 + i;
      h[0].completionTimes[k] = "10:00";
      if (i === 0) { h[1].completions[k] = "done"; h[1].completionTimes[k] = "14:00"; }
    }
    return {
      habits: h,
      goals: [],
      xp: 30,
      aiTone: "neutral"
    };
  }

  throw new Error("unknown recipe " + recipe);
}

function fullUserDoc(seed, dayCount) {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const visits = Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - i); return dkFor(d);
  });
  return {
    habits: seed.habits,
    goals: seed.goals || [],
    todos: [],
    journal: [],
    quotes: [],
    archive: [],
    goalArchive: [],
    customGoalTypes: [],
    customImportance: [],
    customSections: [],
    dayVisits: visits,
    bestStreaks: {},
    achievementsUnlocked: {},
    xp: seed.xp || 0,
    dailyRitual: {},
    homeLocation: "",
    travelDays: [],
    celebratedFirstGoal: (seed.goals || []).length > 0,
    celebratedFirstHabit: (seed.habits || []).length > 0,
    onboardingComplete: true,
    sortPrefs: { habits: "default", goals: "default", todos: "default" },
    aiTone: seed.aiTone || "neutral",
    homeCoords: null,
    locationOptIn: false,
    notifyOptIn: false,
    _updatedAt: Date.now()
  };
}

// ─── Runner ───────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Verrocchio demo users...\n");
  const summary = [];
  for (const p of PERSONAS) {
    console.log(`→ ${p.name}  <${p.email}>`);
    try {
      const auth = await signUpOrIn(p.email, DEMO_PASSWORD);
      console.log(`   auth: ${auth.mode}  uid=${auth.localId}`);
      const seed = buildPersona(p.recipe);
      const dayCount = p.recipe === "brand-new" ? 3 : 14;
      await writeUserDoc(auth.localId, auth.idToken, fullUserDoc(seed, dayCount));
      console.log(`   seeded ${seed.habits.length} habit(s), ${(seed.goals || []).length} goal(s), ${dayCount} day(s) of visits\n`);
      summary.push({ email: p.email, password: DEMO_PASSWORD, status: "ok" });
    } catch (e) {
      console.error(`   FAIL: ${e.message}\n`);
      summary.push({ email: p.email, password: DEMO_PASSWORD, status: "fail: " + e.message });
    }
  }
  console.log("\nSummary:");
  console.log("-".repeat(70));
  for (const s of summary) console.log(`  ${s.email.padEnd(40)}  ${DEMO_PASSWORD.padEnd(22)}  ${s.status}`);
  console.log("\nSign in with any of the emails above + the shared password to explore.");
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});
