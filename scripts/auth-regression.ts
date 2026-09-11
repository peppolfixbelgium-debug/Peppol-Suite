import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { createUserWithFreePlan } from "../api/_lib/db.js";
import { oauthStateCookie } from "../api/_lib/auth.js";
import { authBoundary, consumeOAuthState, oauthStateBindingValid } from "../api/auth/[...path].js";

const migration = readFileSync("migrations/001_auth_database.sql", "utf8");
assert.match(migration, /'free', 'Free'/, "Migration must define the existing Free plan");
assert.match(migration, /plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES plans\(id\)/, "Users must reference the existing Free plan");
assert.match(migration, /email TEXT,/, "Accounts email column must be represented by the repository migration");
assert.match(migration, /redirect_uri TEXT NOT NULL,/, "OAuth state redirect_uri column must be represented by the repository migration");

function fakeSql(strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]> {
  const query = String.raw({ raw: strings }, ...values.map(String));
  if (query.includes("SELECT id FROM plans WHERE name = 'Free' LIMIT 1")) return Promise.resolve([{ id: "free" }]);
  if (query.includes("INSERT INTO users")) {
    return Promise.resolve([{
      id: `synthetic-${String(values[0])}`,
      email: String(values[0]),
      name: values[1] ?? null,
      role: "user",
      plan_id: String(values[3]),
      email_verified_at: values[4] ?? null,
      disabled_at: null,
    }]);
  }
  throw new Error(`Unexpected SQL in auth regression: ${query}`);
}

async function testFreePlanAssignment() {
  const signupUser = await createUserWithFreePlan(fakeSql, {
    email: "auth-signup@example.test",
    name: "Email Signup Regression",
    passwordHash: "synthetic-password-hash",
  });
  assert.equal(signupUser.plan_id, "free", "Email signup must receive the existing Free plan");

  const googleUser = await createUserWithFreePlan(fakeSql, {
    email: "auth-google@example.test",
    name: "Google OAuth Regression",
    emailVerifiedAt: new Date().toISOString(),
  });
  assert.equal(googleUser.plan_id, "free", "First-time Google OAuth user creation must receive the existing Free plan");
  assert.ok(googleUser.email_verified_at, "Google-created user must retain verified email behavior");
}

function testOAuthStateCookieAttributes() {
  process.env.NODE_ENV = "production";
  const cookie = oauthStateCookie("test-state");
  const response = new Response(null, { status: 302, headers: { location: "https://accounts.google.com/" } });
  response.headers.append("set-cookie", cookie);
  assert.match(cookie, /^peppol_oauth_state=test-state;/, "OAuth state cookie must use the expected name and encoded state");
  assert.match(cookie, /(?:^|; )Path=\//, "OAuth state cookie must be host-wide so the callback path always matches");
  assert.match(cookie, /(?:^|; )Max-Age=600(?:;|$)/, "OAuth state cookie must remain available for the OAuth round trip");
  assert.match(cookie, /(?:^|; )HttpOnly(?:;|$)/, "OAuth state cookie must remain inaccessible to page scripts");
  assert.match(cookie, /(?:^|; )SameSite=Lax(?:;|$)/, "OAuth state cookie must be sent on Google's top-level GET callback");
  assert.match(cookie, /(?:^|; )Secure(?:;|$)/, "Production OAuth state cookie must require HTTPS");
  assert.equal(response.headers.get("set-cookie"), cookie, "Web Response must preserve the OAuth state Set-Cookie header");
}

async function testOAuthStateFallbackAndSingleUse() {
  type Row = { redirect_uri: string; user_id: string | null; expiresAt: number; consumed: boolean };
  const states = new Map<string, Row>();
  const sql = (strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]> => {
    const stateHash = String(values[0]);
    const row = states.get(stateHash);
    if (!row || row.consumed || row.expiresAt <= Date.now()) return Promise.resolve([]);
    row.consumed = true;
    return Promise.resolve([{ redirect_uri: row.redirect_uri, user_id: row.user_id }]);
  };

  const validState = "synthetic-random-oauth-state";
  const validHash = await (await import("../api/_lib/auth.js")).sha256(validState);
  states.set(validHash, { redirect_uri: "https://peppol-suite.vercel.app/api/auth/oauth/google/callback", user_id: null, expiresAt: Date.now() + 60_000, consumed: false });

  assert.equal(oauthStateBindingValid(validState, validState), true, "Cookie + matching DB state must pass the binding gate");
  assert.ok(await consumeOAuthState(sql, validState, "google"), "Cookie + matching DB state must be consumable");

  const noCookieState = "synthetic-no-cookie-state";
  const noCookieHash = await (await import("../api/_lib/auth.js")).sha256(noCookieState);
  states.set(noCookieHash, { redirect_uri: "https://peppol-suite.vercel.app/api/auth/oauth/google/callback", user_id: null, expiresAt: Date.now() + 60_000, consumed: false });
  assert.equal(oauthStateBindingValid(noCookieState, null), true, "Missing auxiliary cookie must not reject a valid DB state");
  assert.ok(await consumeOAuthState(sql, noCookieState, "google"), "Valid DB state must be consumable without the auxiliary cookie");

  assert.equal(oauthStateBindingValid("wrong-state", "expected-state"), false, "Wrong returned state must be rejected when the cookie is present");

  const expiredState = "synthetic-expired-state";
  const expiredHash = await (await import("../api/_lib/auth.js")).sha256(expiredState);
  states.set(expiredHash, { redirect_uri: "https://peppol-suite.vercel.app/api/auth/oauth/google/callback", user_id: null, expiresAt: Date.now() - 1, consumed: false });
  assert.equal(await consumeOAuthState(sql, expiredState, "google"), null, "Expired DB state must be rejected");

  const consumedState = "synthetic-consumed-state";
  const consumedHash = await (await import("../api/_lib/auth.js")).sha256(consumedState);
  states.set(consumedHash, { redirect_uri: "https://peppol-suite.vercel.app/api/auth/oauth/google/callback", user_id: null, expiresAt: Date.now() + 60_000, consumed: true });
  assert.equal(await consumeOAuthState(sql, consumedState, "google"), null, "Consumed DB state must be rejected");

  const reusableState = "synthetic-reuse-state";
  const reusableHash = await (await import("../api/_lib/auth.js")).sha256(reusableState);
  states.set(reusableHash, { redirect_uri: "https://peppol-suite.vercel.app/api/auth/oauth/google/callback", user_id: null, expiresAt: Date.now() + 60_000, consumed: false });
  assert.ok(await consumeOAuthState(sql, reusableState, "google"), "First use of a valid state must succeed");
  assert.equal(await consumeOAuthState(sql, reusableState, "google"), null, "OAuth state must not be reusable");
}

async function testInvalidAuthResponseBoundary() {
  const invalidJson = await authBoundary(
    new Request("http://localhost/api/auth/signup", { method: "POST" }),
    async () => { throw new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { "content-type": "application/json" } }); },
  );
  assert.equal(invalidJson.status, 400, "Invalid JSON validation must return HTTP 400, not 500");
  assert.deepEqual(await invalidJson.json(), { error: "Invalid JSON body." });

  const shortPassword = await authBoundary(
    new Request("http://localhost/api/auth/signin", { method: "POST" }),
    async () => { throw new Response(JSON.stringify({ error: "Password must be between 12 and 1024 characters." }), { status: 400, headers: { "content-type": "application/json" } }); },
  );
  assert.equal(shortPassword.status, 400, "Invalid password validation must return HTTP 400, not 500");
  assert.deepEqual(await shortPassword.json(), { error: "Password must be between 12 and 1024 characters." });
}

await testFreePlanAssignment();
testOAuthStateCookieAttributes();
await testOAuthStateFallbackAndSingleUse();
await testInvalidAuthResponseBoundary();
console.log("Authentication regression suite: PASS");
