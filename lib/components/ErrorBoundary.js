// lib/components/ErrorBoundary.js
//
// React error boundary that wraps the entire App tree. Catches
// render-time exceptions and replaces the broken subtree with a
// retry / reload card. Stamps a single-shot crash record to
// localStorage under "v-last-error" for diagnostics.
//
// Originally inline at index.html L1873-L1903 (31 LOC).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) {
    try { console.error("[verrocchio:boundary]", err, info && info.componentStack); } catch (_) {}
    try { localStorage.setItem("v-last-error", JSON.stringify({ msg: String(err && err.message || err), at: Date.now() })); } catch (_) {}
  }
  reset = () => { this.setState({ err: null }); };
  render() {
    if (!this.state.err) return this.props.children;
    return React.createElement("div", {
      style: { padding: 24, textAlign: "center", color: "var(--c-text, #222)",
               paddingTop: "calc(env(safe-area-inset-top) + 24px)" }
    },
      React.createElement("div", { style: { fontSize: 48, marginBottom: 12 } }, "⚠️"),
      React.createElement("h2", null, "Something went wrong"),
      React.createElement("p", { style: { opacity: 0.7, marginBottom: 16 } },
        "Your data is safe. Tap retry to continue."),
      React.createElement("button", {
        onClick: this.reset,
        style: { padding: "10px 20px", borderRadius: 10, border: "none",
                 background: "var(--accent, #2d5a2d)", color: "#fff", fontWeight: 600 }
      }, "Retry"),
      React.createElement("button", {
        onClick: () => location.reload(),
        style: { padding: "10px 20px", marginLeft: 8, borderRadius: 10,
                 border: "1px solid var(--c-border, #ccc)", background: "transparent" }
      }, "Reload app")
    );
  }
}

  window.ErrorBoundary = ErrorBoundary;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ErrorBoundary };
  }
})();
