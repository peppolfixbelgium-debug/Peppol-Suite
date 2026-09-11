import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { createUserWithFreePlan } from "../api/_lib/db.js";
import { oauthStateCookie } from "../api/_lib/auth.js";
import { authBoundary } from "../api/auth/[...path].js";

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
await testInvalidAuthResponseBoundary();
console.log("Authentication regression suite: PASS");
