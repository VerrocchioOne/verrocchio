// lib/components/LinkedContent.js
//
// Three related components extracted as one cluster:
//   HabitCardShell           — memoized wrapper around a habit-card renderer.
//   BgAudio                  — <audio controls> + OS Media Session wiring.
//   renderLinkedUserContent  — given a userContent item, returns the right
//                              inline element (link / audio / image /
//                              video / file). Audio path renders BgAudio.
//
// Originally inline at index.html L2116-L2261. They travel together
// because renderLinkedUserContent uses BgAudio for audio items, and
// HabitCardShell sits in the same shared-components prelude.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

/* Memoized shell around a single habit card. The render function
   (App's renderCard) still does the heavy lifting and stays in the
   monolith — extracting the 473-line body with a clean prop interface
   is a larger refactor we didn't want to bundle with a UX change.
   Instead we give each card a memoization boundary: the shell skips
   re-rendering when BOTH the habit object identity and the `sig`
   string are unchanged.

   `sig` is computed by the parent from every piece of App state that
   affects THIS card's rendering (selDate, edit state, swipe-anim,
   expansion, linked goal text). If the sig matches and the habit ref
   matches, nothing this card draws could have changed — skip.

   Handler staleness is handled separately: togHabit now reads from
   latestData.current instead of the outer `data` closure, so a tap
   that fires from a skipped-over render still sees fresh state. Other
   handlers (setSwipeAnim etc.) use functional setState which is
   stale-safe by construction. */
const HabitCardShell = React.memo(function HabitCardShell({ habit, sig, renderImpl, compact }) {
  return renderImpl(habit, { compact: !!compact });
}, (prev, next) => prev.habit === next.habit && prev.sig === next.sig && !!prev.compact === !!next.compact);

/* ── Background-audio wrapper ──
   Renders a normal <audio controls> element AND wires the OS Media
   Session API (lock-screen controls, metadata, play/pause/seek action
   handlers) when the user starts playback. HTMLAudioElement already
   keeps playing when the tab is backgrounded; MediaSession is what
   makes the OS show a "now playing" card with title + artwork on the
   lock screen of an installed PWA. The artwork resolves to the app's
   1024 home-screen icon (same-origin, relative URL — works under both
   http(s) and file://). preload="metadata" so we don't pull the full
   file (audio uploads can be ~15 MB) until the user actually presses
   play. */
function BgAudio({ src, title, artist, style }) {
  const audioRef = React.useRef(null);
  const wireMediaSession = React.useCallback(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      const Meta = window.MediaMetadata;
      if (Meta) {
        navigator.mediaSession.metadata = new Meta({
          title: title || "Audio",
          artist: artist || "Verrocchio",
          artwork: [
            { src: "apple-touch-icon-1024.png", sizes: "1024x1024", type: "image/png" }
          ]
        });
      }
      const ms = navigator.mediaSession;
      ms.setActionHandler("play",  () => { const a = audioRef.current; if (a) a.play().catch(() => {}); });
      ms.setActionHandler("pause", () => { const a = audioRef.current; if (a) a.pause(); });
      ms.setActionHandler("seekto", (d) => {
        const a = audioRef.current; if (!a || !d || !Number.isFinite(d.seekTime)) return;
        a.currentTime = d.seekTime;
      });
      ms.setActionHandler("seekbackward", (d) => {
        const a = audioRef.current; if (!a) return;
        a.currentTime = Math.max(0, a.currentTime - ((d && d.seekOffset) || 10));
      });
      ms.setActionHandler("seekforward", (d) => {
        const a = audioRef.current; if (!a) return;
        const dur = Number.isFinite(a.duration) ? a.duration : Infinity;
        a.currentTime = Math.min(dur, a.currentTime + ((d && d.seekOffset) || 10));
      });
    } catch (_) { /* MediaSession is best-effort; never break playback */ }
  }, [title, artist]);
  // Wire metadata + action handlers ONLY when the user actually starts
  // playback. `navigator.mediaSession` is global to the document, so
  // every mounted BgAudio that calls setMetadata clobbers the previous
  // one — wiring on `onLoadedMetadata` (which fires for every audio
  // since preload="metadata") would mean the lock-screen card reflects
  // whichever audio loaded last, not whichever is playing.
  return React.createElement("audio", {
    ref: audioRef,
    controls: true,
    src,
    preload: "metadata",
    playsInline: true,
    onPlay: wireMediaSession,
    style: Object.assign({ width: "100%" }, style || {})
  });
}

/* ── Linked-content renderer ──
   Given a userContent item (link / audio / image / video / file),
   returns the appropriate inline React element. Used both inside My
   Content (preview panel) and inside habit/todo/goal expand panels
   (so a meditation audio linked to a "Morning meditation" habit
   actually plays from the habit row, not just from the library). */
function renderLinkedUserContent(item, opts) {
  const compact = !!(opts && opts.compact);
  if (!item) return null;
  if (item.kind === "link") {
    return React.createElement("a", {
      key: "ln-" + item.id,
      href: item.url, target: "_blank", rel: "noopener noreferrer",
      style: { display: "inline-block", fontSize: 12, color: "#0891b2", wordBreak: "break-all", textDecoration: "underline" }
    }, item.title || item.url);
  }
  // Prefer the Firebase Storage downloadURL (cross-device) over the
  // legacy in-doc base64 fileData. Items uploaded before Storage sync
  // landed only have fileData; new uploads only have downloadURL; the
  // auto-migration effect promotes the former into the latter.
  const src = item.downloadURL || item.fileData;
  if (!src) {
    return React.createElement("div", {
      key: "missing-" + item.id,
      style: { fontSize: 11, color: "#9ca3af", fontStyle: "italic" }
    }, "(file not yet synced — open this device's My Content to re-upload)");
  }
  const ft = item.fileType || "";
  if (ft.startsWith("audio/")) {
    return React.createElement(BgAudio, {
      key: "au-" + item.id,
      src,
      title: item.title || item.fileName || "Audio",
      artist: "Verrocchio",
      style: compact ? { maxWidth: "100%" } : null
    });
  }
  if (ft.startsWith("image/")) {
    return React.createElement("img", {
      key: "im-" + item.id,
      src, alt: item.title || "",
      style: { maxWidth: "100%", maxHeight: compact ? 120 : 180, borderRadius: 6, display: "block" }
    });
  }
  if (ft.startsWith("video/")) {
    return React.createElement("video", {
      key: "vd-" + item.id,
      controls: true, src, playsInline: true, preload: "metadata",
      style: { width: "100%", maxHeight: compact ? 160 : 240, borderRadius: 6, display: "block" }
    });
  }
  // Generic file (PDF, anything else) — download link. Storage URLs
  // are cross-origin, so the `download` attribute is advisory; the
  // browser may still open inline (PDFs typically do, which is what
  // users want anyway).
  return React.createElement("a", {
    key: "fi-" + item.id,
    href: src,
    download: item.fileName || (item.title || "file"),
    target: "_blank", rel: "noopener noreferrer",
    style: { display: "inline-block", fontSize: 12, color: "#2d5a2d", fontWeight: 600, textDecoration: "underline" }
  }, "⬇ " + (item.fileName || item.title || "Open file") + (item.fileSize ? " (" + Math.round(item.fileSize / 1024) + " KB)" : ""));
}

  window.HabitCardShell = HabitCardShell;
  window.BgAudio = BgAudio;
  window.renderLinkedUserContent = renderLinkedUserContent;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { HabitCardShell, BgAudio, renderLinkedUserContent };
  }
})();
