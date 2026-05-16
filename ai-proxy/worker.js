// Verrocchio AI proxy — Cloudflare Worker that holds the Anthropic
// API key on the server side so the browser never sees it.
//
// Protects the endpoint with Firebase ID-token verification: the app
// sends `Authorization: Bearer <idToken>` from `auth.currentUser.
// getIdToken()`, this Worker verifies it against Google's published
// JWKS, and only then forwards the request to api.anthropic.com. That
// means the proxy can't be used as a free Anthropic endpoint by
// anyone who stumbles across the URL.
//
// Deploy:
//   cd ai-proxy
//   npm install
//   npx wrangler login
//   npx wrangler secret put ANTHROPIC_API_KEY   # paste your sk-ant key
//   # edit wrangler.toml: set FIREBASE_PROJECT_ID to your Firebase project
//   npx wrangler deploy
//   # copy the deployed *.workers.dev URL into index.html's AI_BACKEND_URL

import { jwtVerify, createRemoteJWKSet } from "jose";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
// Only models the app actually uses. Keeps an authenticated user from
// asking for 200k tokens of an expensive model on our bill.
const ALLOWED_MODELS = new Set([
  "claude-sonnet-4-20250514",
  "claude-haiku-4-5-20251001"
]);
const MAX_TOKENS_CAP = 2000;

export default {
  async fetch(request, env) {
    const reqOrigin = request.headers.get("Origin");
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(env, reqOrigin) });
    }
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, env, reqOrigin);
    }

    // Require a Firebase ID token. Without this check the Worker URL
    // is a public Anthropic proxy — anyone with the URL burns our key.
    const auth = request.headers.get("Authorization") || "";
    const m = auth.match(/^Bearer (.+)$/);
    if (!m) return json({ error: "missing_auth" }, 401, env, reqOrigin);
    try {
      await verifyFirebaseToken(m[1], env.FIREBASE_PROJECT_ID);
    } catch (e) {
      return json({ error: "invalid_auth", detail: String(e.message || e) }, 401, env, reqOrigin);
    }

    // Parse body. We don't trust the client to pass a sane model / token
    // count — validate both before forwarding.
    let body;
    try { body = await request.json(); }
    catch { return json({ error: "bad_json" }, 400, env, reqOrigin); }
    if (!ALLOWED_MODELS.has(body.model)) {
      return json({ error: "disallowed_model", model: body.model }, 400, env, reqOrigin);
    }
    if (typeof body.max_tokens !== "number" || body.max_tokens > MAX_TOKENS_CAP) {
      body.max_tokens = Math.min(body.max_tokens || 1000, MAX_TOKENS_CAP);
    }

    const resp = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });
    // Pass through Anthropic's status + body so the client can
    // distinguish 4xx / 5xx. Re-attach CORS headers since this is a
    // fresh Response object.
    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: { "Content-Type": "application/json", ...cors(env, reqOrigin) }
    });
  }
};

// ─── CORS ───────────────────────────────────────────────────────────
// Allowlist of origins that may call the proxy from a browser. Web build,
// Firebase Hosting fallback, and the Capacitor iOS shell all need entries.
const ALLOWED_ORIGINS = new Set([
  "https://verrocchio.app",
  "https://verrocchio-1b116.web.app",
  "https://verrocchio-1b116.firebaseapp.com",
  "capacitor://localhost"
]);

function cors(env, requestOrigin) {
  // If the caller's Origin is in our allowlist, echo it back so the
  // browser accepts the response. Otherwise fall back to the configured
  // primary origin (wrangler.toml ALLOWED_ORIGIN) or the production URL.
  // Vary: Origin ensures CDNs don't cache one origin's headers for another.
  const fallback = (env && env.ALLOWED_ORIGIN) || "https://verrocchio.app";
  const allowed = (requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)) ? requestOrigin : fallback;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function json(obj, status, env, requestOrigin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors(env, requestOrigin) }
  });
}

// ─── Firebase ID token verification ────────────────────────────────
// Delegates JWT signature + claim validation to `jose`. The library
// handles JWKS fetching + caching (`createRemoteJWKSet`), kid lookup,
// RS256 signature check, and exp/iat/iss/aud claim enforcement.
// The third `jwksUrl` arg is for tests — production calls default to
// Google's published Firebase JWKS endpoint.
const GOOGLE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const jwksCache = new Map();

function getJWKS(jwksUrl) {
  const key = jwksUrl || GOOGLE_JWKS_URL;
  let jwks = jwksCache.get(key);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(key));
    jwksCache.set(key, jwks);
  }
  return jwks;
}

async function verifyFirebaseToken(idToken, projectId, jwksUrl) {
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID not configured");
  const { payload } = await jwtVerify(idToken, getJWKS(jwksUrl), {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"]
  });
  return payload;
}

export { verifyFirebaseToken };
