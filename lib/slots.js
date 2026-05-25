// lib/slots.js
//
// Multi-slot habit helpers (§5.8b). A habit can declare
// `slotSections: ["morning", "morning", "afternoon"]` meaning it has
// 3 chunks per day: two in the morning, one in the afternoon. Each
// chunk has a stable slot ID of the form "<section>:<localIdx>" where
// localIdx counts occurrences of that section within slotSections.
//
// All helpers are pure; the App-scope inline copies (previously at
// index.html ~L8294-8347) were factored out so they can be unit
// tested via tests/slots.test.mjs.
//
// Loaded as a classic browser script (top-level consts become script-
// scope globals) AND requireable in Node via the dual-load guard at
// the bottom of the file.

// MAX_SLOTS caps the per-habit total chunks per day. The stepper UI
// in the add-habit form enforces this and the migration is tolerant
// of any cap change later.
const MAX_SLOTS = 12;

// slotIdForIndex(slotSections, arrayIdx) -> "section:localIdx" or null.
// Walks slotSections up to arrayIdx counting prior occurrences of the
// same section, so duplicate-section entries get distinct IDs.
const slotIdForIndex = (slotSections, arrayIdx) => {
  if (!Array.isArray(slotSections)) return null;
  const section = slotSections[arrayIdx];
  if (section == null) return null;
  let localIdx = 0;
  for (let i = 0; i < arrayIdx; i++) if (slotSections[i] === section) localIdx++;
  return section + ":" + localIdx;
};

// parseSlotId(id) -> { section, localIdx } or null.
// Bare-section ids (no colon) parse as localIdx 0.
const parseSlotId = id => {
  if (!id || typeof id !== "string") return null;
  const i = id.indexOf(":");
  if (i === -1) return { section: id, localIdx: 0 };
  const idx = parseInt(id.slice(i + 1), 10);
  return { section: id.slice(0, i), localIdx: isFinite(idx) ? idx : 0 };
};

// slotSectionCounts(slotSections) -> { section: count, ... }.
// Used by the stepper UI ("morning x 2") and by the renderer to decide
// whether a slot row needs the "#N" suffix.
const slotSectionCounts = slotSections => {
  const counts = {};
  for (const s of (slotSections || [])) counts[s] = (counts[s] || 0) + 1;
  return counts;
};

// slotRowsFor(slotSections) -> [{ section, arrayIdx, localIdx, countInSection, slotId }].
// Materializes slotSections into per-row metadata objects the renderer
// iterates. Stable order: matches slotSections order; localIdx counts
// duplicates within a section so rows render distinct "#1 / #2" labels.
const slotRowsFor = slotSections => {
  if (!Array.isArray(slotSections)) return [];
  const counts = slotSectionCounts(slotSections);
  const seen = {};
  return slotSections.map((section, arrayIdx) => {
    const localIdx = seen[section] || 0;
    seen[section] = localIdx + 1;
    return {
      section,
      arrayIdx,
      localIdx,
      countInSection: counts[section] || 1,
      slotId: section + ":" + localIdx
    };
  });
};

// Dual-load: Node test runner requires this file; browser loads it as
// a classic script. The Node side gets a CommonJS export; the browser
// side already has the consts as script-scope globals.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MAX_SLOTS,
    slotIdForIndex,
    parseSlotId,
    slotSectionCounts,
    slotRowsFor
  };
}
