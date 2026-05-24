// lib/views/TourOverlay.js
//
// Guided tour overlay: TOUR_STEPS data (27 step objects) + renderer
// (spotlight + tooltip + minimized-pill + inline forms).
//
// Wave 4.3. Originally inline at index.html L11368-L11704 (TOUR_STEPS)
// and L11724-L12262 (renderTour function).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  const TOUR_STEPS = [
    { title: "Let's show you around!", body: "You'll set your first goal, link a habit, and see how the pieces fit. We'll walk it together — swipe to continue.", center: true },
    { title: "Let's start by adding a goal", body: "Tap the [+] above to open the new-goal form.", selector: "button[aria-label='New goal']", placement: "bottom", tab: "goals", pinBottom: true, gate: () => !!document.querySelector("[data-tour-id='goal-form']"), gateHint: "Tap + to start.", autoAdvance: true, skipIf: d => !!(d && Array.isArray(d.goals) && d.goals.length > 0), skipSteps: 5 },
    { title: "Write your goal", body: "One short sentence on what you want to accomplish. Keep it concrete — e.g. “Run a half-marathon”, not “Get fit”. Swipe when you're done.", selector: "[data-tour-id='goal-name']", extraSelector: "[data-tour-id='goal-next']", placement: "bottom", tab: "goals", formStep: true, gate: () => { const inp = document.querySelector("[data-tour-id='goal-name']"); return !!(inp && inp.value && inp.value.trim().length > 0); }, gateHint: "Type a goal to continue." },
    { title: "Pick an area of life", body: "Which part of life does this goal pertain to? Choose one so your goals stay organized.", selector: "[data-tour-id='goal-area']", placement: "top", tab: "goals", formStep: true, gate: () => { const sel = document.querySelector("[data-tour-id='goal-area']"); return !!(sel && sel.value && sel.value.length > 0); }, gateHint: "Pick an area of life.", autoAdvance: true },
    { title: "Add SMART details (optional)", body: "Specific, Measurable, Achievable, Relevant, Time-bound. Fill them in now or tap Add Goal when you're ready — SMART is optional.", selector: "[data-tour-id='goal-smart']", extraSelector: "[data-tour-id='goal-save']", placement: "top", tab: "goals", formStep: true },
    { title: "Save your goal", body: "Tap Add Goal to save it and move on to habits.", selector: "[data-tour-id='goal-save']", placement: "top", tab: "goals", formStep: true, gate: d => !!(d && Array.isArray(d.goals) && d.goals.length > 0), gateHint: "Tap Add Goal to continue.", autoAdvance: true },
    { title: "Your goal is set", body: "Every goal has a SMART breakdown: what you're doing, how much, whether it's realistic, why it matters, and when it's due. You can tap the goal card any time to edit.", tab: "goals", pinBottom: true },
    { title: "Now add a habit", body: "Habits are the daily reps that move your goal forward. Tap the [+] above to set one up.", selector: "button[aria-label='New habit']", placement: "bottom", tab: "habits", pinBottom: true, gate: () => !!document.querySelector("[data-tour-id='habit-form']"), gateHint: "Tap + to start.", autoAdvance: true, skipIf: d => !!(d && Array.isArray(d.habits) && d.habits.length > 0), skipSteps: 8 },
    { title: "Name your habit", body: "What's the daily action? Keep it small and concrete — e.g. “Run 20 minutes” or “10 pushups”. Swipe when you're done.", selector: "[data-tour-id='habit-name']", placement: "bottom", tab: "habits", formStep: true, gate: () => { const inp = document.querySelector("[data-tour-id='habit-name']"); return !!(inp && inp.value && inp.value.trim().length > 0); }, gateHint: "Type a habit to continue." },
    { title: "Link it to the goal you just set", body: "Connect this habit to the goal you just added so progress rolls up. Picking the goal also auto-fills the habit's Area of Life — they have to match.", selector: "[data-tour-id='habit-goal']", placement: "top", tab: "habits", formStep: true, gate: () => { const sel = document.querySelector("[data-tour-id='habit-goal']"); return !!(sel && sel.value && sel.value !== "__new__"); }, gateHint: "Pick the goal you just created.", autoAdvance: true },
    { title: "Area of Life — locked to the goal", body: "Because you linked a goal, the habit sits in the same Area of Life. Unlink the goal if you need to change it.", selector: "[data-tour-id='habit-area']", placement: "top", tab: "habits", formStep: true },
    { title: "How important is this habit?", body: "Rank it so the daily view surfaces the load-bearing habits first when your day gets crowded.", selector: "[data-tour-id='habit-importance']", placement: "top", tab: "habits", formStep: true },
    { title: "When & how long?", body: "Pick a time of day and roughly how long it takes. These two slots drive how the habit groups on your daily view.", selector: "[data-tour-id='habit-timing']", placement: "top", tab: "habits", formStep: true },
    { title: "Start date & cadence", body: "Pick when the habit begins and how often it repeats — daily, weekly on certain days, monthly, or a one-off date.", selector: "[data-tour-id='habit-schedule']", placement: "top", tab: "habits", formStep: true },
    { title: "Save your habit", body: "Tap Add to save it. You can always edit later by long-pressing the habit card.", selector: "[data-tour-id='habit-save']", placement: "top", tab: "habits", formStep: true, gate: d => !!(d && Array.isArray(d.habits) && d.habits.length > 0), gateHint: "Tap Add to continue.", autoAdvance: true },
    { title: "Habits stack into a routine", body: "Every habit pairs with a goal and a time of day — morning, afternoon, evening, or an “avoid” bucket for things to steer clear of. The demo comes with four that map to the marathon goal so you can see how the pieces click together.", tab: "habits", pinBottom: true },
    { title: "To-Dos — one-offs", body: "For tasks that don't repeat. Link a to-do to a goal and it shows up inside that goal's detail view too.", selector: "button[aria-label='New task']", placement: "bottom", tab: "todos" },
    { title: "Reflect — look back", body: "Journal by day, save favorite quotes, revisit past entries. Weekly reviews and mood notes land here too.", tab: "reflection", pinBottom: true },
    { title: "The date you're viewing", body: "The top strip always reflects the day you're on. Tap the badge to jump back to today.", selector: "[data-tour='header-date']", placement: "bottom" },
    { title: "Calendar", body: "Open the calendar to pick any date, scroll back through history, or plan ahead.", selector: "[data-tour='header-calendar']", placement: "bottom" },
    { title: "Pick your weekly review", body: "Pick a day and time each week to zoom out and recap. We'll nudge you so it actually happens.", center: true, form: "weeklyReview" },
    { title: "At Home vs Traveling", body: "Flip the selected day between home and travel in one tap. Travel days only show habits tagged to run while away.", selector: "[data-tour='header-travel']", placement: "bottom" },
    { title: "Where is home?", body: "Tell us where home base is. We'll keep your routines solid whether you're there or on the road.", center: true, form: "homeLocation" },
    { title: "Level & XP", body: "You earn XP every time you log a habit. Each level is 500 XP. Press and hold for your achievements shelf.", selector: "[data-tour='header-xp']", placement: "bottom" },
    { title: "Your streak", body: "The flame counts consecutive days where you logged at least one habit — complete or missed, both count. Don't break the chain.", selector: "[data-tour='header-streak']", placement: "bottom" },
    { title: "Profile & settings", body: "Themes, custom categories, priorities, time-of-day groups, and a Replay Tour button all live here.", selector: "button[aria-label='Profile']", placement: "bottom" },
    { title: "You're all set", body: "That's the whole app. Replay this tour anytime from Profile → App Settings → Guided Tour.", center: true, tab: "brief" }
  ];

  function TourOverlay(props) {
    const cb = (props && props.callbacks) || {};
    const h = cb.helpers || {};
    const data = h.data;
    const save = h.save;
    const finishTour = h.finishTour || (() => {});
    const tourStep = h.tourStep || 0;
    const setTourStep = h.setTourStep || (() => {});
    const tourMinimized = !!h.tourMinimized;
    const setTourMinimized = h.setTourMinimized || (() => {});
    const tourReviewDay = h.tourReviewDay;
    const setTourReviewDay = h.setTourReviewDay || (() => {});
    const tourReviewHour = h.tourReviewHour;
    const setTourReviewHour = h.setTourReviewHour || (() => {});
    const tourHome = h.tourHome;
    const setTourHome = h.setTourHome || (() => {});
    const tourAdvanceRef = h.tourAdvanceRef;
    const tourGoBackRef = h.tourGoBackRef;
    const setExpTodoForm = h.setExpTodoForm || (() => {});

    if (tourStep === 0) return null;
    const step = TOUR_STEPS[tourStep - 1];
    if (!step) return null;

    if (tourMinimized) {
      let corner = { bottom: "calc(80px + env(safe-area-inset-bottom, 0px))", right: 14 };
      if (step.selector) {
        const el = document.querySelector(step.selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          const vw = window.innerWidth || 360;
          const vh = window.innerHeight || 640;
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const inTop = cy < vh / 2;
          const inLeft = cx < vw / 2;
          corner = inTop && inLeft  ? { bottom: "calc(80px + env(safe-area-inset-bottom, 0px))", right: 14 }
                 : inTop && !inLeft ? { bottom: "calc(80px + env(safe-area-inset-bottom, 0px))", left: 14 }
                 : !inTop && inLeft ? { top: "calc(12px + env(safe-area-inset-top, 0px))", right: 14 }
                 :                    { top: "calc(12px + env(safe-area-inset-top, 0px))", left: 14 };
        }
      }
      return React.createElement("div", {
        "data-tour-overlay": "1",
        "data-tour-minimized": "1",
        style: Object.assign({ position: "fixed", zIndex: 10001, pointerEvents: "none" }, corner)
      },
        React.createElement("div", {
          className: "lg tour-tip tour-resume-pill",
          style: {
            pointerEvents: "auto",
            display: "flex", alignItems: "stretch",
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            boxShadow: "0 10px 28px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.9)",
            maxWidth: 280, overflow: "hidden"
          }
        },
          React.createElement("button", {
            type: "button",
            onClick: () => setTourMinimized(false),
            "aria-label": "Resume tour",
            style: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "none", background: "transparent", fontSize: 12, fontWeight: 600, color: "#2d5a2d", cursor: "pointer", WebkitTapHighlightColor: "transparent" }
          },
            React.createElement("span", { style: { fontSize: 14, lineHeight: 1 } }, "📖"),
            React.createElement("span", { style: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, "Resume tour")
          ),
          React.createElement("div", { style: { width: 1, background: "rgba(0,0,0,0.08)" } }),
          React.createElement("button", {
            type: "button",
            onClick: finishTour,
            "aria-label": "Exit tour", title: "Exit tour",
            style: { display: "flex", alignItems: "center", justifyContent: "center", width: 40, border: "none", background: "transparent", fontSize: 20, fontWeight: 600, color: "#374151", cursor: "pointer", WebkitTapHighlightColor: "transparent" }
          }, "×")
        )
      );
    }

    const gateBlocked = typeof step.gate === "function" && !step.gate(data);
    const pinBottom = step.pinBottom === true;
    let dockEdge = null;
    if (pinBottom) {
      dockEdge = "bottom";
    } else if (step.selector || gateBlocked || step.formStep === true) {
      let targetInTopHalf = true;
      if (step.selector) {
        const el = document.querySelector(step.selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          const vh = window.innerHeight || 640;
          targetInTopHalf = (rect.top + rect.height / 2) < vh / 2;
        }
      }
      dockEdge = targetInTopHalf ? "bottom" : "top";
    }

    const TIP_MAX = 340;
    let tipStyle = {};
    if (dockEdge === "bottom") {
      tipStyle = { position: "fixed", left: "50%", bottom: "calc(18px + env(safe-area-inset-bottom, 0px))", transform: "translateX(-50%)", width: "min(" + TIP_MAX + "px, calc(100vw - 24px))" };
    } else if (dockEdge === "top") {
      tipStyle = { position: "fixed", left: "50%", top: "calc(12px + env(safe-area-inset-top, 0px))", transform: "translateX(-50%)", width: "min(" + TIP_MAX + "px, calc(100vw - 24px))" };
    } else {
      const vw = window.innerWidth;
      const tipW = Math.min(TIP_MAX, vw - 32);
      tipStyle = { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: tipW };
    }

    const isLast = tourStep === TOUR_STEPS.length;

    const advance = () => {
      if (gateBlocked) return;
      if (step.form === "weeklyReview") {
        save({ ...data, weeklyReview: { day: tourReviewDay, hour: tourReviewHour } });
      } else if (step.form === "homeLocation") {
        save({ ...data, homeLocation: tourHome.trim() });
      }
      if (isLast) finishTour();
      else setTourStep(tourStep + 1);
    };
    const goBack = () => {
      if (tourStep > 1) setTourStep(tourStep - 1);
    };
    if (tourAdvanceRef) tourAdvanceRef.current = advance;
    if (tourGoBackRef) tourGoBackRef.current = goBack;

    const stopSwipeStart = {
      onTouchStart: e => e.stopPropagation(),
      onMouseDown: e => e.stopPropagation()
    };

    const runOptionalAction = () => {
      if (step.optionalActionKey === "openTodoForm") {
        setExpTodoForm(true);
      } else if (step.optionalActionKey === "focusReflect") {
        const ta = document.querySelector("[data-tour='reflect-input']");
        if (ta && typeof ta.focus === "function") ta.focus();
      }
    };

    let formNode = null;
    if (step.form === "weeklyReview") {
      const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      formNode = React.createElement("div", {
        key: "wrf", style: { display: "flex", gap: 8, marginBottom: 14 }
      },
        React.createElement("select", Object.assign({
          value: tourReviewDay,
          onChange: e => setTourReviewDay(Number(e.target.value)),
          style: { flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "var(--c-surface-raised)", fontSize: 13, color: "var(--c-text)" }
        }, stopSwipeStart), DAY_NAMES.map((n, i) => React.createElement("option", { key: i, value: i }, n))),
        React.createElement("select", Object.assign({
          value: tourReviewHour,
          onChange: e => setTourReviewHour(Number(e.target.value)),
          style: { flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "var(--c-surface-raised)", fontSize: 13, color: "var(--c-text)" }
        }, stopSwipeStart), Array.from({ length: 24 }, (_, hh) => {
          const label = hh === 0 ? "12 AM" : hh < 12 ? hh + " AM" : hh === 12 ? "12 PM" : (hh - 12) + " PM";
          return React.createElement("option", { key: hh, value: hh }, label);
        }))
      );
    } else if (step.form === "homeLocation") {
      formNode = React.createElement("input", Object.assign({
        key: "hlf", type: "text",
        value: tourHome,
        onChange: e => setTourHome(e.target.value),
        placeholder: "City, state, or neighborhood",
        style: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "var(--c-surface-raised)", fontSize: 13, color: "var(--c-text)", marginBottom: 14 }
      }, stopSwipeStart));
    }

    return React.createElement("div", {
      "data-tour-overlay": "1",
      style: { position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }
    },
      React.createElement("div", {
        key: "dim",
        className: "tour-dim" + (step.formStep === true ? " form-step" : ""),
        onClick: () => setTourMinimized(true),
        style: { pointerEvents: "auto", cursor: "pointer" }
      }),
      React.createElement("div", {
        key: "explore-hint",
        className: "tour-explore-hint",
        style: {
          position: "fixed", left: 0, right: 0,
          top: "50%", transform: "translateY(-50%)",
          display: "flex", justifyContent: "center",
          pointerEvents: "none", zIndex: 10000
        }
      },
        React.createElement("div", {
          style: {
            padding: "7px 14px", borderRadius: 999,
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(18px) saturate(180%)",
            WebkitBackdropFilter: "blur(18px) saturate(180%)",
            boxShadow: "0 8px 22px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.9)",
            fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
            color: "#4b5563", textTransform: "uppercase"
          }
        }, "👆 Tap anywhere to explore")
      ),
      React.createElement("div", Object.assign({
        className: "lg tour-tip",
        role: "dialog", "aria-modal": "false",
        "aria-labelledby": "tour-tip-title",
        style: {
          ...tipStyle,
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          borderRadius: 14,
          padding: "12px 14px 10px 14px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.04), 0 16px 36px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.08)",
          pointerEvents: "auto", touchAction: "pan-y", zIndex: 10000
        }
      }, null),
        React.createElement("button", Object.assign({
          type: "button", onClick: finishTour,
          "aria-label": "Exit tour", title: "Exit tour",
          style: {
            position: "absolute", top: 4, right: 4,
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0,
            background: "rgba(0,0,0,0.06)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 999, color: "#374151",
            fontSize: 22, lineHeight: 1, fontWeight: 600,
            cursor: "pointer", WebkitTapHighlightColor: "transparent"
          }
        }, stopSwipeStart), "×"),
        React.createElement("div", {
          id: "tour-tip-title",
          className: "tour-tip-title",
          style: { fontSize: 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.3, paddingRight: 40 }
        }, step.title),
        React.createElement("div", {
          className: "tour-tip-body",
          style: { fontSize: 12, lineHeight: 1.45, marginBottom: formNode ? 8 : 10 }
        }, step.body),
        formNode,
        gateBlocked && step.gateHint && React.createElement("div", {
          className: "tour-tip-swipe",
          style: { fontSize: 12, fontStyle: "italic", marginTop: -4, marginBottom: 10 }
        }, step.gateHint),
        isLast
          ? React.createElement("div", { style: { display: "flex", justifyContent: "center" } },
              React.createElement("button", Object.assign({
                onClick: advance,
                style: { background: "#2d5a2d", color: "#fff", border: "none", borderRadius: 7, padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }
              }, stopSwipeStart), "Got it")
            )
          : React.createElement("div", null,
              step.optionalActionKey && React.createElement("div", {
                style: { display: "flex", justifyContent: "center", marginBottom: 8 }
              },
                React.createElement("button", Object.assign({
                  onClick: runOptionalAction,
                  style: { background: "#fff", color: "#2d5a2d", border: "1px solid #2d5a2d", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }
                }, stopSwipeStart), step.optionalActionLabel || "Try it")
              ),
              React.createElement("div", {
                style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }
              },
                tourStep > 1
                  ? React.createElement("button", Object.assign({
                      onClick: goBack,
                      style: { background: "transparent", color: "#4b5563", border: "1px solid #e5e7eb", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 500, cursor: "pointer" }
                    }, stopSwipeStart), "Back")
                  : React.createElement("span", null),
                React.createElement("button", Object.assign({
                  onClick: advance,
                  disabled: gateBlocked,
                  style: {
                    background: gateBlocked ? "#d1d5db" : "#2d5a2d",
                    color: "#fff", border: "none",
                    borderRadius: 7, padding: "7px 16px", fontSize: 12,
                    fontWeight: 600,
                    cursor: gateBlocked ? "not-allowed" : "pointer",
                    opacity: gateBlocked ? 0.7 : 1
                  }
                }, stopSwipeStart), "Next")
              )
            )
      )
    );
  }

  window.TOUR_STEPS = TOUR_STEPS;
  window.TourOverlay = TourOverlay;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { TourOverlay, TOUR_STEPS };
  }
})();
