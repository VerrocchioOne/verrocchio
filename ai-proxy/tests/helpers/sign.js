// Test helper: generate an in-memory RS256 key pair and sign JWTs for
// the verifier under test. Exposes a mock JWKS that the verifier can
// fetch via an injected JWKS URL so unit tests never hit the real
// Google securetoken endpoint.

import { SignJWT, generateKeyPair, exportJWK } from "jose";

const KID = "test-key-1";
let cached = null;

async function init() {
  if (cached) return cached;
  const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = KID;
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";
  cached = { privateKey, publicJwk };
  return cached;
}

// Returns a signed JWT. Defaults mirror what Firebase emits so the
// happy path Just Works; override any claim to exercise rejection paths.
export async function signTestToken(opts = {}) {
  const { privateKey } = await init();
  const now = Math.floor(Date.now() / 1000);
  const aud = opts.aud ?? "real-project";
  const iss = opts.iss ?? `https://securetoken.google.com/${aud}`;
  const sub = opts.sub ?? "user-abc";
  const iat = opts.iat ?? now;
  const exp = opts.exp ?? now + 3600;
  const kid = opts.kid ?? KID;

  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(iss)
    .setAudience(aud)
    .setSubject(sub)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(privateKey);
}

// Returns the mock JWKS as a parsed JS object (the shape Google publishes).
export async function getMockJwks() {
  const { publicJwk } = await init();
  return { keys: [publicJwk] };
}

// Returns a data: URL serving the mock JWKS. createRemoteJWKSet from
// `jose` accepts any URL — pointing it at a data: URL lets us stub the
// network call without spinning up an HTTP server.
export async function getMockJwksUrl() {
  const jwks = await getMockJwks();
  const b64 = Buffer.from(JSON.stringify(jwks)).toString("base64");
  return `data:application/json;base64,${b64}`;
}
