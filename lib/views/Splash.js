// lib/views/Splash.js
//
// Ink splash: pyramid blocks stack, then the Playfair Display "V" is
// uncovered by two pen strokes. Wordmark + tagline land after the V is
// complete. See the .splashv4 CSS block for full stroke timing.
//
// Wave 4.5.1. Originally inline at index.html L10953-L10988.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function Splash({ data, dispatch, deviceProfile, state, callbacks }) {
    const s = state || {};
    const splashAnimKey = s.splashAnimKey || 0;
    const splashQuick = !!s.splashQuick;

    return React.createElement("div", {
      className: "splashv4" + (splashQuick ? " splashv4-quick" : ""),
      key: "splash-" + splashAnimKey
    },
      React.createElement("div", { className: "stage" },
        React.createElement("div", { className: "brand-wordmark", "aria-label": "Verrocchio" },
          ["V","e","r","r","o","c","c","h","i","o"].map((ch, i) =>
            React.createElement("span", {
              key: i,
              className: "wm-letter wm-" + (i + 1),
              "aria-hidden": "true"
            }, ch)
          )
        ),
        React.createElement("div", { className: "pyramid" },
          React.createElement("div", { className: "block b1" }),
          React.createElement("div", { className: "block b2" }),
          React.createElement("div", { className: "block b3" }),
          React.createElement("div", { className: "block b4" }),
          React.createElement("div", { className: "block b5" }),
          React.createElement("div", { className: "block b6" }),
          React.createElement("div", { className: "block b7" }),
          React.createElement("div", { className: "block b8" }),
          React.createElement("div", { className: "block b9" }),
          React.createElement("div", { className: "block b10" })
        )
      )
    );
  }

  window.Splash = Splash;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { Splash };
  }
})();
