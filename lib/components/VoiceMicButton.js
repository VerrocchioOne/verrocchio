// lib/components/VoiceMicButton.js
//
// Microphone-button React component + the underlying SpeechRecognition,
// dedupe-appender, and wake-lock helpers it depends on. Originally
// inline at index.html L1657-L1883 (227 LOC cluster). Pulled into one
// file because the four helpers are only used by VoiceMicButton (plus
// the VoiceCaptureModal at L15360 which calls acquireWakeLock directly).
//
// Browser dependencies:
//   - React (UMD global, loaded earlier in head)
//   - SpeechRecognition / webkitSpeechRecognition (browser API)
//   - navigator.wakeLock (browser API, may be unavailable on older iOS)
//
// Exposes on window:
//   window.SpeechRec, window.speechRecAvailable,
//   window.startSpeechSession, window.dedupeAppender,
//   window.acquireWakeLock, window.VoiceMicButton

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

const SpeechRec = (typeof window !== "undefined")
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;
const speechRecAvailable = !!SpeechRec;
function startSpeechSession({ onChunk, onError, onEnd, lang } = {}) {
  if (!SpeechRec) return null;
  const rec = new SpeechRec();
  rec.continuous = true;
  rec.interimResults = true;
  // maxAlternatives is widely supported; defaulting to 1 keeps the
  // result list shallow and the chosen alternative deterministic.
  try { rec.maxAlternatives = 1; } catch (e) {}
  rec.lang = lang || (typeof navigator !== "undefined" && navigator.language) || "en-US";
  // Track which final-result indices we've already emitted in this
  // session. iOS Safari occasionally re-fires the same final result
  // twice when the recognizer auto-pauses on a brief silence — that
  // led to the same sentence being appended twice in the transcript.
  // Indexing by result.resultIndex makes dedupe cheap and exact.
  const emittedFinals = new Set();
  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const txt = (r[0] && r[0].transcript) || "";
      if (r.isFinal) {
        if (emittedFinals.has(i)) continue;
        emittedFinals.add(i);
        if (txt && onChunk) onChunk({ text: txt.trim(), isFinal: true });
      } else {
        interim += txt;
      }
    }
    if (interim && onChunk) onChunk({ text: interim.trim(), isFinal: false });
  };
  rec.onerror = (e) => { if (onError) onError(e && e.error ? e.error : "speech_error"); };
  rec.onend = () => { if (onEnd) onEnd(); };
  try { rec.start(); }
  catch (err) { if (onError) onError("speech_start_failed"); return null; }
  return {
    stop: () => { try { rec.stop(); } catch (e) { /* already stopped */ } },
    abort: () => { try { rec.abort(); } catch (e) {} }
  };
}
// Caller-side dedupe for chunks that survive across recognizer
// relaunches. When the browser auto-stops a session and we restart it
// (e.g. iOS Safari capping at ~5 min), the new session has its own
// resultIndex space — the in-session Set above can't see across
// sessions. Compare a chunk against the most-recent appended final and
// drop exact-duplicate / strict-suffix matches that arrive within a
// short window. Conservative: only suppresses true repeats.
function dedupeAppender(append) {
  let lastText = "";
  let lastAt = 0;
  return (chunk) => {
    const now = Date.now();
    const t = (chunk || "").trim();
    if (!t) return;
    if (lastText && (now - lastAt) < 4000) {
      // Apply the same length gate to BOTH branches so legitimate
      // consecutive short utterances ("yes", "yes" or "go", "go")
      // still pass through. Only suppress repeats of substantial
      // utterances (>=12 chars) where re-emission is the SDK glitch.
      if (lastText.length >= 12 && t === lastText) return;
      if (lastText.length >= 12 && t.endsWith(lastText)) return;
    }
    lastText = t;
    lastAt = now;
    append(t);
  };
}
// Screen Wake Lock helper. Keeps the phone awake while a long voice
// recording is in progress so iOS / Android don't dim and suspend the
// app mid-sentence (which silently truncates the recognizer's session
// and drops the rest of the transcript). Returns an object with a
// release() method, or null if the API isn't supported.
//
// iOS Safari 16.4+ and Chrome / Edge / Firefox all support
// navigator.wakeLock.request("screen"). On older iOS the helper returns
// null and the caller proceeds without a lock — the dedupeAppender +
// relaunch loop already handle the most common silence-cap case.
//
// The lock auto-releases when the page becomes hidden (OS rule we
// can't override). To survive an app-switch, we re-acquire on
// visibilitychange whenever the lock is meant to be active.
async function acquireWakeLock() {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return null;
  let lock = null;
  let released = false;
  const reacquire = async () => {
    if (released || document.visibilityState !== "visible") return;
    try { lock = await navigator.wakeLock.request("screen"); }
    catch (e) { try { console.warn("[verrocchio wake-lock] re-acquire failed:", e && e.message); } catch (_) {} }
  };
  try { lock = await navigator.wakeLock.request("screen"); }
  catch (e) { try { console.warn("[verrocchio wake-lock] initial acquire failed:", e && e.message); } catch (_) {} return null; }
  document.addEventListener("visibilitychange", reacquire);
  return {
    release: async () => {
      released = true;
      document.removeEventListener("visibilitychange", reacquire);
      if (lock) { try { await lock.release(); } catch (_) {} lock = null; }
    }
  };
}

// React component: little microphone button that toggles a dictation
// session. While listening, the button pulses red. Each final chunk
// is forwarded to onTranscript(text); the caller decides whether to
// append (default) or replace. Interim text is shown via onInterim
// for live preview.
function VoiceMicButton({ onTranscript, onInterim, label, size, style }) {
  const [active, setActive] = React.useState(false);
  const sessionRef = React.useRef(null);
  // activeRef mirrors `active` for the closures inside onEnd —
  // useState's value is stale by the time the recognizer's onend
  // fires, so we keep a ref that callbacks read instead.
  const activeRef = React.useRef(false);
  // Wake-lock sentinel held while recording. Released on stop / unmount
  // so we don't keep the screen awake after the user finishes.
  const wakeLockRef = React.useRef(null);
  // Hard cap so a forgotten-on mic doesn't loop forever. 30 min
  // covers a long journal/reflection or a full meditation while still
  // bounding battery/network if the user walks away from the device.
  const startedAtRef = React.useRef(0);
  const MAX_MS = 30 * 60 * 1000;
  if (!speechRecAvailable) return null;
  const stop = () => {
    activeRef.current = false;
    if (sessionRef.current) { sessionRef.current.stop(); sessionRef.current = null; }
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    setActive(false);
  };
  const start = () => {
    if (sessionRef.current) return;
    activeRef.current = true;
    startedAtRef.current = Date.now();
    // Fire-and-forget the screen wake-lock acquisition so iOS / Android
    // don't dim and suspend the page mid-recording (which silently
    // truncates the transcript). Returns null on browsers without the
    // API; recording still works without the lock.
    acquireWakeLock().then(lock => {
      if (activeRef.current) wakeLockRef.current = lock;
      else if (lock) lock.release();
    });
    // Cross-session dedupe wrapper. iOS Safari sometimes re-fires the
    // last final from session N at the start of session N+1 after a
    // silence-triggered relaunch — the wrapper drops exact duplicates
    // and strict suffix repeats so the user's transcript doesn't
    // contain "I went to the store. I went to the store."
    const dedupedAppend = dedupeAppender(text => {
      if (onTranscript) onTranscript(text);
    });
    const launch = () => {
      sessionRef.current = startSpeechSession({
        onChunk: ({ text, isFinal }) => {
          if (!text) return;
          if (isFinal) { dedupedAppend(text); }
          else { if (onInterim) onInterim(text); }
        },
        onError: (err) => {
          // 'no-speech' / 'aborted' happen routinely on iOS Safari
          // when the recognizer pauses on silence. Don't surface
          // them; just attempt a relaunch if the user is still
          // active. Other errors give up.
          if (activeRef.current && (err === "no-speech" || err === "aborted") && (Date.now() - startedAtRef.current) < MAX_MS) {
            sessionRef.current = null;
            // 600 ms gives the user time to take a breath without the
            // recognizer popping back on mid-pause. Long enough that
            // the next utterance gets captured as a fresh result;
            // short enough that real continuation isn't dropped.
            setTimeout(() => { if (activeRef.current) launch(); }, 600);
          } else {
            stop();
          }
        },
        onEnd: () => {
          // Browsers cap a single recognition session (Chrome ~60s,
          // Safari ~5 min). When it auto-stops, restart it as long
          // as the user is still in active mode and we're under
          // the 30-min hard cap. 300 ms gap is enough for the SDK
          // to fully tear down the previous session before the next
          // one starts (avoids spurious "already started" errors).
          sessionRef.current = null;
          if (activeRef.current && (Date.now() - startedAtRef.current) < MAX_MS) {
            setTimeout(() => { if (activeRef.current) launch(); }, 300);
          } else {
            activeRef.current = false;
            setActive(false);
          }
        }
      });
    };
    launch();
    if (sessionRef.current) setActive(true);
  };
  const px = size || 28;
  return React.createElement("button", {
    type: "button",
    "aria-label": active ? "Stop dictation" : (label || "Voice to text"),
    title: active ? "Tap to stop" : (label || "Voice to text"),
    onClick: e => { e.stopPropagation(); active ? stop() : start(); },
    style: Object.assign({
      width: px, height: px,
      borderRadius: "50%",
      border: "1px solid " + (active ? "#fca5a5" : "var(--c-border)"),
      background: active ? "#fee2e2" : "#fff",
      color: active ? "#b91c1c" : "#6b7280",
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      padding: 0,
      WebkitTapHighlightColor: "transparent",
      animation: active ? "pulseDot 1s ease-in-out infinite" : "none"
    }, style || {})
  },
    React.createElement("svg", {
      width: Math.round(px * 0.5), height: Math.round(px * 0.5),
      viewBox: "0 0 24 24", fill: "none",
      stroke: "currentColor", strokeWidth: "2",
      strokeLinecap: "round", strokeLinejoin: "round"
    },
      React.createElement("rect", { x: "9", y: "2", width: "6", height: "11", rx: "3" }),
      React.createElement("path", { d: "M5 11a7 7 0 0014 0" }),
      React.createElement("line", { x1: "12", y1: "18", x2: "12", y2: "22" })
    )
  );
}

  window.SpeechRec = SpeechRec;
  window.speechRecAvailable = speechRecAvailable;
  window.startSpeechSession = startSpeechSession;
  window.dedupeAppender = dedupeAppender;
  window.acquireWakeLock = acquireWakeLock;
  window.VoiceMicButton = VoiceMicButton;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { SpeechRec, speechRecAvailable, startSpeechSession, dedupeAppender, acquireWakeLock, VoiceMicButton };
  }
})();
