# index.html changelog

Auto-generated from git history. Most recent first. Each entry links to the commit on the GitHub remote.

Repo: https://github.com/VerrocchioOne/verrocchio

---

## 2026-05-11

- **12:20** [`42ca6f4`](https://github.com/VerrocchioOne/verrocchio/commit/42ca6f4) Tab wrapper: drop inline padding/margin so desktop CSS gutters take effect (was 16px overriding 32px)
- **12:16** [`9d092a5`](https://github.com/VerrocchioOne/verrocchio/commit/9d092a5) Desktop view: THE actual fix (3-pronged, agent-driven)
- **12:09** [`9e06d46`](https://github.com/VerrocchioOne/verrocchio/commit/9e06d46) Header: device-profile chip is now React-reactive + shows the detected profile name
- **11:53** [`e770566`](https://github.com/VerrocchioOne/verrocchio/commit/e770566) Tips: fix false-positive yesterday count + My Coach modal
- **11:27** [`a9c29f0`](https://github.com/VerrocchioOne/verrocchio/commit/a9c29f0) Header: desktop indicator chip on non-phone devices
- **11:22** [`64d6aab`](https://github.com/VerrocchioOne/verrocchio/commit/64d6aab) Desktop Phase 1: smart layout adaptation + device-profile detection
- **09:32** [`7603c16`](https://github.com/VerrocchioOne/verrocchio/commit/7603c16) Desktop layout fixes: drop 3-col, fix dashboard tile overflow
- **08:54** [`0a78582`](https://github.com/VerrocchioOne/verrocchio/commit/0a78582) Desktop: habits + goals 2-3 col grid on hover-pointer devices
- **08:37** [`89c8e81`](https://github.com/VerrocchioOne/verrocchio/commit/89c8e81) Desktop: Home cards flow into 2-3 columns side-by-side
- **08:30** [`ec560ec`](https://github.com/VerrocchioOne/verrocchio/commit/ec560ec) Desktop-responsive: center content with max-width above 900px
- **08:12** [`e2b9802`](https://github.com/VerrocchioOne/verrocchio/commit/e2b9802) Home reorg: tipsCard + dashboardCard split, tile routing, new card order
- **08:04** [`848908c`](https://github.com/VerrocchioOne/verrocchio/commit/848908c) Habit row: dblclick stays put + togHabit defensive log
- **07:57** [`5de4c24`](https://github.com/VerrocchioOne/verrocchio/commit/5de4c24) Yesterday Habits pill: "X/Y Recorded" instead of bare ratio + checkmark
- **07:53** [`5480f84`](https://github.com/VerrocchioOne/verrocchio/commit/5480f84) Multi-slot habits + Mark Reviewed gate counts done OR missed
- **07:38** [`9d8bfa2`](https://github.com/VerrocchioOne/verrocchio/commit/9d8bfa2) Home cards: tighten copy + unified Pending/Confirmed pill
- **07:33** [`9610c1e`](https://github.com/VerrocchioOne/verrocchio/commit/9610c1e) Wake Lock + journal/todos/wrapping fixes + TestFlight walkthrough

## 2026-05-10

- **19:05** [`f3d5756`](https://github.com/VerrocchioOne/verrocchio/commit/f3d5756) v0.2.0: My Account cleanup + Link-to consolidation + readability + roadmap
- **17:46** [`267a0d4`](https://github.com/VerrocchioOne/verrocchio/commit/267a0d4) Linked-files UI + display-name UX + audit-driven correctness pass
- **15:12** [`1499fe6`](https://github.com/VerrocchioOne/verrocchio/commit/1499fe6) My Content library + linked-media play + voice dedupe
- **14:30** [`3672426`](https://github.com/VerrocchioOne/verrocchio/commit/3672426) My Content: bump file-upload cap 10 MB -> 100 MB
- **14:28** [`e67da91`](https://github.com/VerrocchioOne/verrocchio/commit/e67da91) My Content: gate file upload behind owner allowlist
- **13:49** [`a183c68`](https://github.com/VerrocchioOne/verrocchio/commit/a183c68) My Content: cross-device file sync via Firebase Storage
- **13:28** [`d1dadab`](https://github.com/VerrocchioOne/verrocchio/commit/d1dadab) Voice-to-text durability, audit fixes, My Content sort
- **11:12** [`11b437f`](https://github.com/VerrocchioOne/verrocchio/commit/11b437f) Tokenize habit-type, section, and achievement-tier color tables
- **10:55** [`d4dbabd`](https://github.com/VerrocchioOne/verrocchio/commit/d4dbabd) Wire editorial type, Glyph icons, and tint tokens
- **10:16** [`77aad3c`](https://github.com/VerrocchioOne/verrocchio/commit/77aad3c) Polish batch: PWA/perf/a11y + design-system foundations

## 2026-05-09

- **20:13** [`fc6ba11`](https://github.com/VerrocchioOne/verrocchio/commit/fc6ba11) Merge pull request #4 from VerrocchioOne/claude/remove-seeds-fix-sync
- **15:41** [`8736776`](https://github.com/VerrocchioOne/verrocchio/commit/8736776) Brand icon = 10-block pyramid (no V) across SVG mark + PNG home-screen icon
- **15:34** [`9ea675a`](https://github.com/VerrocchioOne/verrocchio/commit/9ea675a) Bottom-nav labels + profile cloud-sync + Verrocchio brand icon
- **15:12** [`f6aa163`](https://github.com/VerrocchioOne/verrocchio/commit/f6aa163) Bottom nav: swap Home and Habits icons — house for Home, pyramid for Habits
- **14:45** [`2a144de`](https://github.com/VerrocchioOne/verrocchio/commit/2a144de) Incomplete-flag emoji + Goals tab arrow icon + manual home location
- **14:40** [`f7012e2`](https://github.com/VerrocchioOne/verrocchio/commit/f7012e2) Reflection: rename entry form heading from 'New Journal Entry' to 'My Journal'
- **14:38** [`38dc498`](https://github.com/VerrocchioOne/verrocchio/commit/38dc498) Reflection: unified catalog — one chronological list under the entry form
- **14:37** [`6b92021`](https://github.com/VerrocchioOne/verrocchio/commit/6b92021) Reflection: one consolidated entry form with kind picker (Daily / Goal / Other)
- **14:34** [`62fa56a`](https://github.com/VerrocchioOne/verrocchio/commit/62fa56a) Journal: voice mic auto-restarts for 5+ min, Save button respects selDate, theme picker
- **14:21** [`23e0265`](https://github.com/VerrocchioOne/verrocchio/commit/23e0265) Goals: default areas sort by least recent progress + Custom reorders areas
- **14:16** [`6d0a274`](https://github.com/VerrocchioOne/verrocchio/commit/6d0a274) Bottom nav: redraw Home tab pyramid icon as 10 blocks (4-3-2-1) to match splash
- **14:12** [`c0e6574`](https://github.com/VerrocchioOne/verrocchio/commit/c0e6574) Habits: tap section total chip → inline breakdown of how it sums
- **14:00** [`8438d07`](https://github.com/VerrocchioOne/verrocchio/commit/8438d07) Avoid description: reframe as 'minimize unit count under a cap', not 'days avoided'
- **13:59** [`544f5b7`](https://github.com/VerrocchioOne/verrocchio/commit/544f5b7) Profile + Home: descriptions on built-in lists + weekly travel-review card
- **13:48** [`e82c5ec`](https://github.com/VerrocchioOne/verrocchio/commit/e82c5ec) Profile + dark-mode + Time-of-Day validation batch
- **13:35** [`2d0663d`](https://github.com/VerrocchioOne/verrocchio/commit/2d0663d) Calendar: rebuilt Week + Month views + Yesterday Journal hooks selDate
- **09:04** [`b692f91`](https://github.com/VerrocchioOne/verrocchio/commit/b692f91) Calendar: 'Open Calendar' from header opens Day view on selDate
- **09:03** [`facd597`](https://github.com/VerrocchioOne/verrocchio/commit/facd597) Calendar icon: restore date-picker / travel-assign behavior + add Open Calendar button
- **08:57** [`0d199f7`](https://github.com/VerrocchioOne/verrocchio/commit/0d199f7) Calendar: fix blank-screen bug — define missing impColor inside the IIFE
- **08:50** [`72f53e4`](https://github.com/VerrocchioOne/verrocchio/commit/72f53e4) Home: add Yesterday Journal card + reorder ritual + harden calendar modal sizing
- **08:22** [`49f6c98`](https://github.com/VerrocchioOne/verrocchio/commit/49f6c98) Edit Habit modal: trim padding + tighten section gaps so it scrolls less
- **08:11** [`35b91e8`](https://github.com/VerrocchioOne/verrocchio/commit/35b91e8) Journal: visible edit/delete buttons + free-form theme on entry edit
- **08:09** [`9c922ca`](https://github.com/VerrocchioOne/verrocchio/commit/9c922ca) Habits: total duration is concurrency-aware (layered cohorts roll up to MAX)
- **08:07** [`53c2445`](https://github.com/VerrocchioOne/verrocchio/commit/53c2445) Urgent To-Dos: mirror the Yesterday Review flow with Mark Reviewed + return banner
- **07:58** [`f04f29d`](https://github.com/VerrocchioOne/verrocchio/commit/f04f29d) Calendar: default view is now month so the user lands on a date picker
- **07:58** [`126f600`](https://github.com/VerrocchioOne/verrocchio/commit/126f600) Calendar: move from Home into a header-icon modal + restore iCal export
- **07:51** [`cef0633`](https://github.com/VerrocchioOne/verrocchio/commit/cef0633) Home: drop iCal export button + collapse Yesterday Review into a bottom pill on review
- **07:39** [`178142f`](https://github.com/VerrocchioOne/verrocchio/commit/178142f) Home: yesterday/today denominators are now frequency-aware
- **07:37** [`348564b`](https://github.com/VerrocchioOne/verrocchio/commit/348564b) Yesterday Review stays interactive after Mark Reviewed + dashboard tile routes back
- **07:33** [`79401d9`](https://github.com/VerrocchioOne/verrocchio/commit/79401d9) Resistance flow: rank consecutive misses, not just yesterday — capped at 5
- **07:22** [`92d585b`](https://github.com/VerrocchioOne/verrocchio/commit/92d585b) Home: yesterday review now sits above the urgent to-dos card
- **07:22** [`4797a62`](https://github.com/VerrocchioOne/verrocchio/commit/4797a62) Home: collapse Yesterday Review to a tap-through + add Return banner on Habits
- **07:14** [`ec3eccf`](https://github.com/VerrocchioOne/verrocchio/commit/ec3eccf) Home: add resistance flow after Yesterday Review + dotted-red flag
- **07:06** [`6bea02f`](https://github.com/VerrocchioOne/verrocchio/commit/6bea02f) Habits: title wraps via per-word flex-items in compact mode

## 2026-05-08

- **21:33** [`ecd1e7d`](https://github.com/VerrocchioOne/verrocchio/commit/ecd1e7d) Add voice-to-text + global voice capture + urgent todos on Home
- **21:16** [`a2a2205`](https://github.com/VerrocchioOne/verrocchio/commit/a2a2205) Habits: switch title parent to CSS Grid for reliable wrap + stack Goal hint
- **21:05** [`f747b2f`](https://github.com/VerrocchioOne/verrocchio/commit/f747b2f) Habits: layered cards stretch to match the tallest sibling
- **21:03** [`599e398`](https://github.com/VerrocchioOne/verrocchio/commit/599e398) Habits: target + increment accept up to 2 decimal places
- **20:59** [`ad76029`](https://github.com/VerrocchioOne/verrocchio/commit/ad76029) Habits: fix mid-word title clip + Goal hint truncation
- **20:28** [`a40d3b9`](https://github.com/VerrocchioOne/verrocchio/commit/a40d3b9) Calendar: merge into Home — remove the standalone Calendar tab
- **19:47** [`1a6f08a`](https://github.com/VerrocchioOne/verrocchio/commit/1a6f08a) Home: add Today's Schedule calendar peek at the bottom
- **19:44** [`61c9ddf`](https://github.com/VerrocchioOne/verrocchio/commit/61c9ddf) Habits: simpler title wrap + Sort label + circular hamburger Organize icon
- **19:43** [`723c785`](https://github.com/VerrocchioOne/verrocchio/commit/723c785) Organize modal: bridge between layered rows + family color coding + button moved to end
- **19:37** [`078ca62`](https://github.com/VerrocchioOne/verrocchio/commit/078ca62) Habits: move Organize entry to top toolbar (next to [+])
- **19:33** [`1f75df0`](https://github.com/VerrocchioOne/verrocchio/commit/1f75df0) Habits: title wraps to 2 lines in default mode + free wrap in compact
- **19:16** [`1f9ca31`](https://github.com/VerrocchioOne/verrocchio/commit/1f9ca31) Organize: selection-based bulk actions + clearer exit
- **19:07** [`ce5dc58`](https://github.com/VerrocchioOne/verrocchio/commit/ce5dc58) Habits: compact card visual polish — shrink donut, wrap names, tighter padding
- **18:52** [`cdaa5d3`](https://github.com/VerrocchioOne/verrocchio/commit/cdaa5d3) Habits: swipe-left is a 2-stage toggle — neutral → missed → reset
- **18:50** [`8712cf5`](https://github.com/VerrocchioOne/verrocchio/commit/8712cf5) Habits: narrow Yes/No + target chips (44/48px, 32px tall, smaller text)
- **18:09** [`534e5c8`](https://github.com/VerrocchioOne/verrocchio/commit/534e5c8) Habits page: side-by-side cards re-flow into a 2-row layout
- **17:48** [`c800eab`](https://github.com/VerrocchioOne/verrocchio/commit/c800eab) Habits: parent donut becomes a progress ring driven by sub-habits
- **17:32** [`41799b4`](https://github.com/VerrocchioOne/verrocchio/commit/41799b4) Habits page: render concurrent habits side-by-side (parents + sub-habits)
- **17:22** [`22dc328`](https://github.com/VerrocchioOne/verrocchio/commit/22dc328) Habits page: strengthen sub-habit indent — colored left bar in parent's area hue
- **17:21** [`6a57cc8`](https://github.com/VerrocchioOne/verrocchio/commit/6a57cc8) Calendar day view: render concurrent habits side-by-side
- **10:41** [`c220126`](https://github.com/VerrocchioOne/verrocchio/commit/c220126) Habits: separate Organize modal from Edit Habit modal
- **10:30** [`809b479`](https://github.com/VerrocchioOne/verrocchio/commit/809b479) Habits: replace bundleKey grouping with parent/child habits
- **10:16** [`ecf9802`](https://github.com/VerrocchioOne/verrocchio/commit/ecf9802) Header date pill: red font + red tint when viewing a non-today date
- **10:08** [`e34c67a`](https://github.com/VerrocchioOne/verrocchio/commit/e34c67a) Edit-habit: surface the relative-order picker (boxed + clearer label) + bump SW v5 to flush stale caches
- **10:00** [`29d2e83`](https://github.com/VerrocchioOne/verrocchio/commit/29d2e83) Seeds: revert Instagram — add it manually via the live app instead
- **09:58** [`5443736`](https://github.com/VerrocchioOne/verrocchio/commit/5443736) Habits + Goals: After-picker, concurrent flag, goal-card reorder, IG seed
- **09:23** [`9557396`](https://github.com/VerrocchioOne/verrocchio/commit/9557396) Habit bundles: optional total-duration override
- **09:20** [`40a547c`](https://github.com/VerrocchioOne/verrocchio/commit/40a547c) Habit bundles: name-tag micro-habits into one calendar block
- **09:07** [`339bb48`](https://github.com/VerrocchioOne/verrocchio/commit/339bb48) Review Yesterday card: ordered list + tap-through to Habits tab

## 2026-05-07

- **18:07** [`3070c90`](https://github.com/VerrocchioOne/verrocchio/commit/3070c90) Calendar: importance pattern lives only on the left stripe now
- **17:40** [`9804c2f`](https://github.com/VerrocchioOne/verrocchio/commit/9804c2f) Calendar: softer stripes for Important importance pattern
- **17:35** [`55fc348`](https://github.com/VerrocchioOne/verrocchio/commit/55fc348) Calendar: importance as fill PATTERN, color by area-of-life only
- **17:33** [`db77c5c`](https://github.com/VerrocchioOne/verrocchio/commit/db77c5c) Importance: traffic-light palette (red/yellow/green) on calendar + XP
- **17:29** [`d1e7b68`](https://github.com/VerrocchioOne/verrocchio/commit/d1e7b68) Calendar: morning header now visible; day is the default view
- **17:25** [`28c909e`](https://github.com/VerrocchioOne/verrocchio/commit/28c909e) Calendar: color habits by area-of-life, remove block emoji, top padding
- **17:20** [`e429b86`](https://github.com/VerrocchioOne/verrocchio/commit/e429b86) Calendar: section break lines on week, day callouts, and month
- **17:17** [`70cf014`](https://github.com/VerrocchioOne/verrocchio/commit/70cf014) Habits page: total-duration pill at the end of the filter row
- **17:14** [`ec7e3d5`](https://github.com/VerrocchioOne/verrocchio/commit/ec7e3d5) Calendar day view: stronger color coding
- **16:20** [`9d09ade`](https://github.com/VerrocchioOne/verrocchio/commit/9d09ade) Calendar day view: timeline + callouts column
- **16:15** [`74ac454`](https://github.com/VerrocchioOne/verrocchio/commit/74ac454) Calendar day block: show name only; hour rail already carries time
- **16:11** [`d034148`](https://github.com/VerrocchioOne/verrocchio/commit/d034148) Calendar day view: Outlook-style timeline w/ proportional blocks
- **16:08** [`95cb507`](https://github.com/VerrocchioOne/verrocchio/commit/95cb507) Calendar: time-stamped daily schedule, exclude all-day & avoid
- **16:04** [`c904abf`](https://github.com/VerrocchioOne/verrocchio/commit/c904abf) Calendar tab + iCalendar PRIORITY/CATEGORIES + edit-habit metadata
- **15:53** [`36c9439`](https://github.com/VerrocchioOne/verrocchio/commit/36c9439) Edit habit modal: move Starts into the header as a compact pill
- **15:48** [`aa97fdf`](https://github.com/VerrocchioOne/verrocchio/commit/aa97fdf) Edit-habit modal: shrink the Linked Goals section
- **15:44** [`cec12fc`](https://github.com/VerrocchioOne/verrocchio/commit/cec12fc) Habit card: double-tap on the action circle stays a double-increment
- **12:31** [`fa45fbf`](https://github.com/VerrocchioOne/verrocchio/commit/fa45fbf) XP chart: tap a bar to see which habits earned that XP
- **12:12** [`a0e2887`](https://github.com/VerrocchioOne/verrocchio/commit/a0e2887) Goal flow Step 4: full habit form; default goal sort = earliest date
- **12:07** [`e2ee9ec`](https://github.com/VerrocchioOne/verrocchio/commit/e2ee9ec) Habit card: hide Yes/target chip when the card is expanded
- **11:56** [`7cbb28b`](https://github.com/VerrocchioOne/verrocchio/commit/7cbb28b) Goal card right column: lock date chip + arrow widths
- **11:48** [`3163c88`](https://github.com/VerrocchioOne/verrocchio/commit/3163c88) Goal date chip: T-### / T+### countdown style
- **11:47** [`04f61c5`](https://github.com/VerrocchioOne/verrocchio/commit/04f61c5) Edit-habit modal: shrink details textarea, move Order to the right
- **11:40** [`19a9695`](https://github.com/VerrocchioOne/verrocchio/commit/19a9695) Avoid Yes/No habit: chip reads "No" when logged
- **11:34** [`64755ab`](https://github.com/VerrocchioOne/verrocchio/commit/64755ab) Habit flavor toggle: Yes/No vs Target & Unit
- **11:23** [`1b14a56`](https://github.com/VerrocchioOne/verrocchio/commit/1b14a56) Plain habit action circle: explicit Y/N toggle
- **11:14** [`e770807`](https://github.com/VerrocchioOne/verrocchio/commit/e770807) Goal donut: one tick per habit, including the single-habit case
- **07:27** [`b0965a4`](https://github.com/VerrocchioOne/verrocchio/commit/b0965a4) Order x/y: card actually moves now (fix stale-closure reorder)
- **07:23** [`2bce8c6`](https://github.com/VerrocchioOne/verrocchio/commit/2bce8c6) Goal donut: explicit tick marks at segment boundaries
- **07:04** [`2997a8b`](https://github.com/VerrocchioOne/verrocchio/commit/2997a8b) Goal subheaders: x/y completion counts + red when incomplete
- **06:58** [`ce54dd9`](https://github.com/VerrocchioOne/verrocchio/commit/ce54dd9) Add Habit: open the full edit modal; cap title display at 30 chars
- **06:53** [`e3e1300`](https://github.com/VerrocchioOne/verrocchio/commit/e3e1300) Habit chip: lock to 64×36, cap unit label at 8 chars
- **06:51** [`3a5da58`](https://github.com/VerrocchioOne/verrocchio/commit/3a5da58) Habits: drop drag-reorder for an Order x/y input; nuke Upcoming Dates card
- **06:45** [`cf72a2d`](https://github.com/VerrocchioOne/verrocchio/commit/cf72a2d) Habits sort: drop Custom row, refresh hint to point at drag-and-drop
- **06:36** [`90d32e8`](https://github.com/VerrocchioOne/verrocchio/commit/90d32e8) Habit clear: refund XP, drop to "none"; goal panel: 3 even subsections
- **06:31** [`c1cf5a8`](https://github.com/VerrocchioOne/verrocchio/commit/c1cf5a8) Goal card: 3-section panel + inline edit on double-tap
- **06:13** [`629d1b9`](https://github.com/VerrocchioOne/verrocchio/commit/629d1b9) Habit action circle: only sub-unit logging, no tap-to-unmark on plain

## 2026-05-06

- **19:27** [`fe6e86d`](https://github.com/VerrocchioOne/verrocchio/commit/fe6e86d) Habit gestures: swipe-right fills target, swipe-left resets, no time modal
- **19:07** [`e688d03`](https://github.com/VerrocchioOne/verrocchio/commit/e688d03) Habit swipe-left: clear today instead of marking missed
- **17:40** [`41e5091`](https://github.com/VerrocchioOne/verrocchio/commit/41e5091) Goal panel: SMART header always renders even with 0 fields filled
- **17:35** [`377fb3e`](https://github.com/VerrocchioOne/verrocchio/commit/377fb3e) Habit card memo: include target/unit/op/today-count in the sig
- **17:25** [`cdcd0c7`](https://github.com/VerrocchioOne/verrocchio/commit/cdcd0c7) Habits: collapsible Filter; goal cards: dbl-click menu, # Days chip
- **17:08** [`965dcb8`](https://github.com/VerrocchioOne/verrocchio/commit/965dcb8) Habit card: chip moved out of the column + target=0 accepted as valid
- **16:58** [`1604872`](https://github.com/VerrocchioOne/verrocchio/commit/1604872) Habit unit logging: support ≤ N targets (incl. ≤ 0 avoid habits)
- **16:40** [`28fdc90`](https://github.com/VerrocchioOne/verrocchio/commit/28fdc90) Avoid habits: drop the special render branch, share the regular card
- **16:30** [`133428d`](https://github.com/VerrocchioOne/verrocchio/commit/133428d) Fix: TDZ on reorderModeId — declare before the useEffect that reads it
- **16:26** [`bfc2c9b`](https://github.com/VerrocchioOne/verrocchio/commit/bfc2c9b) Habit cards: stacked target chip on the right (mirrors goal date pill)
- **16:21** [`84fd1c3`](https://github.com/VerrocchioOne/verrocchio/commit/84fd1c3) Goal date chip compact + avoid card replaces big red X
- **16:19** [`31490ef`](https://github.com/VerrocchioOne/verrocchio/commit/31490ef) Habit cards: hold-to-wiggle drag-reorder, double-tap edit, single-tap expand
- **16:15** [`dd8f8a0`](https://github.com/VerrocchioOne/verrocchio/commit/dd8f8a0) Goals: tap the area header to collapse / expand its list
- **16:13** [`5e347fc`](https://github.com/VerrocchioOne/verrocchio/commit/5e347fc) Goals: target ≥/≤ on cards + merged list when sorting by target date
- **16:10** [`a3232ef`](https://github.com/VerrocchioOne/verrocchio/commit/a3232ef) Habit card: inline target/unit as a gray parenthetical, conform heights
- **15:57** [`eaf2186`](https://github.com/VerrocchioOne/verrocchio/commit/eaf2186) Goal flow: Step 4 inlines the full habit form (no second-pass modal)
- **15:42** [`23ffe7b`](https://github.com/VerrocchioOne/verrocchio/commit/23ffe7b) Splash: drop the "Achieve Anything" tagline under the pyramid
- **15:36** [`49113ad`](https://github.com/VerrocchioOne/verrocchio/commit/49113ad) Header: remove Push/Pull buttons (realtime sync is enough)
- **15:22** [`84849b0`](https://github.com/VerrocchioOne/verrocchio/commit/84849b0) Push: verify on the server + surface real Firestore errors
- **15:17** [`07ccc31`](https://github.com/VerrocchioOne/verrocchio/commit/07ccc31) Pull: force a server fetch instead of returning cached data
- **15:13** [`9f7cb3d`](https://github.com/VerrocchioOne/verrocchio/commit/9f7cb3d) Save: revert to simple version, drop "Offline" UI everywhere
- **14:53** [`ec3459c`](https://github.com/VerrocchioOne/verrocchio/commit/ec3459c) Settings: export habits as an iCalendar (.ics) file
- **14:49** [`4c85555`](https://github.com/VerrocchioOne/verrocchio/commit/4c85555) Push button: dedicated helper, no syncState race
- **14:29** [`ba39111`](https://github.com/VerrocchioOne/verrocchio/commit/ba39111) Header: add Pull from Cloud button + manualSyncOp state
- **14:21** [`3d51e7c`](https://github.com/VerrocchioOne/verrocchio/commit/3d51e7c) Header: ☁ Push button — explicit one-tap force-save to Firestore
- **17:37** [`0e683cc`](https://github.com/VerrocchioOne/verrocchio/commit/0e683cc) Remove seed-habits concept + add manual sync recovery in Settings
- **11:54** [`170ffa8`](https://github.com/VerrocchioOne/verrocchio/commit/170ffa8) Goal flow: First habit on its own Step 4 + ≥/≤ comparison on target
- **11:24** [`1b0a168`](https://github.com/VerrocchioOne/verrocchio/commit/1b0a168) Auth: remove "Try the demo" + seeded persona shortcuts; bump SW cache

## 2026-05-05

- **20:14** [`a92fba0`](https://github.com/VerrocchioOne/verrocchio/commit/a92fba0) Habits: drag-and-drop reorder + double-click to edit, drop ordinal input
- **20:08** [`1a3e15b`](https://github.com/VerrocchioOne/verrocchio/commit/1a3e15b) Habit reorder: section never changes — relative move, global display
- **19:57** [`2ecd0fd`](https://github.com/VerrocchioOne/verrocchio/commit/2ecd0fd) Habits: every section expanded by default, no time-of-day collapse
- **19:54** [`ccb88f1`](https://github.com/VerrocchioOne/verrocchio/commit/ccb88f1) Habit reorder: auto-reassign section to match the new global slot
- **19:51** [`819c9e0`](https://github.com/VerrocchioOne/verrocchio/commit/819c9e0) Habits: global ordinal + commit-on-blur for reorder input
- **19:38** [`173ff5e`](https://github.com/VerrocchioOne/verrocchio/commit/173ff5e) Habit cards: move the order input to the leftmost edge
- **15:18** [`9100668`](https://github.com/VerrocchioOne/verrocchio/commit/9100668) Habits: inline position input on each card — type a number to reorder
- **14:58** [`81347a3`](https://github.com/VerrocchioOne/verrocchio/commit/81347a3) Habits: explicit ⇅ reorder button on each section header
- **14:38** [`022fb15`](https://github.com/VerrocchioOne/verrocchio/commit/022fb15) Habits: extend duration cap from 2 hr to 12 hr
- **14:16** [`de10f11`](https://github.com/VerrocchioOne/verrocchio/commit/de10f11) Habits: link a single habit to multiple goals (goalIds array)
- **11:17** [`6dae683`](https://github.com/VerrocchioOne/verrocchio/commit/6dae683) Save: new multi-device-aware method (writer ID, monotonic stamp, retry)

## 2026-04-30

- **12:56** [`c715fb2`](https://github.com/VerrocchioOne/verrocchio/commit/c715fb2) Habits: add 5th section "Daily Completion" (between Evening and Avoid)
- **12:43** [`0da9c73`](https://github.com/VerrocchioOne/verrocchio/commit/0da9c73) Habits: hide cards not due on the selected date + filter toggle
- **12:17** [`f618363`](https://github.com/VerrocchioOne/verrocchio/commit/f618363) Wipe: build the blank doc explicitly — don't clone DD's seed data
- **12:13** [`02ee394`](https://github.com/VerrocchioOne/verrocchio/commit/02ee394) Apply 6-agent audit findings: backfills, orphaned-link cleanup, timestamps
- **12:03** [`4b45d17`](https://github.com/VerrocchioOne/verrocchio/commit/4b45d17) Sync: three audit fixes for save reliability + concurrent-write race
- **11:58** [`4df7889`](https://github.com/VerrocchioOne/verrocchio/commit/4df7889) Wipe modal: accept any case for the typed confirmation
- **11:52** [`54bfbf7`](https://github.com/VerrocchioOne/verrocchio/commit/54bfbf7) Simplify the data path: remove flush effect + heartbeat
- **11:49** [`7ad84ff`](https://github.com/VerrocchioOne/verrocchio/commit/7ad84ff) Wipe + save: bypass save(), log every step, force-close profile on wipe
- **10:34** [`065b1a9`](https://github.com/VerrocchioOne/verrocchio/commit/065b1a9) Default new sign-ups past onboarding + tour — no intro cards / intent prompt
- **10:25** [`2760414`](https://github.com/VerrocchioOne/verrocchio/commit/2760414) Profile: Delete All Data action + 30s auto-save heartbeat
- **10:21** [`6b8687e`](https://github.com/VerrocchioOne/verrocchio/commit/6b8687e) Save: drop the 800ms debounce — write to Firestore on every save()
- **10:17** [`d242260`](https://github.com/VerrocchioOne/verrocchio/commit/d242260) Home: add Key Upcoming Dates card (goal targets + custom one-offs)
- **10:10** [`e1f7049`](https://github.com/VerrocchioOne/verrocchio/commit/e1f7049) Goal cards: remove the Version History section
- **10:08** [`d24de43`](https://github.com/VerrocchioOne/verrocchio/commit/d24de43) Goal card quick-add: spell out the action — Add Habit / Add To-Do
- **10:05** [`8e179c9`](https://github.com/VerrocchioOne/verrocchio/commit/8e179c9) Goal card quick-add: move autoFocus from to-do to habit input
- **09:58** [`db2de5a`](https://github.com/VerrocchioOne/verrocchio/commit/db2de5a) Goal cards: segmented donut + add-habit quick-add row
- **09:56** [`ee79eb7`](https://github.com/VerrocchioOne/verrocchio/commit/ee79eb7) New goal: require + auto-create at least one driving habit
- **09:47** [`2b2591b`](https://github.com/VerrocchioOne/verrocchio/commit/2b2591b) Sanitize doc on every Firestore write — strip undefined fields
- **09:24** [`04cf9a6`](https://github.com/VerrocchioOne/verrocchio/commit/04cf9a6) Sync: seed latestData.current from localStorage at load + log save errors

## 2026-04-29

- **22:55** [`48c5823`](https://github.com/VerrocchioOne/verrocchio/commit/48c5823) Goal card chip: match # Days font size to the goal name, drop bold
- **22:52** [`1416c63`](https://github.com/VerrocchioOne/verrocchio/commit/1416c63) Splash: slow the block + letter animation by 2x
- **22:44** [`82402b8`](https://github.com/VerrocchioOne/verrocchio/commit/82402b8) Splash wordmark: stagger 10 letters, one per pyramid block
- **22:42** [`689e0ff`](https://github.com/VerrocchioOne/verrocchio/commit/689e0ff) Splash: remove the cream Playfair V overlay from the loading animation
- **22:39** [`b9749f1`](https://github.com/VerrocchioOne/verrocchio/commit/b9749f1) Goal card chip: bump "# Days" font from 10 to 14
- **22:38** [`f23b611`](https://github.com/VerrocchioOne/verrocchio/commit/f23b611) Goal cards: stop pointer events bubbling out of the expanded section
- **22:30** [`8566ff0`](https://github.com/VerrocchioOne/verrocchio/commit/8566ff0) Goal cards: auto-focus the to-do quick-add input on expand
- **22:27** [`25275bd`](https://github.com/VerrocchioOne/verrocchio/commit/25275bd) Goal card date chip: "# Days" + italic "MMM. DD, YYYY" underneath
- **22:25** [`350e794`](https://github.com/VerrocchioOne/verrocchio/commit/350e794) SMART Measurable: collapse to a single free-text box
- **22:13** [`d61cd79`](https://github.com/VerrocchioOne/verrocchio/commit/d61cd79) Goal card donut: reflect today's linked-habit completion, not SMART fields
- **22:11** [`4636e46`](https://github.com/VerrocchioOne/verrocchio/commit/4636e46) Goal cards: inline "X days left / overdue" chip from Time-bound
- **19:10** [`d929257`](https://github.com/VerrocchioOne/verrocchio/commit/d929257) Remove icons on goals/habits + Time-bound becomes date-only
- **17:43** [`0af15c3`](https://github.com/VerrocchioOne/verrocchio/commit/0af15c3) Today double-tap: drive flash from the write's own promise, not syncState
- **17:36** [`8c7b607`](https://github.com/VerrocchioOne/verrocchio/commit/8c7b607) Header Today pill: double-tap shows Saving... / Synced / Offline flash
- **17:32** [`44997b2`](https://github.com/VerrocchioOne/verrocchio/commit/44997b2) Cross-device sync: respect newer local data + flush on backgrounding
- **15:16** [`f990170`](https://github.com/VerrocchioOne/verrocchio/commit/f990170) Edit-habit + Log Now: split +/tap to its own row, 12h time display
- **15:13** [`989cbd0`](https://github.com/VerrocchioOne/verrocchio/commit/989cbd0) Splash pyramid: rebuild as 10 individual blocks (4-3-2-1) + new pop animation
- **15:11** [`5ec1c5c`](https://github.com/VerrocchioOne/verrocchio/commit/5ec1c5c) Edit-habit modal field reorder + delete-doesn't-save fix
- **15:00** [`82e1074`](https://github.com/VerrocchioOne/verrocchio/commit/82e1074) Edit-habit modal: move Target/Unit/+per-tap row above Time of Day
- **14:58** [`24ca732`](https://github.com/VerrocchioOne/verrocchio/commit/24ca732) Edit-habit modal: collapse the icon picker by default
- **14:52** [`d37d99b`](https://github.com/VerrocchioOne/verrocchio/commit/d37d99b) Header date pill: double-click acts as a manual save
- **13:19** [`e73d703`](https://github.com/VerrocchioOne/verrocchio/commit/e73d703) Fix second TDZ: move syncState above the auto-start tour effect
- **13:16** [`7cd4929`](https://github.com/VerrocchioOne/verrocchio/commit/7cd4929) Fix TDZ crash blanking the app on every fresh load
- **13:03** [`1b47641`](https://github.com/VerrocchioOne/verrocchio/commit/1b47641) SW: register with updateViaCache:none so updates aren't HTTP-cached
- **12:44** [`e343efc`](https://github.com/VerrocchioOne/verrocchio/commit/e343efc) Tour: add full-width Exit walkthrough banner above app header
- **12:41** [`8a41489`](https://github.com/VerrocchioOne/verrocchio/commit/8a41489) Tour: bigger exit affordances + persist tourDone on any activity

## 2026-04-23

- **17:17** [`ec2e6f3`](https://github.com/VerrocchioOne/verrocchio/commit/ec2e6f3) Tour: shake-to-exit also dismisses the guided tour
- **15:25** [`d1c176a`](https://github.com/VerrocchioOne/verrocchio/commit/d1c176a) Tour: broaden returning-user guard to cover todos/journal/XP/visits
- **15:10** [`d9e3725`](https://github.com/VerrocchioOne/verrocchio/commit/d9e3725) Routine Compare inline in Profile, Freq filter pill, richer demo seeds
- **12:55** [`14ca2e0`](https://github.com/VerrocchioOne/verrocchio/commit/14ca2e0) Profile restructure + Explorer achievements + splash/tour polish
- **11:59** [`855163f`](https://github.com/VerrocchioOne/verrocchio/commit/855163f) Splash V: fluid-dynamics fill — green liquid, air pumped from top-left
- **09:10** [`deced65`](https://github.com/VerrocchioOne/verrocchio/commit/deced65) Routines: move out of Habits filter row, rework to week-vs-month compare
- **09:07** [`5503b10`](https://github.com/VerrocchioOne/verrocchio/commit/5503b10) Daily briefing: drop the closing quote line
- **09:06** [`d771efa`](https://github.com/VerrocchioOne/verrocchio/commit/d771efa) Daily briefing: tailor to persona's 14-day window, enrich with specifics
- **09:02** [`df87134`](https://github.com/VerrocchioOne/verrocchio/commit/df87134) Goal card: collapse SMART / Linked Habits / Linked To-Dos into title rows
- **08:56** [`bd6a3d0`](https://github.com/VerrocchioOne/verrocchio/commit/bd6a3d0) Todo card: collapse linked-goal chip · login always lands on Home
- **08:53** [`c87a329`](https://github.com/VerrocchioOne/verrocchio/commit/c87a329) Task cards: drop always-on drag grip · XP chart: label every bar
- **08:51** [`88bce9e`](https://github.com/VerrocchioOne/verrocchio/commit/88bce9e) XP chart: labels, comparison stats, axis titles
- **08:48** [`ff8bfae`](https://github.com/VerrocchioOne/verrocchio/commit/ff8bfae) XP bar: tap to open XP history chart (day/week/month columns)
- **08:44** [`d4664d1`](https://github.com/VerrocchioOne/verrocchio/commit/d4664d1) Intention card: gradient + shadow now follow the chosen accent color
- **08:39** [`0e6bb6f`](https://github.com/VerrocchioOne/verrocchio/commit/0e6bb6f) Demo personas: randomized habits/goals/todos + 2-week history + custom accents
- **08:25** [`4e64087`](https://github.com/VerrocchioOne/verrocchio/commit/4e64087) Tour: center the explore hint vertically so it never overlaps the header
- **08:24** [`929dece`](https://github.com/VerrocchioOne/verrocchio/commit/929dece) Tour: compact the card + smart-dock opposite the spotlit target
- **08:21** [`23b1542`](https://github.com/VerrocchioOne/verrocchio/commit/23b1542) Tour: Reflect step - drop the Write a reflection button, pin to bottom
- **08:15** [`82e6a53`](https://github.com/VerrocchioOne/verrocchio/commit/82e6a53) Tour: animate the Resume pill, drop the trailing arrow
- **08:13** [`c7a865d`](https://github.com/VerrocchioOne/verrocchio/commit/c7a865d) Tour: replace in-card explore button with dim-click + floating hint
- **08:07** [`243d98c`](https://github.com/VerrocchioOne/verrocchio/commit/243d98c) Tour: minimize-to-corner explore mode on every step
- **08:03** [`7bfbfa1`](https://github.com/VerrocchioOne/verrocchio/commit/7bfbfa1) Tour: dock showcase steps at bottom so content stays readable
- **07:58** [`d0a5c0c`](https://github.com/VerrocchioOne/verrocchio/commit/d0a5c0c) Tour: stop re-firing on returning users whose tour-done hasn't synced
- **07:50** [`85ed144`](https://github.com/VerrocchioOne/verrocchio/commit/85ed144) Sort menu: direction toggles per row (A→Z/Z→A, Oldest/Newest, etc.)
- **07:36** [`11ea06e`](https://github.com/VerrocchioOne/verrocchio/commit/11ea06e) Demo: pre-seed marathon goal + 4 supporting habits; add showcase tour steps
- **07:23** [`f8cf1a6`](https://github.com/VerrocchioOne/verrocchio/commit/f8cf1a6) Tour: skip goal/habit walkthroughs when data already exists
- **07:16** [`c1abb5e`](https://github.com/VerrocchioOne/verrocchio/commit/c1abb5e) Enforce demo/auth mutual exclusion so Profile can't get stuck in demo
- **07:07** [`2ba7adf`](https://github.com/VerrocchioOne/verrocchio/commit/2ba7adf) Fix post-merge blank screen + demo-persona sign-in
- **09:12** [`54bd3bc`](https://github.com/VerrocchioOne/verrocchio/commit/54bd3bc) Heatmap: Week / Month / Year range filter in Habit Reports
- **09:10** [`2cc799e`](https://github.com/VerrocchioOne/verrocchio/commit/2cc799e) Post-merge debug: memoize hot paths, wire YearHeatmap, harden edge cases
- **08:51** [`45d2e03`](https://github.com/VerrocchioOne/verrocchio/commit/45d2e03) Shake to exit demo + remove tour tooltip's Hold-to-Exit pill
- **08:48** [`f32ee50`](https://github.com/VerrocchioOne/verrocchio/commit/f32ee50) Demo persona buttons: auto-create accounts + seed on first tap
- **08:44** [`85fb04e`](https://github.com/VerrocchioOne/verrocchio/commit/85fb04e) Sign-in: one-tap demo-persona buttons beneath "Try the demo"
- **08:38** [`f9a08e3`](https://github.com/VerrocchioOne/verrocchio/commit/f9a08e3) YearHeatmap: denser cells + per-habit color (HabitKit-style chips)
- **08:37** [`2048b81`](https://github.com/VerrocchioOne/verrocchio/commit/2048b81) Routine viewer: browse habits by day / week / month
- **08:35** [`e30b692`](https://github.com/VerrocchioOne/verrocchio/commit/e30b692) Calendar: month-level stats below the date grid
- **08:33** [`89fd093`](https://github.com/VerrocchioOne/verrocchio/commit/89fd093) Fix iOS home-screen icon: use raster PNG, not inline SVG
- **08:32** [`b1939c0`](https://github.com/VerrocchioOne/verrocchio/commit/b1939c0) Feature-access scorecard + unused-feature tips
- **08:27** [`c83bfec`](https://github.com/VerrocchioOne/verrocchio/commit/c83bfec) Review prompts: Home banner at 1w/2w/1mo + always-on Settings button
- **08:21** [`6fb11d6`](https://github.com/VerrocchioOne/verrocchio/commit/6fb11d6) Habit sub-units: target + unit + tap-to-increment (4/8 cups pattern)
- **08:15** [`d6ff480`](https://github.com/VerrocchioOne/verrocchio/commit/d6ff480) Memoize habit cards via a shell + stale-safe togHabit
- **08:06** [`abec540`](https://github.com/VerrocchioOne/verrocchio/commit/abec540) Profile expansion: lifetime stats, account mgmt, summary export, version
- **08:01** [`602b778`](https://github.com/VerrocchioOne/verrocchio/commit/602b778) Location + notifications scaffolding (Capacitor-ready)
- **07:59** [`90eacfe`](https://github.com/VerrocchioOne/verrocchio/commit/90eacfe) Move tone selector to App Settings, default to Neutral
- **07:57** [`25d48f6`](https://github.com/VerrocchioOne/verrocchio/commit/25d48f6) AI tone selector + data-driven Tips (off-schedule + correlations)
- **07:46** [`56b2778`](https://github.com/VerrocchioOne/verrocchio/commit/56b2778) Habit form: goal-link becomes step 2, placeholder mirrors goal form
- **07:42** [`87be404`](https://github.com/VerrocchioOne/verrocchio/commit/87be404) Capture habit completion times + time-entry modal on slow swipe
- **07:37** [`a5e021d`](https://github.com/VerrocchioOne/verrocchio/commit/a5e021d) Sort button + custom-order modal on Habits / Goals / Todos pages
- **07:23** [`4ec6409`](https://github.com/VerrocchioOne/verrocchio/commit/4ec6409) Add long-press reorder for Habits-page section headers
- **07:11** [`034547b`](https://github.com/VerrocchioOne/verrocchio/commit/034547b) AI proxy Worker, Firestore realtime sync, PWA offline support
- **06:55** [`16f87a4`](https://github.com/VerrocchioOne/verrocchio/commit/16f87a4) Tokenize neutral palette, memoize visual components, tour a11y, add util tests
- **06:40** [`7c845cd`](https://github.com/VerrocchioOne/verrocchio/commit/7c845cd) Fix date-key timezone bug, gate failing LLM fetches, harden cloud hydration

## 2026-04-22

- **21:05** [`f97e428`](https://github.com/VerrocchioOne/verrocchio/commit/f97e428) Tour/onboarding: swap swipes for explicit Back/Next buttons
- **20:35** [`a49d09a`](https://github.com/VerrocchioOne/verrocchio/commit/a49d09a) Tour: switch to class-based spotlight (Path A)
- **19:35** [`9d0bdf2`](https://github.com/VerrocchioOne/verrocchio/commit/9d0bdf2) Tour: fix double-swipe, spotlight-on-mount, auto-scroll target, dual spotlight
- **19:20** [`3e781e6`](https://github.com/VerrocchioOne/verrocchio/commit/3e781e6) Tour swipe polish + four goal-related achievements
- **18:36** [`9d60404`](https://github.com/VerrocchioOne/verrocchio/commit/9d60404) Onboarding polish: SVG illustrations, SMART inputs, area-of-life constraints
- **01:13** [`5927055`](https://github.com/VerrocchioOne/verrocchio/commit/5927055) Tour: step-by-step goal + habit walkthrough; splash tagline match

## 2026-04-21

- **23:38** [`69b8075`](https://github.com/VerrocchioOne/verrocchio/commit/69b8075) Onboarding + tour: swipe-driven, no skip, intent banner
- **21:59** [`f7b3151`](https://github.com/VerrocchioOne/verrocchio/commit/f7b3151) Splash: keep only the Ink V animation; fix tour scroll drift
- **20:45** [`c968ec0`](https://github.com/VerrocchioOne/verrocchio/commit/c968ec0) Guided tour + version history + circle/nav/dark-mode polish
- **17:56** [`02acf6b`](https://github.com/VerrocchioOne/verrocchio/commit/02acf6b) Habit card density + nav icons + weekly review + collapsible sections

## 2026-04-20

- **20:53** [`ceb99fa`](https://github.com/VerrocchioOne/verrocchio/commit/ceb99fa) Collapsible header on scroll + continuous-trip track shape
- **19:41** [`cdbc251`](https://github.com/VerrocchioOne/verrocchio/commit/cdbc251) Wire Verrocchio splash animation into welcome screen
- **18:46** [`b9ad859`](https://github.com/VerrocchioOne/verrocchio/commit/b9ad859) Sharpen onboarding, welcome briefing, splash animation
- **17:57** [`5e9e6d8`](https://github.com/VerrocchioOne/verrocchio/commit/5e9e6d8) Pill ergonomics, home location onboarding, travel-day locations
- **17:42** [`ec80a9f`](https://github.com/VerrocchioOne/verrocchio/commit/ec80a9f) Turn Home tab into a daily morning ritual
- **16:46** [`cc0d206`](https://github.com/VerrocchioOne/verrocchio/commit/cc0d206) Add new-user onboarding flow + organize ideas backlog
- **15:27** [`c6a42c5`](https://github.com/VerrocchioOne/verrocchio/commit/c6a42c5) Add demo mode; clean up Goals/Habits/Reflect tabs
- **15:05** [`b15542f`](https://github.com/VerrocchioOne/verrocchio/commit/b15542f) Show selected date in header pill (falls back to "Today")
- **15:02** [`8aca523`](https://github.com/VerrocchioOne/verrocchio/commit/8aca523) Move Home/Travel assignment into the calendar, drop home-tab toggle
- **14:56** [`ac76451`](https://github.com/VerrocchioOne/verrocchio/commit/ac76451) Replace header date strip with XP bar; profile modal hamburger menu
- **14:39** [`15d99dc`](https://github.com/VerrocchioOne/verrocchio/commit/15d99dc) Rework home page, profile modal, header streak, and XP logic
- **13:49** [`fc40281`](https://github.com/VerrocchioOne/verrocchio/commit/fc40281) Add customer onboarding: login, welcome screen, sign out

## 2026-04-19

- **13:57** [`5f80225`](https://github.com/VerrocchioOne/verrocchio/commit/5f80225) Make goals-tab action buttons equal-width
- **13:55** [`f87fbad`](https://github.com/VerrocchioOne/verrocchio/commit/f87fbad) Rename Journal button to + Add Entry
- **13:54** [`c8b1173`](https://github.com/VerrocchioOne/verrocchio/commit/c8b1173) Move Journal button inline with Add Goal / Goal Archive
- **05:13** [`2fd7810`](https://github.com/VerrocchioOne/verrocchio/commit/2fd7810) Add swipe gesture support to avoid habit cards
- **02:53** [`14b57eb`](https://github.com/VerrocchioOne/verrocchio/commit/14b57eb) Fix syntax error: extra paren after Journal button
- **02:06** [`683530e`](https://github.com/VerrocchioOne/verrocchio/commit/683530e) Fix extra paren on line 7931 causing syntax error

