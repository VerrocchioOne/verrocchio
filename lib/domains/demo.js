// lib/domains/demo.js — Wave 8.2 extraction.
//
// Demo persona content pools, RNG helpers, and the buildRandomDemoDoc
// generator. Originally inline at index.html L554-964 (~410 LOC inside
// App()). Pulled out so the same App() body is ~410 LOC closer to the
// 1000-LOC cap. Pure code with no closures over App state — the
// extraction is verbatim apart from a `dk` dual-load shim (Node
// require / browser globalThis) so the module can run in unit tests
// without booting React.
//
// DEMO_PASSWORD STAYS inline in index.html. It's the only piece of the
// demo block that scripts/build-dist.mjs substitutes at build time
// (the `%%DEMO_PASSWORD%%` placeholder), and moving it would mean
// updating the build script to also patch this module. Keeping it
// inline preserves the existing substitution invariant.

(function () {
  "use strict";

  // dk dual-load: Node tests `require("../../utils.js").dk`; the
  // browser exposes `dk` as a window global via the classic-script
  // utils.js. Resolve once at module load.
  let _dk = null;
  if (typeof require !== "undefined") {
    try { _dk = require("../../utils.js").dk; } catch (_) {}
  }
  if (!_dk && typeof globalThis !== "undefined") _dk = globalThis.dk;
  const dk = _dk || ((d) => {
    // Defensive last-resort: should never fire in practice (browser
    // utils.js is precached before index.html runs App).
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  // ─── Persona email → recipe mapping ────────────────────────────────
  const DEMO_PERSONAS = {
    "alex.morning@demo.verrocchio.app":   { recipe: "morning-consistent" }
  };

  // ─── Content pools the randomizer picks from. Grouped by section ───
  const DEMO_HABIT_POOL = {
    morning: [
      { text: "Morning run",       type: "Physical", importance: "Non-Negotiable", target: 30, unitLabel: "min",  increment: 10 },
      { text: "Meditate",          type: "Mental",   importance: "Important" },
      { text: "Yoga flow",         type: "Physical", importance: "Important",      target: 20, unitLabel: "min",  increment: 5  },
      { text: "Morning journal",   type: "Mental",   importance: "Additive" },
      { text: "Take vitamins",     type: "Physical", importance: "Important" },
      { text: "Sunlight exposure", type: "Physical", importance: "Additive" },
      { text: "Cold shower",       type: "Physical", importance: "Additive" },
      { text: "Morning stretch",   type: "Physical", importance: "Additive",       target: 10, unitLabel: "min",  increment: 5  }
    ],
    afternoon: [
      { text: "Gym workout",       type: "Physical", importance: "Non-Negotiable", target: 45, unitLabel: "min",  increment: 15 },
      { text: "Drink water",       type: "Physical", importance: "Important",      target: 8,  unitLabel: "cups", increment: 1  },
      { text: "Spanish practice",  type: "Mental",   importance: "Additive",       target: 15, unitLabel: "min",  increment: 5  },
      { text: "Walk outside",      type: "Physical", importance: "Important" },
      { text: "Deep work block",   type: "Career",   importance: "Non-Negotiable", target: 90, unitLabel: "min",  increment: 30 },
      { text: "Review day's tasks",type: "Career",   importance: "Important" }
    ],
    evening: [
      { text: "Read before bed",   type: "Mental",   importance: "Important",      target: 20, unitLabel: "min",  increment: 5  },
      { text: "Evening walk",      type: "Physical", importance: "Additive" },
      { text: "Stretch routine",   type: "Physical", importance: "Additive",       target: 10, unitLabel: "min",  increment: 5  },
      { text: "Call a friend",     type: "Social",   importance: "Additive" },
      { text: "Plan tomorrow",     type: "Career",   importance: "Important" },
      { text: "Piano practice",    type: "Creative", importance: "Additive",       target: 20, unitLabel: "min",  increment: 5  },
      { text: "Gratitude journal", type: "Spiritual",importance: "Important" }
    ],
    avoid: [
      { text: "No phone before bed",    type: "Mental",   importance: "Important" },
      { text: "No added sugar",         type: "Physical", importance: "Important" },
      { text: "No social media scroll", type: "Mental",   importance: "Additive"  },
      { text: "No alcohol weeknights",  type: "Physical", importance: "Important" },
      { text: "No late-night snacks",   type: "Physical", importance: "Important" },
      { text: "No caffeine after 2pm",  type: "Physical", importance: "Important" }
    ]
  };
  const DEMO_GOAL_POOL = [
    { text: "Run a half-marathon this year",    type: "Physical",  smart: { specific: "Finish 21km in one continuous effort", measurable: "21", measurableUnit: "km",    achievable: "Building from 5k; +10%/wk",        relevant: "Cardio + mental resilience",    timebound: "2026-10-15" } },
    { text: "Read 24 books in 12 months",       type: "Mental",    smart: { specific: "Finish 24 books across fiction + non-fic", measurable: "24", measurableUnit: "books", achievable: "~2/month, 20 min/day",           relevant: "Keep learning + thinking sharp", timebound: "2026-12-31" } },
    { text: "Save $10,000 emergency fund",      type: "Career",    smart: { specific: "3-month fully funded emergency buffer", measurable: "10000", measurableUnit: "USD",  achievable: "~$850/mo auto-transfer",           relevant: "Financial stability",           timebound: "2026-12-31" } },
    { text: "Learn conversational Spanish",     type: "Mental",    smart: { specific: "Hold a 10-min conversation on everyday topics", measurable: "B1", measurableUnit: "level", achievable: "15 min/day + 1 tutor/wk", relevant: "Travel + culture",              timebound: "2027-03-01" } },
    { text: "Meditate 90 consecutive days",     type: "Spiritual", smart: { specific: "Daily 10-min sit, no gaps",              measurable: "90",  measurableUnit: "days",  achievable: "Stack to morning coffee",          relevant: "Stress + focus",                timebound: "2026-09-30" } },
    { text: "Launch side project v1",           type: "Career",    smart: { specific: "Ship v1 to public",                      measurable: "1",   measurableUnit: "launch",achievable: "2 hrs/weeknight + weekends",       relevant: "Revenue + portfolio",           timebound: "2026-11-01" } },
    { text: "Gain 10 lbs of muscle",            type: "Physical",  smart: { specific: "Add lean mass while holding body fat",   measurable: "10",  measurableUnit: "lbs",   achievable: "4x/wk gym + calorie surplus",      relevant: "Strength + metabolic health",   timebound: "2026-12-31" } },
    { text: "Travel to 3 new countries",        type: "Social",    smart: { specific: "Visit 3 countries I've never been to",   measurable: "3",   measurableUnit: "countries", achievable: "PTO + off-peak flights",      relevant: "Perspective + stories",         timebound: "2026-12-31" } }
  ];
  const DEMO_TODO_POOL = [
    { text: "Book dentist appointment",     dueIn: 7  },
    { text: "Renew passport",               dueIn: 30 },
    { text: "Call mom" },
    { text: "Buy birthday gift",            dueIn: 3  },
    { text: "Schedule annual checkup",      dueIn: 14 },
    { text: "Research running shoes" },
    { text: "Plan weekend trip",            dueIn: 14 },
    { text: "Update resume" },
    { text: "Review subscription services", dueIn: 10 },
    { text: "Meal prep Sunday",             dueIn: 5  },
    { text: "Pick up dry cleaning",         dueIn: 2  },
    { text: "Write thank-you note" },
    { text: "Set up auto-payments" },
    { text: "Donate old clothes" },
    { text: "Register for local race",      dueIn: 21 },
    { text: "Organize photo library" }
  ];
  const DEMO_CUSTOM_GOAL_TYPES = [
    { value: "Adventure", color: "#06b6d4", bg: "#ecfeff", border: "#a5f3fc" },
    { value: "Family",    color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
    { value: "Learning",  color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
    { value: "Home",      color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" }
  ];
  const DEMO_CUSTOM_IMPORTANCE = [
    { value: "Daily Must", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
    { value: "Flexible",   color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" }
  ];
  const DEMO_JOURNAL_POOL = [
    { text: "Hit my morning run even with cold rain. Momentum > mood.", mood: "Energized", tag: "wins" },
    { text: "Grateful for the quiet hour before the house wakes up.",   mood: "Grateful",  tag: "gratitude" },
    { text: "Caught myself scrolling instead of reading. Phone goes in the drawer tomorrow.", mood: "Focused",  tag: "reflection" },
    { text: "Idea: stack Spanish flashcards onto the post-lunch walk.", mood: "Curious",   tag: "ideas" },
    { text: "Tough gym session — legs were jelly but showed up anyway.", mood: "Proud",     tag: "wins" },
    { text: "Skipped meditation 3 days running. Re-committing tomorrow morning.", mood: "Frustrated", tag: "challenges" },
    { text: "Noticed I read better when coffee comes AFTER the first 20 min, not before.", mood: "Focused", tag: "learning" },
    { text: "Feeling stretched thin. Need to cut something — maybe evening email.", mood: "Tired", tag: "feelings" },
    { text: "Great dinner with mom. Keep doing this monthly, not just when I remember.", mood: "Warm", tag: "gratitude" },
    { text: "Realized my best deep-work is 9–11am. Blocking it on the calendar.", mood: "Clear", tag: "learning" },
    { text: "Payday week — funneled savings transfer before the spending brain woke up.", mood: "Proud", tag: "wins" },
    { text: "Sitting with the disappointment of missing the weekly long run.", mood: "Reflective", tag: "feelings" }
  ];
  const DEMO_QUOTES_POOL = [
    { text: "Discipline is choosing between what you want now and what you want most.",           author: "Abraham Lincoln" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",        author: "Will Durant"     },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear"     },
    { text: "The secret of your future is hidden in your daily routine.",                         author: "Mike Murdock"    },
    { text: "Small daily improvements are the key to staggering long-term results.",              author: "Robin Sharma"    },
    { text: "Motion beats meditation when meditation becomes procrastination.",                   author: ""                }
  ];
  const DEMO_PROFILES = {
    "morning-consistent": {
      accentColor: "#ea580c",
      aiTone: "encouraging",
      habitCounts: { morning: 6, afternoon: 5, evening: 5, avoid: 4 },
      goalCount: 5, todoCount: 10, dayCount: 42,
      archivedGoals: 3, archivedTodos: 6, journalEntries: 10, customQuotes: 4,
      rate: () => 0.88,
      morningHour: () => 6, xpBase: 1400, xpSpread: 400
    },
    "falling-off": {
      accentColor: "#d97706",
      aiTone: "tough-love",
      habitCounts: { morning: 4, afternoon: 4, evening: 4, avoid: 3 },
      goalCount: 4, todoCount: 9, dayCount: 35,
      archivedGoals: 2, archivedTodos: 5, journalEntries: 7, customQuotes: 3,
      rate: (d) => d <= 6 ? 0.28 : 0.88,
      morningHour: () => 7, xpBase: 620, xpSpread: 200
    },
    "steady-average": {
      accentColor: "#0ea5e9",
      aiTone: "neutral",
      habitCounts: { morning: 5, afternoon: 4, evening: 4, avoid: 3 },
      goalCount: 4, todoCount: 8, dayCount: 28,
      archivedGoals: 2, archivedTodos: 4, journalEntries: 6, customQuotes: 3,
      rate: () => 0.68,
      morningHour: () => 7, xpBase: 540, xpSpread: 180
    },
    "brand-new": {
      accentColor: "#9333ea",
      aiTone: "encouraging",
      habitCounts: { morning: 3, afternoon: 3, evening: 3, avoid: 2 },
      goalCount: 2, todoCount: 5, dayCount: 21,
      archivedGoals: 1, archivedTodos: 2, journalEntries: 4, customQuotes: 2,
      rate: (d) => d <= 10 ? 0.55 : 0,
      morningHour: () => 8, xpBase: 160, xpSpread: 80
    }
  };

  // ─── RNG helpers (scoped to the demo code) ─────────────────────────
  const demoRandInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const demoPad = (n) => String(n).padStart(2, "0");
  const demoPickN = (arr, n) => {
    const s = arr.slice();
    for (let i = s.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s.slice(0, Math.min(n, s.length));
  };
  const demoPickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ─── buildRandomDemoDoc — main generator ───────────────────────────
  const buildRandomDemoDoc = (recipe) => {
    const profile = DEMO_PROFILES[recipe];
    if (!profile) return null;
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const days = Array.from({ length: profile.dayCount }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - i); return dk(d);
    });
    let habitId = Date.now();
    let order = 0;
    const habits = [];
    for (const section of ["morning", "afternoon", "evening", "avoid"]) {
      const n = profile.habitCounts[section] || 0;
      for (const p of demoPickN(DEMO_HABIT_POOL[section], n)) {
        let frequency = { type: "daily", days: [], day: null, monthDay: 1, month: 0 };
        if (section !== "avoid") {
          const roll = Math.random();
          if (roll < 0.18) {
            const subset = demoPickN([1, 2, 3, 4, 5], 2 + demoRandInt(0, 2));
            frequency = { type: "weekdays", days: subset.sort((a, b) => a - b), day: null, monthDay: 1, month: 0 };
          } else if (roll < 0.28) {
            frequency = { type: "weekly", days: [], day: demoRandInt(0, 6), monthDay: 1, month: 0 };
          }
        }
        habits.push({
          id: habitId++,
          text: p.text, section, type: p.type, importance: p.importance,
          frequency,
          completions: {}, completionTimes: {}, completionUnits: {},
          notes: null, duration: null, goalId: null, location: "both",
          icon: null, startDate: null,
          target: p.target || null, unitLabel: p.unitLabel || null, increment: p.increment || null,
          _order: order++
        });
      }
    }
    const archivedGoalCount = profile.archivedGoals || 0;
    const goalShuffle = demoPickN(DEMO_GOAL_POOL, profile.goalCount + archivedGoalCount);
    const goals = goalShuffle.slice(0, profile.goalCount).map((g, i) => ({
      id: habitId + 100 + i,
      text: g.text, type: g.type, smart: g.smart,
      completed: false, _order: i
    }));
    if (goals.length > 0) {
      for (const h of habits) {
        if (Math.random() < 0.6) h.goalId = demoPickOne(goals).id;
      }
      const hasHabit = new Set(habits.filter(h => h.goalId != null).map(h => h.goalId));
      for (const g of goals) {
        if (hasHabit.has(g.id)) continue;
        const candidate = habits[demoRandInt(0, habits.length - 1)];
        if (candidate) candidate.goalId = g.id;
      }
    }
    const dayOfWeek = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).getDay(); };
    const mH = profile.morningHour();
    for (const h of habits) {
      for (let d = 0; d < days.length; d++) {
        const k = days[d];
        const dow = dayOfWeek(k);
        const fq = h.frequency || {};
        const eligible =
          fq.type === "weekdays" ? (fq.days || []).includes(dow) :
          fq.type === "weekly"   ? (fq.day == null ? 1 : fq.day) === dow :
          true;
        if (!eligible) continue;
        if (Math.random() >= profile.rate(d)) continue;
        let hr;
        if (h.section === "morning") hr = mH + demoRandInt(0, 2);
        else if (h.section === "afternoon") hr = 12 + demoRandInt(0, 5);
        else if (h.section === "evening") hr = 18 + demoRandInt(0, 4);
        else hr = 20 + demoRandInt(0, 3);
        h.completions[k] = "done";
        h.completionTimes[k] = demoPad(hr) + ":" + demoPad(demoRandInt(0, 55));
        if (h.target) {
          const jitter = (h.increment || 1);
          const miss = Math.random() < 0.25;
          const v = miss ? Math.max(jitter, h.target - jitter * demoRandInt(1, 2))
                         : h.target + (Math.random() < 0.3 ? jitter : 0);
          h.completionUnits[k] = Math.max(jitter, Math.round(v));
        }
      }
    }
    const archivedTodoCount = profile.archivedTodos || 0;
    const todoShuffle = demoPickN(DEMO_TODO_POOL, profile.todoCount + archivedTodoCount);
    const todos = todoShuffle.slice(0, profile.todoCount).map((t, i) => ({
      id: habitId + 200 + i,
      text: t.text,
      done: Math.random() < 0.2,
      dueDate: t.dueIn ? dk(new Date(today.getTime() + t.dueIn * 86400000)) : "",
      goalId: goals.length > 0 && Math.random() < 0.35 ? demoPickOne(goals).id : null,
      notes: "",
      _order: i
    }));
    const goalArchive = goalShuffle.slice(profile.goalCount).map((g, i) => {
      const ageDays = demoRandInt(2, Math.max(3, profile.dayCount - 1));
      const completedAt = new Date(today.getTime() - ageDays * 86400000);
      return {
        id: habitId + 300 + i,
        text: g.text, type: g.type, smart: g.smart,
        completed: true,
        archivedAt: completedAt.getTime(),
        completedDate: dk(completedAt),
        _order: i
      };
    });
    const archive = todoShuffle.slice(profile.todoCount).map((t, i) => {
      const ageDays = demoRandInt(1, Math.max(2, Math.floor(profile.dayCount / 2)));
      const archivedAt = new Date(today.getTime() - ageDays * 86400000);
      return {
        id: habitId + 400 + i,
        text: t.text,
        done: true,
        dueDate: "",
        goalId: null,
        notes: "",
        archivedAt: archivedAt.getTime(),
        _order: i
      };
    });
    const journalSeeds = demoPickN(DEMO_JOURNAL_POOL, profile.journalEntries || 0);
    const journal = journalSeeds.map((j, i) => {
      const ageDays = demoRandInt(0, Math.max(1, profile.dayCount - 1));
      const at = new Date(today.getTime() - ageDays * 86400000);
      return {
        id: habitId + 500 + i,
        text: j.text,
        mood: j.mood,
        tag: j.tag,
        timestamp: at.toISOString(),
        dateKey: dk(at)
      };
    });
    const quoteSeeds = demoPickN(DEMO_QUOTES_POOL, profile.customQuotes || 0);
    const quotes = quoteSeeds.map((q, i) => ({
      id: habitId + 600 + i,
      text: q.text,
      author: q.author,
      dateKey: dk(new Date(today.getTime() - demoRandInt(0, profile.dayCount) * 86400000)),
      custom: true
    }));
    const visits = days.slice().reverse();
    return {
      habits,
      goals,
      todos,
      journal, quotes, archive, goalArchive,
      customGoalTypes: demoPickN(DEMO_CUSTOM_GOAL_TYPES, 2),
      customImportance: DEMO_CUSTOM_IMPORTANCE.slice(),
      customSections: [],
      dayVisits: visits,
      bestStreaks: {},
      achievementsUnlocked: {},
      xp: profile.xpBase + demoRandInt(0, profile.xpSpread),
      dailyRitual: {},
      homeLocation: "", travelDays: [],
      celebratedFirstGoal: goals.length > 0,
      celebratedFirstHabit: habits.length > 0,
      onboardingComplete: true,
      sortPrefs: { habits: "default", goals: "default", todos: "default" },
      aiTone: profile.aiTone,
      homeCoords: null, locationOptIn: false, notifyOptIn: false,
      signupAt: Date.now(),
      reviewPrompt: { dismissedDays: [] },
      featureAccess: {},
      _seedAccent: profile.accentColor,
      _updatedAt: Date.now()
    };
  };

  const api = {
    DEMO_PERSONAS,
    DEMO_HABIT_POOL,
    DEMO_GOAL_POOL,
    DEMO_TODO_POOL,
    DEMO_CUSTOM_GOAL_TYPES,
    DEMO_CUSTOM_IMPORTANCE,
    DEMO_JOURNAL_POOL,
    DEMO_QUOTES_POOL,
    DEMO_PROFILES,
    demoRandInt,
    demoPad,
    demoPickN,
    demoPickOne,
    buildRandomDemoDoc
  };

  if (typeof window !== "undefined") {
    window.demoDomain = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { demoDomain: api };
  }
})();
