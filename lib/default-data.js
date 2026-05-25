// lib/default-data.js
//
// DD — per-user state-shape default. Used to:
//   1. Initialize a brand-new account before any Firestore sync.
//   2. Backfill missing fields on legacy cloud docs via
//      hydrateCloudDoc (lib/hydration.js) and the SK localStorage
//      restore path in loadData.
//
// loadData — read the localStorage fallback (key: SK = "verrocchio-v1")
// + run hydrateCloudDoc on it. Returns a deep-cloned DD when localStorage
// is empty / unreadable so callers get a writable fresh shape.
//
// Originally inline at index.html L1769-L1805 (DD) + L1810-L1818
// (loadData). Declared at top-level classic-script scope so the inline
// body App() references them by bare name. SEED_GOALS / SEED_HABITS
// were inlined as empty arrays — both vestigial (see the comment at
// L1595 in index.html: "removed per product decision; empty arrays kept
// so any straggler reference still resolves cleanly").

const DD = {
  goals: [],
  todos: [],
  habits: [],
  journal: [],
  quotes: [],
  archive: [],
  dailyRitual: {},
  // User-added one-off important dates surfaced in the home-page
  // Key Upcoming Dates section alongside goal target deadlines.
  // Each entry: { id, text, date: "YYYY-MM-DD" }.
  upcomingDates: [],
  // New sign-ups skip the 3-screen onboarding carousel (and the
  // intent-capture prompt that lived inside it) and the guided
  // tour. The user explicitly opted out of those for both first-
  // time and returning sessions, so the defaults flip from undefined
  // (which `inPreApp` and the auto-start-tour effect read as "show")
  // to true. Existing cloud docs retain their own flags via
  // hydrateCloudDoc so users mid-onboarding from before this change
  // still see what their doc says.
  onboardingComplete: true,
  tourDone: true,
  // W3-T9: one-time welcome modal on first signed-in render for brand
  // new accounts. Separate from `tourDone` so flipping this default
  // doesn't disturb the existing onboarding-carousel skip semantics.
  // hydrateCloudDoc sets this true for any returning doc that already
  // has habits or completed the tour, so only true first-timers see it.
  welcomeModalSeen: false,
  // W3-T11: one-time health / privacy disclaimer shown after the user
  // creates their first journal entry. Persisted so the modal never
  // re-appears once acknowledged.
  journalDisclaimerAcked: false,
  // W3-T12: AI features consent timestamp (epoch ms). 0 means the user
  // has never consented. AI call sites must gate on this when AI_ENABLED
  // is true. Wired now so v1.1's AI_ENABLED flip is one constant change.
  aiConsentAt: 0
};

function loadData() {
  try {
    const r = localStorage.getItem(SK);
    if (r) {
      return hydrateCloudDoc(JSON.parse(r));
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DD));
}
