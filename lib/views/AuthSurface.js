// lib/views/AuthSurface.js
//
// Sign-in / sign-up surface shown when authUser === null && !demoMode.
//
// Wave 4.5.3. Originally inline at index.html L10837-L10938.

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  function AuthSurface({ data, dispatch, deviceProfile, state, callbacks }) {
    const s = state || {};
    const cb = callbacks || {};
    const authMode = s.authMode || "login";
    const authEmail = s.authEmail || "";
    const authPass = s.authPass || "";
    const showAuthPass = !!s.showAuthPass;
    const authErr = s.authErr;
    const authBusy = !!s.authBusy;
    const showDemoUI = !!s.showDemoUI;
    const setAuthEmail = cb.setAuthEmail || (() => {});
    const setAuthPass = cb.setAuthPass || (() => {});
    const setShowAuthPass = cb.setShowAuthPass || (() => {});
    const setAuthMode = cb.setAuthMode || (() => {});
    const setAuthErr = cb.setAuthErr || (() => {});
    const doAuth = cb.doAuth || (() => {});
    const doForgotPassword = cb.doForgotPassword || (() => {});
    const signInAsDemoUser = cb.signInAsDemoUser || (() => {});
    const onboardShell = cb.onboardShell;
    const renderIcon = cb.renderIcon || (() => null);

    if (!onboardShell) return null;

    const isSignup = authMode === "signup";
    return onboardShell([
      React.createElement("div", { key: "icn", style: { display: "flex", justifyContent: "center", marginBottom: 10 } }, renderIcon(96)),
      React.createElement("div", { key: "lg", style: { fontFamily: "'Playfair Display',Georgia,'Times New Roman',serif", fontSize: 36, fontWeight: 700, letterSpacing: ".005em", color: "#2d5a2d", lineHeight: 1, marginBottom: 4 } }, "Verrocchio"),
      React.createElement("div", { key: "tag", style: { fontSize: 13, color: "#6b7280", marginBottom: 24, fontStyle: "italic" } }, "Achieve Anything"),
      React.createElement("div", { key: "ttl", style: { fontSize: 18, fontWeight: 700, color: "var(--c-text)", marginBottom: 16 } }, isSignup ? "Create your account" : "Welcome Back"),
      React.createElement("input", {
        key: "email", type: "email",
        value: authEmail,
        onChange: e => setAuthEmail(e.target.value),
        placeholder: "Email",
        autoComplete: "email",
        onKeyDown: e => { if (e.key === "Enter") doAuth(); },
        style: { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 10, outline: "none", boxSizing: "border-box", background: "#fff", color: "var(--c-text)" }
      }),
      React.createElement("div", { key: "passwrap", style: { position: "relative", marginBottom: 10 } },
        React.createElement("input", {
          type: showAuthPass ? "text" : "password",
          value: authPass,
          onChange: e => setAuthPass(e.target.value),
          placeholder: "Password",
          autoComplete: isSignup ? "new-password" : "current-password",
          onKeyDown: e => { if (e.key === "Enter") doAuth(); },
          style: { width: "100%", padding: "10px 36px 10px 12px", fontSize: 14, border: "1px solid #e5e7eb", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#fff", color: "var(--c-text)" }
        }),
        React.createElement("button", {
          type: "button",
          onClick: () => setShowAuthPass(!showAuthPass),
          "aria-label": showAuthPass ? "Hide password" : "Show password",
          style: { position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", fontSize: 16, padding: 0, color: "var(--c-text-faint)" }
        }, showAuthPass ? "🙈" : "👁")
      ),
      isSignup ? React.createElement("p", { key: "passhelp", style: { fontSize: 11, color: "var(--c-text-faint)", marginTop: -4, marginBottom: 8 } }, "At least 8 characters.") : null,
      authErr ? React.createElement("div", { key: "err", style: { fontSize: 12, color: "var(--c-tint-danger-fg)", background: "var(--c-tint-danger-bg)", border: "1px solid var(--c-tint-danger-border)", borderRadius: 6, padding: "6px 10px", marginBottom: 10, textAlign: "left" } }, authErr) : null,
      React.createElement("button", {
        key: "sub",
        onClick: doAuth,
        disabled: authBusy,
        style: { width: "100%", padding: "10px 12px", fontSize: 14, fontWeight: 600, color: "#fff", background: authBusy ? "#6b7280" : "#2d5a2d", border: "none", borderRadius: 8, cursor: authBusy ? "default" : "pointer", marginBottom: 12 }
      }, authBusy ? "Please wait..." : (isSignup ? "Create account" : "Log in")),
      !isSignup ? React.createElement("button", {
        key: "forgot",
        onClick: doForgotPassword,
        disabled: authBusy,
        style: { background: "transparent", border: "none", padding: 0, color: "var(--c-text-faint)", fontSize: 12, textDecoration: "underline", cursor: authBusy ? "default" : "pointer", marginTop: 0, marginBottom: 8, display: "block" }
      }, "Forgot password?") : null,
      isSignup ? React.createElement("p", {
        key: "consent",
        style: { fontSize: 11, color: "var(--c-text-faint)", marginTop: 8, marginBottom: 8, textAlign: "center", lineHeight: 1.5 }
      },
        "By signing up you agree to our ",
        React.createElement("a", { href: "/privacy", target: "_blank", rel: "noopener noreferrer", style: { color: "var(--accent)", textDecoration: "underline" } }, "Privacy Policy"),
        " and ",
        React.createElement("a", { href: "/support", target: "_blank", rel: "noopener noreferrer", style: { color: "var(--accent)", textDecoration: "underline" } }, "Support"),
        "."
      ) : null,
      React.createElement("div", { key: "tog", style: { fontSize: 12, color: "#6b7280" } },
        isSignup ? "Already have an account? " : "New here? ",
        React.createElement("span", {
          onClick: () => { setAuthErr(""); setAuthMode(isSignup ? "login" : "signup"); },
          style: { color: "var(--c-text)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }
        }, isSignup ? "Log in" : "Create an account")
      ),
      showDemoUI && React.createElement("div", {
        key: "demo-divider",
        style: { display: "flex", alignItems: "center", gap: 8, margin: "18px 0 12px", color: "#9ca3af", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }
      },
        React.createElement("div", { style: { flex: 1, height: 1, background: "#e5e7eb" } }),
        "or",
        React.createElement("div", { style: { flex: 1, height: 1, background: "#e5e7eb" } })
      ),
      showDemoUI && React.createElement("button", {
        key: "demo-btn",
        onClick: () => signInAsDemoUser("alex.morning@demo.verrocchio.app"),
        disabled: authBusy,
        style: { width: "100%", padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#2d5a2d", background: "#fff", border: "1px solid #2d5a2d", borderRadius: 8, cursor: authBusy ? "default" : "pointer", opacity: authBusy ? 0.6 : 1 }
      }, "Try a demo account"),
      showDemoUI && React.createElement("div", {
        key: "demo-help",
        style: { fontSize: 10, color: "#9ca3af", marginTop: 6, lineHeight: 1.5 }
      }, "Loads a sample account with two weeks of habits, goals, and to-dos. Re-seeds fresh content on every tap.")
    ]);
  }

  window.AuthSurface = AuthSurface;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { AuthSurface };
  }
})();
