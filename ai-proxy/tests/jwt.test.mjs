// Unit tests for the Worker's Firebase ID-token verifier.
// These tests inject a mock JWKS URL (data: URL) so the verifier never
// hits the real Google endpoint. The same `verifyFirebaseToken` is
// imported by the Cloudflare Worker default export — this is the
// contract under test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { signTestToken, getMockJwksUrl } from "./helpers/sign.js";
import { verifyFirebaseToken } from "../worker.js";

const PROJECT = "real-project";
let JWKS_URL;

// Resolve the mock JWKS URL once for all tests.
test.before(async () => {
  JWKS_URL = await getMockJwksUrl();
});

test("rejects token with wrong audience", async () => {
  // Pin iss to PROJECT so the only mismatch jose hits is `aud`.
  // (Without this the helper auto-derives iss from aud and the test
  // accidentally exercises the wrong-issuer path first.)
  const token = await signTestToken({
    aud: "wrong-project",
    iss: `https://securetoken.google.com/${PROJECT}`
  });
  await assert.rejects(
    () => verifyFirebaseToken(token, PROJECT, JWKS_URL),
    /audience|aud/
  );
});

test("rejects expired token", async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await signTestToken({
    aud: PROJECT,
    iat: now - 120,
    exp: now - 60
  });
  await assert.rejects(
    () => verifyFirebaseToken(token, PROJECT, JWKS_URL),
    /exp|expired/i
  );
});

test("rejects wrong issuer", async () => {
  const token = await signTestToken({
    aud: PROJECT,
    iss: "https://attacker.example/real-project"
  });
  await assert.rejects(
    () => verifyFirebaseToken(token, PROJECT, JWKS_URL),
    /iss|issuer/
  );
});

test("rejects malformed token", async () => {
  await assert.rejects(
    () => verifyFirebaseToken("not.a.jwt", PROJECT, JWKS_URL),
    /malformed|invalid|JWS|JWT/i
  );
});

test("accepts a valid token and returns the payload", async () => {
  const token = await signTestToken({ aud: PROJECT, sub: "user-123" });
  const payload = await verifyFirebaseToken(token, PROJECT, JWKS_URL);
  assert.equal(payload.aud, PROJECT);
  assert.equal(payload.sub, "user-123");
});
