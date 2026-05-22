// Defensive today-merge for the sign-in load path — Phase 2 OSS-port Port #12.
// Extracted from index.html where it lived as a Script-scope function.
//
// Used when sign-in adopts the cloud doc (cloud is newer-or-equal by _updatedAt).
// Re-overlays local's "today" volatile fields so a local edit that hasn't synced
// yet isn't silently dropped.
//
// Pure function — does not mutate inputs. Returns a new object.
//
// Contract: mergeRemoteWithLocalToday(remote, local, todayK) -> object
//   remote   — the cloud Firestore doc (plain object, already hydrated)
//   local    — the localStorage snapshot for this uid
//   todayK   — "YYYY-MM-DD" date key for today

function mergeRemoteWithLocalToday(remote, local, todayK) {
  if (!remote || typeof remote !== "object") return remote;
  if (!local || typeof local !== "object" || !todayK) return remote;
  // dayVisits — append-set union.
  const cloudVisits = Array.isArray(remote.dayVisits) ? remote.dayVisits : [];
  const localVisits = Array.isArray(local.dayVisits) ? local.dayVisits : [];
  const visitSet = new Set([...cloudVisits, ...localVisits]);
  const mergedVisits = Array.from(visitSet).sort();
  // dailyRitual[today] — overlay local on top of cloud.
  const cloudRitual = (remote.dailyRitual && typeof remote.dailyRitual === "object") ? remote.dailyRitual : {};
  const localRitual = (local.dailyRitual && typeof local.dailyRitual === "object") ? local.dailyRitual : {};
  const cloudToday = (cloudRitual[todayK] && typeof cloudRitual[todayK] === "object") ? cloudRitual[todayK] : {};
  const localToday = (localRitual[todayK] && typeof localRitual[todayK] === "object") ? localRitual[todayK] : {};
  const mergedToday = { ...cloudToday, ...localToday };
  const mergedRitual = { ...cloudRitual };
  if (Object.keys(mergedToday).length > 0) mergedRitual[todayK] = mergedToday;
  // habits — overlay today's completion cells from local.
  const cloudHabits = Array.isArray(remote.habits) ? remote.habits : [];
  const localHabits = Array.isArray(local.habits) ? local.habits : [];
  const localByIdMap = {};
  for (const h of localHabits) {
    if (h && (h.id || h.id === 0)) localByIdMap[String(h.id)] = h;
  }
  const mergedHabits = cloudHabits.map(h => {
    if (!h) return h;
    const lh = localByIdMap[String(h.id)];
    if (!lh) return h;
    // Pull today's cells from local if local has them.
    let next = h;
    // §audit-P1 — `completions`, `completionTimes`, `completionUnits`
    // are keyed by date with PRIMITIVE values ("done", "HH:MM", number).
    // Whole-value replace at [todayK] is correct: local's snapshot wins.
    const primitiveCellFields = ["completions", "completionTimes", "completionUnits"];
    for (const f of primitiveCellFields) {
      const localField = lh[f];
      if (!localField || typeof localField !== "object") continue;
      if (!(todayK in localField)) continue;
      const cloudField = (next[f] && typeof next[f] === "object") ? next[f] : {};
      next = { ...next, [f]: { ...cloudField, [todayK]: localField[todayK] } };
    }
    // §audit-P1 — `slotCompletions[todayK]` and `slotCompletionTimes[todayK]`
    // are OBJECTS keyed by slot ID. Whole-map replace LOSES non-overlapping
    // cross-device slot updates (e.g., local marked morning:0 done on this
    // device, cloud has evening:0 done from another device — whole-map
    // replace would drop evening:0). Per-key merge inside [todayK] preserves
    // both: cloud's keys are kept; local's keys win on overlap.
    const objectCellFields = ["slotCompletions", "slotCompletionTimes"];
    for (const f of objectCellFields) {
      const localField = lh[f];
      if (!localField || typeof localField !== "object") continue;
      if (!(todayK in localField)) continue;
      const cloudField = (next[f] && typeof next[f] === "object") ? next[f] : {};
      const cloudInner = (cloudField[todayK] && typeof cloudField[todayK] === "object") ? cloudField[todayK] : {};
      const localInner = (localField[todayK] && typeof localField[todayK] === "object") ? localField[todayK] : {};
      const mergedInner = { ...cloudInner, ...localInner };
      next = { ...next, [f]: { ...cloudField, [todayK]: mergedInner } };
    }
    return next;
  });
  return { ...remote, dayVisits: mergedVisits, dailyRitual: mergedRitual, habits: mergedHabits };
}

// CommonJS export for Node-side tests. The `typeof module` guard means the
// browser path (classic <script> tag) is untouched — mergeRemoteWithLocalToday
// stays available as a Script-scope global to the inline app code in index.html.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { mergeRemoteWithLocalToday };
}
