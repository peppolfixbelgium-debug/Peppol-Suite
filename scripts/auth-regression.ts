import { strict as assert } from "node:assert";
import { createUserWithFreePlan, getDb } from "../api/_lib/db.js";
import { POST } from "../api/auth/[...path].js";

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required for the authentication regression suite");
const appUrl = process.env.APP_URL ?? "http://localhost:4173";
const sql = getDb();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emailUser = `auth-signup-${suffix}@example.test`;
const googleUser = `auth-google-${suffix}@example.test`;

async function testFreePlanAssignment() {
  const planRows = await sql<{ id: string }[]>`SELECT id FROM plans WHERE name = 'Free' LIMIT 1`;
  assert.equal(planRows.length, 1, "The existing Free plan must be present");
  const freePlanId = planRows[0].id;

  const signupUser = await createUserWithFreePlan(sql, {
    email: emailUser,
    name: "Email Signup Regression",
    passwordHash: "synthetic-password-hash",
  });
  assert.equal(signupUser.plan_id, freePlanId, "Email signup must receive the existing Free plan");

  const googleUserRow = await createUserWithFreePlan(sql, {
    email: googleUser,
    name: "Google OAuth Regression",
    emailVerifiedAt: new Date().toISOString(),
  });
  assert.equal(googleUserRow.plan_id, freePlanId, "First-time Google OAuth user creation must receive the existing Free plan");
  assert.ok(googleUserRow.email_verified_at, "Google-created user must retain verified email behavior");
}

async function testInvalidAuthInputStatus() {
  const invalidJson = await POST(new Request(`${appUrl}/api/auth/signup`, {
    method: "POST",
    headers: { origin: appUrl, "content-type": "application/json" },
    body: "not-json",
  }));
  assert.equal(invalidJson.status, 400, "Invalid JSON must return HTTP 400, not 500");
  assert.deepEqual(await invalidJson.json(), { error: "Invalid JSON body." });

  const shortPassword = await POST(new Request(`${appUrl}/api/auth/signin`, {
    method: "POST",
    headers: { origin: appUrl, "content-type": "application/json" },
    body: JSON.stringify({ email: "invalid@example.test", password: "short" }),
  }));
  assert.equal(shortPassword.status, 400, "Invalid password input must return HTTP 400, not 500");
  assert.deepEqual(await shortPassword.json(), { error: "Password must be between 12 and 1024 characters." });
}

try {
  await testFreePlanAssignment();
  await testInvalidAuthInputStatus();
  console.log("Authentication regression suite: PASS");
} finally {
  await sql`DELETE FROM users WHERE email IN (${emailUser}, ${googleUser})`;
}
