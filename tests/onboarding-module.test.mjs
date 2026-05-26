// Closure-surface smoke test for lib/views/Onboarding.js.
//
// Both onboarding entry paths in index.html (Path A: !hasSeenWelcome,
// Path B: hasSeenWelcome && !data.onboardingComplete) route through
// window.Onboarding after the v80 dedupe. This test pins the module's
// closure surface — if any identifier the component needs is missing
// (e.g. HT from constants.js, or a setter from callbacks), the call
// throws synchronously.
//
// Cited precedent: v76 HabitsView extraction shipped with 4 missing
// closures and crashed the Habits tab silently. This shape of test
// would have caught it within milliseconds.
//
// The IIFE in Onboarding.js bails early without window.React, so we
// stub the minimum surface before requiring the file. HT lives at
// script scope in the browser; constants.js exports it for Node so
// we hoist it onto globalThis to match the browser lexical env.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const mockReact = {
  createElement: (type, props, ...children) => ({ type, props, children })
};

globalThis.window = { React: mockReact, __deviceProfile: { profile: "desktop" } };
globalThis.React = mockReact;
globalThis.HT = require("../lib/constants.js").HT;

const { Onboarding } = require("../lib/views/Onboarding.js");

const makeProps = (overrides = {}) => ({
  data: { dailyRitual: {}, timeRanges: null, onboardingComplete: false },
  dispatch: () => {},
  deviceProfile: { profile: "desktop" },
  state: { onboardStep: 0, walkSlide: 0, onbIntent: "" },
  callbacks: {
    setOnboardStep: () => {},
    setWalkSlide: () => {},
    setOnbIntent: () => {},
    onFinish: () => {}
  },
  ...overrides
});

test("Onboarding module exposes a callable component function", () => {
  assert.equal(typeof Onboarding, "function", "window.Onboarding must be a function");
});

test("Onboarding renders step-0 carousel without throwing", () => {
  const props = makeProps({ state: { onboardStep: 0, walkSlide: 0, onbIntent: "" } });
  assert.doesNotThrow(() => Onboarding(props));
});

test("Onboarding renders step-1 balanced-life primer without throwing (needs HT)", () => {
  const props = makeProps({ state: { onboardStep: 1, walkSlide: 0, onbIntent: "" } });
  // Step 1 iterates over HT to render the seven area chips. If HT is
  // missing from the closure surface, this throws TypeError.
  assert.doesNotThrow(() => Onboarding(props));
});

test("Onboarding renders step-2 intent textarea without throwing", () => {
  const props = makeProps({ state: { onboardStep: 2, walkSlide: 0, onbIntent: "Some user intent" } });
  assert.doesNotThrow(() => Onboarding(props));
});

test("Onboarding survives the carousel sub-slide walk", () => {
  // walkSlide ranges 0..2; each slide pulls a different illustration
  // factory + body copy. A typo on any slide index would surface here.
  for (let i = 0; i < 3; i++) {
    const props = makeProps({ state: { onboardStep: 0, walkSlide: i, onbIntent: "" } });
    assert.doesNotThrow(() => Onboarding(props), `walkSlide ${i} should render`);
  }
});

test("Onboarding survives missing callbacks (defensive defaults)", () => {
  // The component installs no-op defaults for missing callbacks. This
  // pins that behavior — relevant if a callsite forgets a setter.
  const props = makeProps({ callbacks: {} });
  assert.doesNotThrow(() => Onboarding(props));
});

test("Onboarding survives missing state (defensive defaults)", () => {
  const props = makeProps({ state: {} });
  assert.doesNotThrow(() => Onboarding(props));
});
