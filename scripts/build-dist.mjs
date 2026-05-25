import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = process.cwd();
const DIST = path.join(SRC, 'dist');
const FILES = [
  'index.html',
  'home.html',
  'utils.js',
  // lib/* — all script-tag-loaded extractions. ANY missing entry here
  // causes Firebase Hosting's `** → /index.html` rewrite to serve the
  // 404'd file as text/html, and the browser refuses to execute it as
  // a script — silently breaking the app with a generic
  // "Something went wrong" error. Confirmed prod-break on 2026-05-18
  // when auth.js / merge.js / dialog.js / icalendar.js were missing
  // from this allowlist after the OSS-port extractions landed.
  'lib/hydration.js',
  'lib/auth.js',
  'lib/merge.js',
  'lib/dialog.js',
  'lib/icalendar.js',
  // §13.4a (v75) — per-view domain modules + view modules.
  'lib/domains/brief.js',
  'lib/domains/habits.js',
  'lib/domains/goals.js',
  'lib/domains/todos.js',
  'lib/domains/reflect.js',
  'lib/domains/calendar.js',
  'lib/views/BriefView.js',
  'lib/views/BriefTopBanners.js',
  'lib/views/HabitsView.js',
  'lib/views/HabitsReorderToolbar.js',
  'lib/views/HabitsNewHabitForm.js',
  'lib/views/HabitsFilterPills.js',
  'lib/views/HabitsActionButton.js',
  'lib/views/HabitsHabitCard.js',
  'lib/views/GoalsView.js',
  'lib/views/TodosView.js',
  'lib/views/ReflectView.js',
  'lib/views/CalendarView.js',
  'lib/views/BottomNav.js',
  'lib/views/AppChrome.js',
  'lib/views/Header.js',
  'lib/views/TourOverlay.js',
  // Wave 4.5 — pre-app surfaces.
  'lib/views/Splash.js',
  'lib/views/Onboarding.js',
  'lib/views/AuthSurface.js',
  // Wave 4.4 — profile panels (partial).
  'lib/views/profile/AccountPanel.js',
  'lib/views/profile/InspirationPanel.js',
  'lib/views/profile/HistoryPanel.js',
  'lib/views/profile/ReportsPanel.js',
  'lib/views/profile/AppSettingsPanel.js',
  'lib/views/profile/MyContentPanel.js',
  'lib/views/profile/ScorecardPanel.js',
  'lib/views/profile/ProfileShell.js',
  // Wave 5.1 — sort utility + per-page picker.
  'lib/views/SortMenu.js',
  // Wave 5.2 — device-API services (location, notification).
  'lib/services.js',
  // Wave 5.3 — seeded quote collection (owner-only).
  'lib/preset-quotes.js',
  // Wave 5.9 — confetti burst.
  'lib/effects.js',
  'lib/components/Sparkline14.js',
  'lib/components/A11yDialog.js',
  'lib/components/WeekDots.js',
  'lib/components/StreakChain.js',
  'lib/components/SproutAvatar.js',
  'lib/components/MomentumArrow.js',
  'lib/components/YearHeatmap.js',
  'lib/components/AchievementBadge.js',
  'lib/components/CompletionWave.js',
  'lib/components/VoiceMicButton.js',
  'lib/components/LinkedContent.js',
  'lib/components/RadarChart.js',
  'lib/components/Icons.js',
  'lib/components/ErrorBoundary.js',
  'lib/fmt.js',
  'lib/default-data.js',
  'lib/dp.js',
  'lib/app-config.js',
  'lib/habit-helpers.js',
  'lib/device-profile.js',
  'lib/time-of-day.js',
  'lib/sw-register.js',
  'lib/constants.js',
  'lib/modals/WelcomeModal.js',
  'lib/modals/JournalDisclaimerModal.js',
  'lib/modals/AddCatModal.js',
  'lib/modals/ConfirmWipeModal.js',
  'lib/modals/ConfirmDeleteAcctModal.js',
  'lib/modals/ConfirmExitDemoModal.js',
  'lib/modals/CalendarDetailDateModal.js',
  'lib/modals/AiConsentModal.js',
  'lib/modals/GoalMoreMenuModal.js',
  'lib/modals/GoalJournalModal.js',
  'lib/modals/AchievementsModal.js',
  'lib/modals/CompleteGoalModal.js',
  'lib/modals/TimeEntryCtxModal.js',
  'lib/modals/LinkedMediaPlayerModal.js',
  'lib/modals/CoachContextModal.js',
  'lib/modals/VoiceCaptureModal.js',
  'lib/modals/XpChartModal.js',
  'lib/modals/ReorderCtxModal.js',
  'manifest.json',
  'service-worker.js',
  'apple-touch-icon-1024.png',
  'apple-touch-icon-180.png',
  'apple-touch-icon-167.png',
  'apple-touch-icon-152.png',
  'apple-touch-icon-120.png',
  'apple-touch-icon-87.png',
  'apple-touch-icon-80.png',
  'apple-touch-icon-60.png',
  'apple-touch-icon-58.png',
  'apple-touch-icon-40.png',
  'apple-touch-icon-29.png',
  'apple-touch-icon-192.png',
  'apple-touch-icon-512.png',
  'vitruvian.webp'
];

if (existsSync(DIST)) await rm(DIST, { recursive: true });
await mkdir(DIST, { recursive: true });

for (const f of FILES) {
  const src = path.join(SRC, f);
  if (!existsSync(src)) { console.warn('[build-dist] skip missing:', f); continue; }
  const dest = path.join(DIST, f);
  // Ensure parent dir exists (matters for nested paths like lib/hydration.js).
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
}

// Demo password env substitution (W1-T7)
const demoPw = process.env.DEMO_PASSWORD;
if (!demoPw) {
  console.warn('[build-dist] DEMO_PASSWORD env not set — dist/index.html retains %%DEMO_PASSWORD%% placeholder. Set before publishing.');
} else {
  const idx = path.join(DIST, 'index.html');
  let html = await readFile(idx, 'utf8');
  html = html.replace('%%DEMO_PASSWORD%%', demoPw);
  await writeFile(idx, html);
  console.log('[build-dist] demo password substituted');
}

console.log('[build-dist] dist/ built with', FILES.length, 'allowlisted files');

// DevMoses step 4 — system verifies itself. Scan dist/index.html for
// every <script src="./...">/<script src="lib/..."> tag and confirm
// the referenced file actually exists in dist/. A missing entry in the
// FILES allowlist above would otherwise be invisible at build time and
// only manifest as a production "Something went wrong" page (because
// Firebase Hosting's `** → /index.html` rewrite would serve HTML in
// place of the missing .js, the browser would refuse to execute it as
// a script, and any global the missing file exported would be
// undefined). Fail the build loudly so CI catches it before deploy.
const idxHtml = await readFile(path.join(DIST, 'index.html'), 'utf8');
const localScripts = [...idxHtml.matchAll(/<script[^>]+src=["'](\.?\/?[^"']+\.m?js)["']/g)]
  .map(m => m[1])
  .filter(src => !/^https?:\/\//.test(src)); // skip CDN URLs
const missing = [];
for (const src of localScripts) {
  const rel = src.replace(/^\.?\//, '');
  if (!existsSync(path.join(DIST, rel))) missing.push(src);
}
if (missing.length > 0) {
  console.error('[build-dist] FATAL: index.html references local scripts that are NOT in dist/:');
  for (const m of missing) console.error('  - ' + m);
  console.error('[build-dist] Add the missing files to the FILES allowlist above and re-build.');
  process.exit(1);
}
console.log('[build-dist] verified', localScripts.length, 'local script references in dist/index.html');
