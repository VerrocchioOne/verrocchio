// lib/modals/LinkedMediaPlayerModal.js
//
// Floating audio/video player for linked content on a habit or goal.
// For habit context, the onEnded handler auto-completes the habit
// (breathwork-mp3-finishes-and-checks-off flow). For goal context the
// player just stays open for replay.
//
// Wave 4.1.16. Originally inline at index.html L20794-L20868 (IIFE).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function LinkedMediaPlayerModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const player = s.player; // { kind, entityId, item }
    if (!player || !player.item) return null;
    const onClose = cb.onClose || (() => {});
    const onMediaEnded = cb.onMediaEnded || (() => {});

    const { kind, item } = player;
    const ft = (item.fileType || "");
    const isAudio = ft.startsWith("audio/");
    const isVideo = ft.startsWith("video/");
    const src = item.downloadURL || item.fileData;

    return React.createElement(Dialog, {
      onHide: onClose,
      dialogProps: { "aria-label": (kind === "habit" ? "Habit linked audio" : "Goal linked audio") },
      overlayStyle: { background: "rgba(0,0,0,.55)", alignItems: "center", zIndex: 9999, padding: 16 },
      cardStyle: { background: "#fff", borderRadius: 16, padding: 18, maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,.35)" }
    },
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }
      },
        React.createElement("div", {
          style: { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }
        }, kind === "habit" ? "Linked to habit" : "Linked to goal"),
        React.createElement("button", {
          "aria-label": "Close",
          "data-a11y-dialog-hide": true,
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#6b7280", fontSize: 16 }
        }, "×")
      ),
      React.createElement("div", {
        style: { fontSize: 16, fontWeight: 700, color: "var(--c-text-strong)", marginBottom: 12, wordBreak: "break-word" }
      }, item.title || item.fileName || "Linked media"),
      isAudio && React.createElement("audio", {
        src, controls: true, autoPlay: true, preload: "metadata", playsInline: true,
        onEnded: onMediaEnded,
        style: { width: "100%" }
      }),
      isVideo && React.createElement("video", {
        src, controls: true, autoPlay: true, playsInline: true, preload: "metadata",
        onEnded: onMediaEnded,
        style: { width: "100%", maxHeight: 320, borderRadius: 8 }
      }),
      kind === "habit" && isAudio && React.createElement("div", {
        style: { fontSize: 11, color: "#6b7280", marginTop: 10, lineHeight: 1.45 }
      }, "Habit auto-completes when this audio finishes.")
    );
  }

  window.LinkedMediaPlayerModal = LinkedMediaPlayerModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { LinkedMediaPlayerModal };
  }
})();
