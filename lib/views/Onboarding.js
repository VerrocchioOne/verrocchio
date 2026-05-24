// lib/views/Onboarding.js
//
// Pre-app onboarding flow: 3-screen walkthrough carousel + balanced-life
// primer + intent capture. Reached when `!hasSeenWelcome` and splash has
// completed loading.
//
// Wave 4.5.2. Originally inline at index.html L11014-L11326.
//
// References from shared classic-script global lexical environment:
//   HT (lib/constants.js)

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const GREEN = "#2d5a2d";

  function Onboarding({ data, dispatch, deviceProfile, state, callbacks }) {
    const s = state || {};
    const cb = callbacks || {};
    const onboardStep = s.onboardStep || 0;
    const walkSlide = s.walkSlide || 0;
    const onbIntent = s.onbIntent || "";
    const setOnboardStep = cb.setOnboardStep || (() => {});
    const setWalkSlide = cb.setWalkSlide || (() => {});
    const setOnbIntent = cb.setOnbIntent || (() => {});
    const onFinish = cb.onFinish || (() => {});

    const onbStopSwipe = {
      onTouchStart: e => e.stopPropagation(),
      onMouseDown: e => e.stopPropagation()
    };

    const onbShell = (children) => React.createElement("div", {
      style: {
        background: "linear-gradient(180deg, #f8f7f4 0%, #efece5 100%)",
        minHeight: "100vh",
        minHeight: "-webkit-fill-available",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "system-ui,-apple-system,sans-serif"
      }
    }, React.createElement("div", {
      className: "lg",
      style: {
        width: "100%", maxWidth: 440,
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.03), 0 18px 40px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.04)",
        padding: "24px 22px 20px",
        display: "flex", flexDirection: "column"
      }
    }, children));

    const navButtons = (onAdvance, onBack, nextLabel) => React.createElement("div", {
      key: "nav",
      style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 4 }
    },
      onBack
        ? React.createElement("button", {
            key: "back", onClick: onBack,
            style: { background: "transparent", color: "#4b5563", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }
          }, "Back")
        : React.createElement("span", { key: "back" }),
      React.createElement("button", {
        key: "next", onClick: onAdvance,
        style: { background: "#2d5a2d", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", minWidth: 110 }
      }, nextLabel || "Next")
    );

    const progressBar = React.createElement("div", {
      key: "prog",
      style: { display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 }
    }, [0,1,2].map(i => React.createElement("div", {
      key: "d" + i,
      style: { width: i === onboardStep ? 22 : 8, height: 8, borderRadius: 4, background: i <= onboardStep ? "var(--c-text)" : "var(--c-border)", transition: "all .2s" }
    })));

    const primaryBtn = (label, onClick, opts) => React.createElement("button", {
      onClick,
      disabled: opts && opts.disabled,
      style: {
        flex: opts && opts.flex !== undefined ? opts.flex : 1,
        padding: "12px 16px", fontSize: 15, fontWeight: 600, color: "#fff",
        background: (opts && opts.disabled) ? "#9ca3af" : "#2d5a2d",
        border: "none", borderRadius: 10,
        cursor: (opts && opts.disabled) ? "default" : "pointer"
      }
    }, label);

    const illusTarget = () => React.createElement("svg", { key: "ico", className: "ob-illus", viewBox: "0 0 56 56", "aria-hidden": true },
      React.createElement("circle", { className: "ob-target-ring", cx: 28, cy: 28, r: 22, fill: "none", stroke: GREEN, strokeWidth: 2, opacity: 0.0 }),
      React.createElement("circle", { className: "ob-target-ring d2", cx: 28, cy: 28, r: 22, fill: "none", stroke: GREEN, strokeWidth: 2, opacity: 0.0 }),
      React.createElement("circle", { cx: 28, cy: 28, r: 14, fill: "none", stroke: GREEN, strokeWidth: 2, opacity: 0.55 }),
      React.createElement("circle", { cx: 28, cy: 28, r: 8, fill: "none", stroke: GREEN, strokeWidth: 2, opacity: 0.75 }),
      React.createElement("circle", { className: "ob-target-dot", cx: 28, cy: 28, r: 3.5, fill: GREEN })
    );
    const illusLadder = () => React.createElement("svg", { key: "ico", className: "ob-illus", viewBox: "0 0 56 56", "aria-hidden": true },
      React.createElement("line", { x1: 14, y1: 8, x2: 14, y2: 50, stroke: GREEN, strokeWidth: 2, strokeLinecap: "round", opacity: 0.35 }),
      React.createElement("line", { x1: 42, y1: 8, x2: 42, y2: 50, stroke: GREEN, strokeWidth: 2, strokeLinecap: "round", opacity: 0.35 }),
      React.createElement("line", { className: "ob-ladder-rung r4", x1: 14, y1: 14, x2: 42, y2: 14, stroke: GREEN, strokeWidth: 3, strokeLinecap: "round" }),
      React.createElement("line", { className: "ob-ladder-rung r3", x1: 14, y1: 26, x2: 42, y2: 26, stroke: GREEN, strokeWidth: 3, strokeLinecap: "round" }),
      React.createElement("line", { className: "ob-ladder-rung r2", x1: 14, y1: 38, x2: 42, y2: 38, stroke: GREEN, strokeWidth: 3, strokeLinecap: "round" }),
      React.createElement("line", { className: "ob-ladder-rung",    x1: 14, y1: 48, x2: 42, y2: 48, stroke: GREEN, strokeWidth: 3, strokeLinecap: "round" })
    );
    const illusCompass = () => React.createElement("svg", { key: "ico", className: "ob-illus", viewBox: "0 0 56 56", "aria-hidden": true },
      React.createElement("circle", { cx: 28, cy: 28, r: 22, fill: "none", stroke: GREEN, strokeWidth: 2 }),
      React.createElement("circle", { cx: 28, cy: 28, r: 17, fill: "none", stroke: GREEN, strokeWidth: 1, opacity: 0.35 }),
      React.createElement("g", { className: "ob-compass-needle" },
        React.createElement("polygon", { points: "28,10 32,28 28,26 24,28", fill: GREEN }),
        React.createElement("polygon", { points: "28,46 32,28 28,30 24,28", fill: GREEN, opacity: 0.35 })
      ),
      React.createElement("circle", { cx: 28, cy: 28, r: 2.5, fill: "#fff", stroke: GREEN, strokeWidth: 1.5 })
    );
    const illusScale = () => React.createElement("svg", { key: "ico", className: "ob-illus", viewBox: "0 0 56 56", "aria-hidden": true },
      React.createElement("line", { x1: 28, y1: 14, x2: 28, y2: 46, stroke: GREEN, strokeWidth: 2, strokeLinecap: "round", opacity: 0.45 }),
      React.createElement("rect", { x: 22, y: 46, width: 12, height: 4, rx: 1.5, fill: GREEN, opacity: 0.55 }),
      React.createElement("g", { className: "ob-scale-beam" },
        React.createElement("line", { x1: 10, y1: 18, x2: 46, y2: 18, stroke: GREEN, strokeWidth: 2.5, strokeLinecap: "round" }),
        React.createElement("line", { x1: 14, y1: 18, x2: 14, y2: 28, stroke: GREEN, strokeWidth: 1.5 }),
        React.createElement("line", { x1: 42, y1: 18, x2: 42, y2: 28, stroke: GREEN, strokeWidth: 1.5 }),
        React.createElement("path", { d: "M 8 28 Q 14 34 20 28 Z", fill: GREEN, opacity: 0.75 }),
        React.createElement("path", { d: "M 36 28 Q 42 34 48 28 Z", fill: GREEN, opacity: 0.75 })
      ),
      React.createElement("circle", { cx: 28, cy: 14, r: 2.5, fill: GREEN })
    );
    const illusSparkle = () => React.createElement("svg", { key: "ico", className: "ob-illus", viewBox: "0 0 56 56", "aria-hidden": true },
      React.createElement("path", { className: "ob-sparkle-core", d: "M 28 10 L 31 25 L 46 28 L 31 31 L 28 46 L 25 31 L 10 28 L 25 25 Z", fill: GREEN }),
      React.createElement("circle", { className: "ob-sparkle-ray",    cx: 12, cy: 12, r: 1.8, fill: GREEN }),
      React.createElement("circle", { className: "ob-sparkle-ray r2", cx: 44, cy: 44, r: 1.8, fill: GREEN }),
      React.createElement("circle", { className: "ob-sparkle-ray r2", cx: 46, cy: 12, r: 1.4, fill: GREEN }),
      React.createElement("circle", { className: "ob-sparkle-ray",    cx: 10, cy: 44, r: 1.4, fill: GREEN })
    );

    if (onboardStep === 0) {
      const slides = [
        { illus: illusTarget,  ttl: "Welcome to Verrocchio", body: "A habit tracker for people who are serious about becoming better. You'll set goals that matter, and build the daily habits that get you there." },
        { illus: illusLadder,  ttl: "Goals + Habits, linked", body: "Every habit ladders up to a goal. Track compound progress over weeks and months — not just today's check-ins." },
        { illus: illusCompass, ttl: "Reflect & adjust", body: "Daily briefings, journals, and XP keep you honest. When life shifts, your habits shift with it — and history is preserved." }
      ];
      const slide = slides[walkSlide];
      const last = walkSlide === slides.length - 1;
      const advance = () => { if (last) setOnboardStep(1); else setWalkSlide(walkSlide + 1); };
      const back = walkSlide > 0 ? () => setWalkSlide(walkSlide - 1) : null;
      return onbShell([
        progressBar,
        slide.illus(),
        React.createElement("div", { key: "ttl", style: { fontSize: 20, fontWeight: 700, color: "var(--c-text)", textAlign: "center", marginBottom: 10 } }, slide.ttl),
        React.createElement("div", { key: "body", style: { fontSize: 14, color: "#4b5563", lineHeight: 1.55, textAlign: "center", marginBottom: 22, padding: "0 6px" } }, slide.body),
        navButtons(advance, back)
      ]);
    }

    if (onboardStep === 1) {
      return onbShell([
        progressBar,
        illusScale(),
        React.createElement("div", { key: "ttl", style: { fontSize: 20, fontWeight: 700, color: "var(--c-text)", textAlign: "center", marginBottom: 8 } }, "A balanced life"),
        React.createElement("div", { key: "body", style: { fontSize: 14, color: "#4b5563", lineHeight: 1.55, textAlign: "center", marginBottom: 18, padding: "0 6px" } }, "Verrocchio organizes your goals and habits into seven Areas of Life. Aim for breadth — not just grinding on one axis."),
        React.createElement("div", {
          key: "grid",
          style: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 22 }
        }, HT.map(t => React.createElement("div", {
          key: t.value,
          style: {
            padding: "10px 12px", borderRadius: 10,
            background: t.bg, border: "1px solid " + t.border, color: t.color,
            fontSize: 13, fontWeight: 600, textAlign: "center"
          }
        }, t.value))),
        React.createElement("div", { key: "hint", style: { fontSize: 11.5, color: "#6b7280", textAlign: "center", marginBottom: 14, fontStyle: "italic" } }, "You can rename or customize these later in Profile."),
        navButtons(() => setOnboardStep(2), () => setOnboardStep(0))
      ]);
    }

    if (onboardStep === 2) {
      return onbShell([
        progressBar,
        illusSparkle(),
        React.createElement("div", { key: "ttl", style: { fontSize: 20, fontWeight: 700, color: "var(--c-text)", textAlign: "center", marginBottom: 8 } }, "Why are you here?"),
        React.createElement("div", { key: "body", style: { fontSize: 14, color: "#4b5563", lineHeight: 1.55, textAlign: "center", marginBottom: 16, padding: "0 6px" } }, "One sentence on what you want to accomplish. We'll show it back to you on the hard days."),
        React.createElement("textarea", Object.assign({
          key: "ta",
          value: onbIntent,
          onChange: e => setOnbIntent(e.target.value),
          placeholder: "I want to...",
          rows: 4,
          style: {
            width: "100%", padding: "10px 12px", fontSize: 14,
            border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 16,
            outline: "none", boxSizing: "border-box",
            background: "#fff", color: "var(--c-text)", resize: "vertical",
            fontFamily: "inherit", lineHeight: 1.5,
            userSelect: "text", WebkitUserSelect: "text"
          }
        }, onbStopSwipe)),
        navButtons(onFinish, () => setOnboardStep(1), "Enter Verrocchio")
      ]);
    }

    return onbShell([
      React.createElement("div", { key: "fb", style: { textAlign: "center", padding: "20px 0" } },
        primaryBtn("Enter Verrocchio", onFinish)
      )
    ]);
  }

  window.Onboarding = Onboarding;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { Onboarding };
  }
})();
