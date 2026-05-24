// lib/modals/VoiceCaptureModal.js
//
// Voice capture sheet. Opened from the header mic. Listens via the
// Web Speech API, shows the live transcript building, and routes the
// captured text into a goal / habit / to-do / journal entry based on
// the user's pick.
//
// Wave 4.1.17. Originally inline at index.html L20716-L21004 (IIFE,
// 289 LOC).
//
// Session management (startSpeechSession, dedupeAppender, wake-lock,
// 30-min cap, auto-relaunch on no-speech/aborted) stays in App() —
// the closures over voiceActiveRef/voiceSessionRef/voiceWakeLockRef
// would be expensive to thread through here. The modal exposes
// callbacks (onMicToggle, onSaveAsX, onClear) and renders state
// passed in (voiceListening, voiceTranscript, voiceInterim).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function VoiceCaptureModal({ data, dispatch, deviceProfile, state, callbacks }) {
    const Dialog = window.VerrocchioReactDialog;
    const s = state || {};
    const cb = callbacks || {};
    const voiceListening = !!s.voiceListening;
    const voiceTranscript = s.voiceTranscript || "";
    const voiceInterim = s.voiceInterim || "";
    const onClose = cb.onClose || (() => {});
    const onMicToggle = cb.onMicToggle || (() => {});
    const onSaveAsGoal = cb.onSaveAsGoal || (() => {});
    const onSaveAsHabit = cb.onSaveAsHabit || (() => {});
    const onSaveAsTodo = cb.onSaveAsTodo || (() => {});
    const onSaveAsJournal = cb.onSaveAsJournal || (() => {});
    const onClear = cb.onClear || (() => {});

    const finalText = voiceTranscript.trim();
    const hasText = finalText.length > 0;
    const previewText = (finalText + (voiceInterim ? " " + voiceInterim : "")).trim();

    return React.createElement(Dialog, {
      onHide: onClose,
      ariaLabelledby: "voice-capture-title",
      overlayStyle: { zIndex: 320 },
      cardStyle: { padding: "20px 18px 22px", maxWidth: 520 }
    },
      React.createElement("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }
      },
        React.createElement("div", {
          id: "voice-capture-title",
          style: { fontSize: 15, fontWeight: 700, color: "var(--c-text-strong)", letterSpacing: 0.3, textTransform: "uppercase" }
        }, "Voice Capture"),
        React.createElement("button", {
          type: "button", "data-a11y-dialog-hide": true, "aria-label": "Close",
          style: { background: "var(--c-surface-muted)", border: "none", borderRadius: "50%", width: 28, height: 28, fontSize: 14, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
        }, "×")
      ),
      React.createElement("div", {
        style: { fontSize: 12, color: "#6b7280", marginBottom: 12, lineHeight: 1.45 }
      }, "Tap the mic, dictate your thought, then pick where it lands."),
      React.createElement("div", {
        style: { display: "flex", alignItems: "stretch", gap: 10, marginBottom: 14 }
      },
        React.createElement("button", {
          type: "button",
          onClick: onMicToggle,
          style: {
            width: 56, height: 56, borderRadius: "50%",
            border: "1px solid " + (voiceListening ? "#fca5a5" : "var(--c-border)"),
            background: voiceListening ? "#fee2e2" : "#fff",
            color: voiceListening ? "#b91c1c" : "#2d5a2d",
            cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: voiceListening ? "pulseDot 1s ease-in-out infinite" : "none"
          }
        }, React.createElement("svg", {
          width: 24, height: 24, viewBox: "0 0 24 24", fill: "none",
          stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"
        },
          React.createElement("rect", { x: "9", y: "2", width: "6", height: "11", rx: "3" }),
          React.createElement("path", { d: "M5 11a7 7 0 0014 0" }),
          React.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "22" })
        )),
        React.createElement("div", {
          style: {
            flex: 1, minWidth: 0,
            background: "var(--c-surface-raised)",
            border: "1px solid var(--c-border)",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13, lineHeight: 1.5,
            color: previewText ? "var(--c-text)" : "#9ca3af",
            minHeight: 56,
            whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere"
          }
        }, previewText || (voiceListening ? "Listening..." : "Tap the mic and start talking."))
      ),
      React.createElement("div", {
        style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }
      },
        ([
          { label: "Save as Goal",    color: "#7c3aed", onClick: onSaveAsGoal },
          { label: "Save as Habit",   color: "#2d5a2d", onClick: onSaveAsHabit },
          { label: "Save as To-Do",   color: "#b45309", onClick: onSaveAsTodo },
          { label: "Save as Journal", color: "#0891b2", onClick: onSaveAsJournal }
        ]).map(b => React.createElement("button", {
          key: b.label,
          type: "button",
          onClick: b.onClick,
          disabled: !hasText,
          style: {
            background: hasText ? b.color : "var(--c-surface-muted)",
            color: hasText ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: 10,
            padding: "11px 12px",
            fontSize: 12, fontWeight: 700,
            cursor: hasText ? "pointer" : "default",
            opacity: hasText ? 1 : 0.6,
            whiteSpace: "nowrap"
          }
        }, b.label))
      ),
      hasText && React.createElement("button", {
        type: "button",
        onClick: onClear,
        style: {
          marginTop: 8,
          background: "transparent", border: "none",
          color: "#9ca3af", fontSize: 11, fontWeight: 600,
          cursor: "pointer", padding: 4, width: "100%"
        }
      }, "Clear and start over")
    );
  }

  window.VoiceCaptureModal = VoiceCaptureModal;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { VoiceCaptureModal };
  }
})();
