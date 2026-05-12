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
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(env) });
    }
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, 405, env);
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
// Verifies the three standard claims (exp, iss, aud) and the RSA
// signature using Google's published JWK set. Cached in memory per
// isolate so we don't refetch the key set on every request.
const keyCache = new Map();

async function verifyFirebaseToken(idToken, projectId) {
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID not configured");
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("malformed_token");
  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(b64UrlDecode(headerB64));
  const payload = JSON.parse(b64UrlDecode(payloadB64));

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) throw new Error("expired");
  if (typeof payload.iat !== "number" || payload.iat > now + 60) throw new Error("issued_in_future");
  if (payload.aud !== projectId) throw new Error("wrong_audience");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("wrong_issuer");
  if (!payload.sub || typeof payload.sub !== "string") throw new Error("missing_subject");
  if (header.alg !== "RS256") throw new Error("unexpected_alg");

  const key = await getGoogleSigningKey(header.kid);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = b64UrlToBytes(sigB64);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
  if (!ok) throw new Error("bad_signature");
  return payload;
}

async function getGoogleSigningKey(kid) {
  const cached = keyCache.get(kid);
  if (cached && cached.expires > Date.now()) return cached.key;
  // JWK endpoint (not the x509 one) — Web Crypto's importKey accepts
  // JWK directly; x509 certs need extra decoding.
  const resp = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  );
  if (!resp.ok) throw new Error("jwks_fetch_failed");
  const { keys } = await resp.json();
  const jwk = keys.find(k => k.kid === kid);
  if (!jwk) throw new Error("unknown_kid");
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  keyCache.set(kid, { key, expires: Date.now() + 60 * 60 * 1000 });
  return key;
}

function b64UrlDecode(s) {
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
}

function b64UrlToBytes(s) {
  const bin = b64UrlDecode(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
