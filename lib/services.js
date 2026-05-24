// lib/services.js
//
// Device-API service wrappers. Replaces two inline useMemo() factories
// in App() (index.html L9246 + L9278). Each service is a plain object
// frozen at module load — no React hooks, no closure over App state.
//
// Exposes:
//   window.VerrocchioServices = {
//     location: { supported, getCurrent, haversineMeters },
//     notification: { supported, permission, requestPermission, notify }
//   };
//
// Why a single combined file: both services are < 30 LOC each and
// belong to the same "device API wrapper" concern. Splitting further
// would create two tiny files with no callers in common.

(function () {
  "use strict";
  if (typeof window === "undefined") return;

  // ── Location ───────────────────────────────────────────────────────
  // Thin wrapper over navigator.geolocation so callers don't touch the
  // browser API directly. When the app is wrapped by Capacitor for
  // native deploy, swap the implementation here (e.g. import Geolocation
  // from '@capacitor/geolocation') without touching any callers.
  // Haversine distance is approximate (spherical earth) but fine for
  // "am I within N meters of home?" checks.
  const haversineMeters = (a, b) => {
    if (!a || !b) return Infinity;
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const location = {
    supported: typeof navigator !== "undefined" && "geolocation" in navigator,
    getCurrent: () => new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        return reject(new Error("geolocation_unsupported"));
      }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, capturedAt: Date.now() }),
        err => reject(err),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    }),
    haversineMeters
  };

  // ── Notification ───────────────────────────────────────────────────
  // Wrapper over the Web Notification API. Local notifications (while
  // the page is open) work everywhere the API is supported. Push when
  // the app is closed requires @capacitor/push-notifications on native
  // — the service here is shaped so we can route to Capacitor's Local/
  // Push plugins later by swapping the `notify` implementation.
  const notification = {
    supported: typeof window !== "undefined" && "Notification" in window,
    permission: () => (typeof Notification !== "undefined" ? Notification.permission : "denied"),
    requestPermission: async () => {
      if (typeof window === "undefined" || !("Notification" in window)) return "denied";
      try { return await Notification.requestPermission(); }
      catch (_) { return "denied"; }
    },
    notify: (title, body, opts) => {
      if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return false;
      try {
        new Notification(title, { body, icon: "apple-touch-icon-1024.png", ...(opts || {}) });
        return true;
      } catch (_) { return false; }
    }
  };

  window.VerrocchioServices = { location, notification };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = window.VerrocchioServices;
  }
})();
