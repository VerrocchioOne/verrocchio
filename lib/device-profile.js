// lib/device-profile.js
//
// Device-profile detection (Phase 1 of "hardware check first"). Runs
// at script load + on viewport / hover-capability changes. Writes the
// active profile to body.dataset.device (CSS targets via
// body[data-device="..."]) and exposes window.__deviceProfile (React
// effects / render branches read it without reaching into the DOM).
//
// Four canonical profiles:
//   phone           — narrow viewport, touch-only.
//   tablet          — wide viewport, touch-only (iPad landscape).
//   desktop         — wide viewport with hover-capable pointer.
//   desktop-wide    — really wide (>= 1300px) with hover.
//
// Originally inline at index.html L1208-L1259. document.body access is
// gated on DOMContentLoaded so this can safely load in <head> before
// the body parse completes.

(function () {
  "use strict";
  if (typeof window === "undefined") return;

// ── Device-profile detection (Phase 1 of "hardware check first") ──
// Runs ONCE at boot and on viewport / hover-capability changes. Writes
// the active profile to body.dataset.device so CSS can target it via
// body[data-device="..."] selectors, AND exposes a window-level
// getter so React effects / render branches can read it without
// reaching into the DOM. Four canonical profiles:
//
//   phone           — narrow viewport, touch-only (default phone UX)
//   tablet          — wide viewport, touch-only (iPad landscape)
//   desktop         — wide viewport with hover-capable pointer
//                     (1100-1299px, single-window laptop layout)
//   desktop-wide    — really wide hover-pointer (>= 1300px, allows
//                     more aggressive multi-column / sidebar layouts)
//
// Future passes can switch big tree decisions (sidebar vs bottom nav,
// detail-panel-as-sidebar in My Content, etc.) by reading
// `window.__deviceProfile` or matching the body data attribute.
function classifyDevice() {
  const w = (typeof window !== "undefined" && window.innerWidth) || 0;
  // (hover: hover) is FALSE on any device whose primary input is touch
  // — including Windows touchscreen laptops (Surface, ThinkPad Yoga,
  // etc.) even when a mouse is connected. Loosen the test to also
  // accept (any-hover: hover) and (pointer: fine) so the desktop
  // profile fires whenever ANY connected pointer is precise. This
  // catches: real desktops, plain laptops, touch-laptops with mouse,
  // and desktops with a touch monitor. iPads in portrait still
  // classify as "tablet" (no hover-capable pointer ever).
  const mm = (q) => typeof window !== "undefined"
    && window.matchMedia
    && window.matchMedia(q).matches;
  const hoverCapable = mm("(hover: hover)")
    || mm("(any-hover: hover)")
    || mm("(pointer: fine)")
    || mm("(any-pointer: fine)");
  if (w >= 1300 && hoverCapable) return "desktop-wide";
  if (w >= 900  && hoverCapable) return "desktop";
  if (w >= 900) return "tablet";
  return "phone";
}
function applyDeviceProfile() {
  const profile = classifyDevice();
  try { document.body.dataset.device = profile; } catch (e) {}
  try { window.__deviceProfile = profile; } catch (e) {}
}
window.addEventListener("resize", applyDeviceProfile);
try {
  const hoverMql = window.matchMedia("(hover: hover)");
  // Older Safari uses .addListener; modern browsers use addEventListener.
  if (hoverMql.addEventListener) hoverMql.addEventListener("change", applyDeviceProfile);
  else if (hoverMql.addListener) hoverMql.addListener(applyDeviceProfile);
} catch (e) {}

  // Defer the first applyDeviceProfile() to DOMContentLoaded so
  // document.body exists when we write body.dataset.device. The resize
  // listener above can register immediately regardless.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyDeviceProfile);
  } else {
    applyDeviceProfile();
  }
})();
