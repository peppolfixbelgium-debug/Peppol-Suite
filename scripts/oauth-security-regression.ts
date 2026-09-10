import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { decideOAuthLink } from "../api/_lib/oauth-policy";
import { providerAccountId, verifyIdToken } from "../api/auth/[...path]";

const originalFetch = globalThis.fetch;
const encoder = new TextEncoder();
function base64url(value: Uint8Array | ArrayBuffer): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Buffer.from(bytes).toString("base64url");
}
function jwtPart(value: unknown): string {
  return base64url(encoder.encode(JSON.stringify(value)));
}

async function makeJwt(provider: "google" | "microsoft", overrides: Record<string, unknown> = {}) {
  const keyPair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const kid = provider === "google" ? "google-test-key" : "microsoft-test-key";
  publicJwk.kid = kid;
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    sub: provider === "google" ? "google-sub-123" : "microsoft-sub-123",
    iss: provider === "google" ? "https://accounts.google.com" : "https://login.microsoftonline.com/test-tenant/v2.0",
    aud: "client-test",
    exp: now + 600,
    nbf: now - 5,
    nonce: "nonce-test",
    email: "oauth-test@example.com",
    name: "OAuth Test",
    ...(provider === "google" ? { email_verified: true } : { tid: "test-tenant", oid: "object-123" }),
    ...overrides,
  };
  const header = jwtPart({ alg: "RS256", kid, typ: "JWT" });
  const payload = jwtPart(claims);
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPair.privateKey, encoder.encode(signingInput));
  return { token: `${signingInput}.${base64url(signature)}`, jwks: { keys: [publicJwk] }, claims };
}

async function testProviderValidation() {
  for (const provider of ["google", "microsoft"] as const) {
    const fixture = await makeJwt(provider);
    globalThis.fetch = async () => new Response(JSON.stringify(fixture.jwks), { status: 200, headers: { "content-type": "application/json" } });
    const claims = await verifyIdToken(provider, fixture.token, "client-test", "nonce-test");
    assert.equal(providerAccountId(provider, claims), provider === "google" ? "google-sub-123" : "test-tenant:object-123");
    await assert.rejects(() => verifyIdToken(provider, fixture.token, "wrong-audience", "nonce-test"));
    await assert.rejects(() => verifyIdToken(provider, fixture.token, "client-test", "wrong-nonce"));

    const expired = await makeJwt(provider, { exp: Math.floor(Date.now() / 1000) - 1 });
    globalThis.fetch = async () => new Response(JSON.stringify(expired.jwks), { status: 200 });
    await assert.rejects(() => verifyIdToken(provider, expired.token, "client-test", "nonce-test"));

    const badIssuer = await makeJwt(provider, { iss: "https://issuer.invalid.example" });
    globalThis.fetch = async () => new Response(JSON.stringify(badIssuer.jwks), { status: 200 });
    await assert.rejects(() => verifyIdToken(provider, badIssuer.token, "client-test", "nonce-test"));
  }

  const unverifiedGoogle = await makeJwt("google", { email_verified: false });
  globalThis.fetch = async () => new Response(JSON.stringify(unverifiedGoogle.jwks), { status: 200 });
  await assert.rejects(() => verifyIdToken("google", unverifiedGoogle.token, "client-test", "nonce-test"));

  const microsoftMissingIdentity = await makeJwt("microsoft", { oid: undefined, tid: undefined });
  globalThis.fetch = async () => new Response(JSON.stringify(microsoftMissingIdentity.jwks), { status: 200 });
  await assert.rejects(() => verifyIdToken("microsoft", microsoftMissingIdentity.token, "client-test", "nonce-test"));
}

function testPolicy() {
  assert.equal(decideOAuthLink("u1", "u1", null), "signin_existing");
  assert.equal(decideOAuthLink(null, null, null), "create");
  assert.equal(decideOAuthLink(null, "u1", null), "reject_existing_email");
  assert.equal(decideOAuthLink("u2", "u1", "u1"), "reject_already_linked");
  assert.equal(decideOAuthLink(null, "u2", "u1"), "link");
  assert.equal(decideOAuthLink("u1", "u1", "u1"), "link");
}

function runDatabaseRegression() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, "DATABASE_URL is required for the OAuth database regression suite");
  const sql = `
BEGIN;
INSERT INTO users (email, password_hash, email_verified_at) VALUES ('oauth-regression@example.test', 'synthetic-password-hash', now());
INSERT INTO users (email, email_verified_at) VALUES ('oauth-link-target@example.test', now());
INSERT INTO accounts (user_id, provider, provider_account_id, email)
  SELECT id, 'google', 'existing-google-sub', email FROM users WHERE email = 'oauth-regression@example.test';

DO $$
DECLARE first_user uuid; second_user uuid;
BEGIN
  SELECT user_id INTO first_user FROM accounts WHERE provider = 'google' AND provider_account_id = 'existing-google-sub';
  IF first_user IS NULL THEN RAISE EXCEPTION 'existing OAuth identity lookup failed'; END IF;
  SELECT id INTO second_user FROM users WHERE lower(email) = 'oauth-regression@example.test';
  IF second_user <> first_user THEN RAISE EXCEPTION 'same-email account lookup did not resolve to existing user'; END IF;
END $$;

INSERT INTO oauth_states (state_hash, provider, redirect_uri, user_id, expires_at)
  SELECT 'oauth-state-replay-test', 'google', 'https://example.test/callback', id, now() + interval '10 minutes'
  FROM users WHERE email = 'oauth-link-target@example.test';
DO $$
DECLARE first_state text; second_state text;
BEGIN
  DELETE FROM oauth_states WHERE state_hash = 'oauth-state-replay-test' AND provider = 'google' AND expires_at > now() RETURNING state_hash INTO first_state;
  IF first_state IS NULL THEN RAISE EXCEPTION 'first state consume failed'; END IF;
  DELETE FROM oauth_states WHERE state_hash = 'oauth-state-replay-test' AND provider = 'google' AND expires_at > now() RETURNING state_hash INTO second_state;
  IF second_state IS NOT NULL THEN RAISE EXCEPTION 'state replay was accepted'; END IF;
END $$;

INSERT INTO oauth_states (state_hash, provider, redirect_uri, user_id, expires_at)
  SELECT 'oauth-state-expired-test', 'microsoft', 'https://example.test/callback', id, now() - interval '1 minute'
  FROM users WHERE email = 'oauth-link-target@example.test';
DO $$
DECLARE expired_state text;
BEGIN
  DELETE FROM oauth_states WHERE state_hash = 'oauth-state-expired-test' AND provider = 'microsoft' AND expires_at > now() RETURNING state_hash INTO expired_state;
  IF expired_state IS NOT NULL THEN RAISE EXCEPTION 'expired state was accepted'; END IF;
END $$;

INSERT INTO accounts (user_id, provider, provider_account_id, email)
  SELECT id, 'microsoft', 'tenant-a:object-a', email FROM users WHERE email = 'oauth-link-target@example.test';
DO $$
DECLARE account_count integer; password_value text; state_user uuid; link_user uuid;
BEGIN
  SELECT id INTO link_user FROM users WHERE email = 'oauth-link-target@example.test';
  SELECT count(*)::int INTO account_count FROM accounts WHERE user_id = link_user;
  IF account_count <> 1 THEN RAISE EXCEPTION 'link user should have exactly one OAuth account'; END IF;
  SELECT password_hash INTO password_value FROM users WHERE id = link_user;
  IF password_value IS NOT NULL THEN RAISE EXCEPTION 'unlink safety fixture must have no password'; END IF;
  INSERT INTO oauth_states (state_hash, provider, redirect_uri, user_id, expires_at)
    VALUES ('oauth-link-binding-test', 'google', 'https://example.test/callback', link_user, now() + interval '10 minutes');
  SELECT user_id INTO state_user FROM oauth_states WHERE state_hash = 'oauth-link-binding-test';
  IF state_user <> link_user THEN RAISE EXCEPTION 'link state was not bound to authenticated user'; END IF;
END $$;

ROLLBACK;
`;
  execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-X", "--no-psqlrc", "--dbname", databaseUrl], { input: sql, stdio: ["pipe", "inherit", "inherit"] });
}

await testProviderValidation();
testPolicy();
runDatabaseRegression();
globalThis.fetch = originalFetch;
console.log("OAuth security regression suite passed against synthetic providers and disposable PostgreSQL");
