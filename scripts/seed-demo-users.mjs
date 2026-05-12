// Seed the single demo Verrocchio account with a rich, lived-in
// month of habit data. The persona is shaped to surface strong
// morning-routine correlations, multiple goal types, journal entries,
// streaks, and achievements so the account is App-Store-screenshot-
// worthy on every tab.
//
// (Earlier versions of this script seeded four personas; the pool was
// trimmed to one — alex.morning — during v1.0 prep.)
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
//   user's Firestore doc with a fresh 30-day seed. So re-running is
//   safe and idempotent.
//
// Output:
//   A list of { email, password } pairs on success — paste those into
//   the app's sign-in screen to explore each persona.

const FIREBASE_API_KEY    = "AIzaSyDqweiDzza1Jkk-Amppy9ZfMvhc8AHHC_k";
const FIREBASE_PROJECT_ID = "verrocchio-1b116";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
if (!DEMO_PASSWORD) throw new Error("DEMO_PASSWORD env var required to seed demo users");

const PERSONAS = [
  { email: "alex.morning@demo.verrocchio.app", name: "Alex (Morning Runner)",   recipe: "morning-consistent" }
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

// Pick a deterministic time-of-day in a range based on day index so the
// completions look natural and varied without using Math.random().
function timeInRange(i, startHour, startMin, endHour, endMin) {
  const startTotal = startHour * 60 + startMin;
  const endTotal   = endHour   * 60 + endMin;
  const span = endTotal - startTotal;
  const offset = ((i * 7) + 3) % (span + 1);
  const total = startTotal + offset;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function buildPersona(recipe) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - i); return dkFor(d);
  });

  if (recipe === "morning-consistent") {
    // Alex Thomas — 32, software engineer, marathoner-in-training,
    // journaler, recovering phone-addict. Lives in Austin, TX. Six
    // weeks into intentional habit tracking.
    const h = [
      makeHabit(101, "Morning Run",         "morning",  "Physical",     "Non-Negotiable", { target: 30, unitLabel: "min",  increment: 10, _order: 0 }),
      makeHabit(102, "Meditate",            "morning",  "Mental",       "Important",      { _order: 1 }),
      makeHabit(103, "Write Morning Pages", "morning",  "Creative",     "Important",      { _order: 2 }),
      makeHabit(104, "Drink Water",         "afternoon","Physical",     "Additive",       { target: 8,  unitLabel: "cups", increment: 1, _order: 0 }),
      makeHabit(105, "Read 20 min",         "evening",  "Mental",       "Important",      { _order: 0 }),
      makeHabit(106, "Call mom",            "evening",  "Relationship", "Important",      {
        _order: 1,
        frequency: { type: "weekly-day", days: [], day: 0, monthDay: 1, month: 0 }
      }),
      makeHabit(107, "No phone after 9pm",  "avoid",    "Mental",       "Important",      { _order: 0 })
    ];

    const skipRun     = new Set([5, 11, 18, 24]);
    const skipMed     = new Set([7, 22]);
    const skipPages   = new Set([3, 9, 14, 21, 27]);
    const skipReadExtra = new Set([8, 16]);
    const slipPhone   = new Set([2, 13, 17, 23, 26, 29]);

    for (let i = 0; i < 30; i++) {
      const k = days[i];

      // 101 Morning Run — 26/30, 25-35 min, 06:15-06:45
      if (!skipRun.has(i)) {
        h[0].completions[k]     = "done";
        h[0].completionTimes[k] = timeInRange(i, 6, 15, 6, 45);
        h[0].completionUnits[k] = 25 + (i % 11);
      }

      // 102 Meditate — 28/30, 07:00-07:20
      if (!skipMed.has(i)) {
        h[1].completions[k]     = "done";
        h[1].completionTimes[k] = timeInRange(i, 7, 0, 7, 20);
      }

      // 103 Morning Pages — 25/30, 07:30-08:00
      if (!skipPages.has(i)) {
        h[2].completions[k]     = "done";
        h[2].completionTimes[k] = timeInRange(i, 7, 30, 8, 0);
      }

      // 104 Drink Water — cups 5-8, target 8 on weekends OR mid-week push
      const isWeekendBucket = (i % 7) < 2;
      const isMidWeekPush   = (i % 5) === 0;
      const cups = (isWeekendBucket || isMidWeekPush) ? 8 : 5 + (i % 3);
      h[3].completionUnits[k]  = cups;
      h[3].completionTimes[k]  = "21:00";
      if (cups >= 8) h[3].completions[k] = "done";

      // 105 Read — 24/30, mostly on run days, 21:30-22:30
      const skipRead = skipRun.has(i) || skipReadExtra.has(i);
      if (!skipRead) {
        h[4].completions[k]     = "done";
        h[4].completionTimes[k] = timeInRange(i, 21, 30, 22, 30);
      }

      // 107 No phone after 9pm — 22/30 kept
      if (!slipPhone.has(i)) {
        h[6].completions[k]     = "done";
        h[6].completionTimes[k] = "21:00";
      }
    }

    // 106 Call mom — every Sunday inside the 30-day window
    for (let i = 0; i < 30; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      if (d.getDay() === 0) {
        h[5].completions[days[i]]     = "done";
        h[5].completionTimes[days[i]] = "18:30";
      }
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    const goals = [
      {
        id: 201, text: "Complete a half-marathon",
        type: "Physical",
        smart: {
          specific:    "Finish an official half-marathon race",
          measurable:  "21",
          measurableUnit: "km",
          achievable:  "Currently running 30km/week",
          relevant:    "Long-term cardio fitness + a tangible milestone",
          timebound:   "2026-08-15"
        },
        completed: false, _order: 0
      },
      {
        id: 202, text: "Publish 12 essays this year",
        type: "Creative",
        smart: {
          specific:    "12 publishable-quality essays on craft, focus, and creative process",
          measurable:  "12",
          measurableUnit: "essays",
          achievable:  "Morning pages habit is generating ~1 essay-worth of material weekly",
          relevant:    "Building a body of written work; long-term creative practice",
          timebound:   "2026-12-31"
        },
        completed: false, _order: 1
      },
      {
        id: 203, text: "Read 24 books this year",
        type: "Mental",
        smart: {
          specific:    "Finish 24 books across fiction, non-fiction, and poetry",
          measurable:  "24",
          measurableUnit: "books",
          achievable:  "Evening read habit puts me on pace for ~25/year",
          relevant:    "Sustained attention practice; pleasure",
          timebound:   "2026-12-31"
        },
        completed: false, _order: 2
      }
    ];

    const journalSeed = [
      { tag: "gratitude",   offset: 1,  text: "Ran past the dawn fog this morning. The whole city felt asleep except me. These are the runs that make the cold ones worth it." },
      { tag: "wins",        offset: 2,  text: "Hit 30 min on the run + 8 cups of water + read 20 pages before 10pm. First clean sweep in two weeks." },
      { tag: "reflection",  offset: 3,  text: "The morning pages started as an experiment and they have become the most generative part of my day. I keep noticing things I would have lost otherwise." },
      { tag: "challenges",  offset: 5,  text: "Skipped the run today. Body just said no. Trying to read it as data rather than as failure — I'm three weeks deep in a build that's been heavier than I expected." },
      { tag: "ideas",       offset: 6,  text: "Idea for an essay: the difference between practice and performance. Habit tracking is practice but my brain keeps trying to make it performance. The metric becomes the point." },
      { tag: "learning",    offset: 8,  text: "Realized today that I read better when I run earlier. The lift between an early run and an evening read shows up clearly in the stats now. The body sets the tempo for the mind." },
      { tag: "feelings",    offset: 10, text: "Anxious about the half-marathon registration. Signed up anyway. The anxiety doesn't go away by waiting — it goes away by committing." },
      { tag: "goals",       offset: 11, text: "Halfway to the half-marathon timeline. 12 weeks out. The math says I'm on pace. The body is the variable." },
      { tag: "wins",        offset: 12, text: "Mom said she could tell I sounded different on the phone today. More settled. Habit work shows up in places I wasn't measuring." },
      { tag: "daily-recap", offset: 14, text: "Run, water, read, no phone. Four for four. Today was uncomplicated. Stack a few more of these." }
    ];
    const journal = journalSeed.map((e, idx) => ({
      id: 9000 + idx,
      text: e.text,
      tag: e.tag,
      timestamp: nowMs - e.offset * dayMs
    }));

    const bestStreaks = { 101: 12, 102: 13, 103: 11, 105: 10, 107: 8 };

    const achievementsUnlocked = {
      "habit-1":  nowMs - 21 * dayMs,
      "habit-10": nowMs - 14 * dayMs,
      "goal-1":   nowMs - 18 * dayMs,
      "streak-7": nowMs -  7 * dayMs,
      "day-7":    nowMs - 12 * dayMs
    };

    const todayKey = days[0];
    const dailyRitual = {
      [todayKey]: {
        yesterdayJournal: "Felt steady. Three workouts, no big wins, no big losses. Stack quiet days.",
        intention:        "Run early. Write the essay outline before 9. Be present at the team meeting.",
        review:           "Inbox to zero, three big tasks queued: ship onboarding fix, review the launch deck, walk to the new coffee place."
      }
    };

    const plusDate = (n) => {
      const d = new Date(today); d.setDate(today.getDate() + n); return dkFor(d);
    };
    const upcomingDates = [
      { id: "ud-1", text: "Half-marathon registration deadline", date: "2026-06-01" },
      { id: "ud-2", text: "Essay #6 due",                        date: plusDate(14) },
      { id: "ud-3", text: "Mom's birthday",                      date: plusDate(28) }
    ];

    const customGoalTypes = [{ name: "Creative", color: "#7c3aed" }];

    const quotes = [
      { id: "q-1", text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", attribution: "Aristotle",   addedAt: nowMs - 25 * dayMs },
      { id: "q-2", text: "The body knows things the mind hasn't caught up with.",                       attribution: null,          addedAt: nowMs - 10 * dayMs },
      { id: "q-3", text: "You don't rise to the level of your goals. You fall to the level of your systems.", attribution: "James Clear", addedAt: nowMs -  3 * dayMs }
    ];

    return {
      habits: h,
      goals,
      journal,
      quotes,
      upcomingDates,
      customGoalTypes,
      bestStreaks,
      achievementsUnlocked,
      dailyRitual,
      homeLocation: "Austin, TX",
      xp: 1480,
      aiTone: "encouraging"
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
    journal: seed.journal || [],
    quotes: seed.quotes || [],
    archive: [],
    goalArchive: [],
    customGoalTypes: seed.customGoalTypes || [],
    customImportance: [],
    customSections: [],
    upcomingDates: seed.upcomingDates || [],
    dayVisits: visits,
    bestStreaks: seed.bestStreaks || {},
    achievementsUnlocked: seed.achievementsUnlocked || {},
    xp: seed.xp || 0,
    dailyRitual: seed.dailyRitual || {},
    homeLocation: seed.homeLocation || "",
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
      const dayCount = p.recipe === "brand-new" ? 3 : 30;
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
