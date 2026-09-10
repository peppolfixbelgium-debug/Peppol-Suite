import {
  appUrl, clearOAuthStateCookie, createSession, getSessionUser, getCookie, hashPassword, issueAuthToken, oauthStateCookie,
  publicUser, rateLimit, requireSameOrigin, requestIp, revokeSession, securityEvent, sendEmail, sessionCookie, sha256, verifyPassword,
} from "../_lib/auth";
import { getDb, requireEnv } from "../_lib/db";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

async function body(request: Request): Promise<Record<string, unknown>> {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
  return value as Record<string, unknown>;
}

function passwordInput(value: unknown): string {
  if (typeof value !== "string" || value.length < 12 || value.length > 1024) throw new Response(JSON.stringify({ error: "Password must be between 12 and 1024 characters." }), { status: 400 });
  return value;
}

function redirect(path: string, status = 302, cookies: string[] = []) {
  const headers = new Headers({ location: path });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status, headers });
}

async function signup(request: Request) {
  await rateLimit(request, "signup", 5, 3600);
  const input = await body(request);
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim().slice(0, 200) : "";
  const password = passwordInput(input.password);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  const sql = getDb();
  const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1`;
  if (existing[0]) return json({ error: "An account with this email already exists." }, 409);
  const passwordHash = await hashPassword(password);
  const rows = await sql<{ id: string }[]>`INSERT INTO users (email, name, password_hash) VALUES (${email}, ${name || null}, ${passwordHash}) RETURNING id`;
  const userId = rows[0].id;
  const token = await issueAuthToken(userId, "email_verification");
  const verifyUrl = appUrl(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  await sendEmail(email, "Verify your Peppol Suite email", `<p>Verify your email address to finish setting up your Peppol Suite account.</p><p><a href="${verifyUrl}">Verify email</a></p><p>This link expires in 30 minutes.</p>`);
  await securityEvent(request, "signup", userId);
  return json({ user: null, emailVerificationRequired: true }, 201);
}

async function signin(request: Request) {
  await rateLimit(request, "signin", 10, 900);
  const input = await body(request);
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = passwordInput(input.password);
  const sql = getDb();
  const rows = await sql<any[]>`SELECT id, email, name, role, plan_id, email_verified_at, disabled_at, password_hash FROM users WHERE lower(email) = ${email} LIMIT 1`;
  const user = rows[0];
  if (!user || !user.password_hash || user.disabled_at || !user.email_verified_at || !(await verifyPassword(password, user.password_hash))) {
    await securityEvent(request, "signin_failed", null, { email, ip: requestIp(request) });
    return json({ error: "Invalid email or password." }, 401);
  }
  const session = await createSession(user.id);
  await securityEvent(request, "signin", user.id);
  return json({ user: publicUser(user) }, 200, { "set-cookie": sessionCookie(session) });
}

async function signout(request: Request) {
  const user = await getSessionUser(request);
  await revokeSession(request);
  if (user) await securityEvent(request, "signout", user.id);
  return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });
}

async function session(request: Request) {
  const user = await getSessionUser(request);
  return json({ user: user ? publicUser(user) : null });
}

async function verify(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return new Response("Missing verification token.", { status: 400 });
  const sql = getDb();
  const hash = await sha256(token);
  const rows = await sql<{ user_id: string }[]>`UPDATE auth_tokens SET used_at = now() WHERE token_hash = ${hash} AND type = 'email_verification' AND used_at IS NULL AND expires_at > now() RETURNING user_id`;
  if (!rows[0]) return new Response("This verification link is invalid or expired.", { status: 400 });
  await sql`UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = ${rows[0].user_id}`;
  await securityEvent(request, "email_verified", rows[0].user_id);
  return new Response("Email verified. You can now return to Peppol Suite and sign in.", { headers: { "content-type": "text/plain; charset=utf-8" } });
}

async function resetRequest(request: Request) {
  await rateLimit(request, "password-reset", 5, 3600);
  const input = await body(request);
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const sql = getDb();
  const rows = await sql<{ id: string }[]>`SELECT id FROM users WHERE lower(email) = ${email} AND disabled_at IS NULL LIMIT 1`;
  if (rows[0]) {
    const token = await issueAuthToken(rows[0].id, "password_reset");
    const resetUrl = appUrl(`/reset-password?token=${encodeURIComponent(token)}`);
    await sendEmail(email, "Reset your Peppol Suite password", `<p>A password reset was requested for your account.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`);
    await securityEvent(request, "password_reset_requested", rows[0].id);
  }
  return json({ ok: true });
}

async function resetPassword(request: Request) {
  const input = await body(request);
  const token = typeof input.token === "string" ? input.token : "";
  const password = passwordInput(input.password);
  const hash = await sha256(token);
  const passwordHash = await hashPassword(password);
  const sql = getDb();
  const rows = await sql<{ user_id: string }[]>`
    WITH claimed AS (
      UPDATE auth_tokens
      SET used_at = now()
      WHERE token_hash = ${hash} AND type = 'password_reset' AND used_at IS NULL AND expires_at > now()
      RETURNING user_id
    ), changed AS (
      UPDATE users
      SET password_hash = ${passwordHash}, updated_at = now()
      FROM claimed
      WHERE users.id = claimed.user_id
      RETURNING users.id
    )
    SELECT id AS user_id FROM changed
  `;
  if (!rows[0]) return json({ error: "This reset link is invalid or expired." }, 400);
  await sql`UPDATE sessions SET revoked_at = now() WHERE user_id = ${rows[0].user_id} AND revoked_at IS NULL`;
  await securityEvent(request, "password_reset_completed", rows[0].user_id);
  return json({ ok: true });
}

async function oauthStart(request: Request, provider: "google" | "microsoft") {
  const clientId = requireEnv(provider === "google" ? "GOOGLE_CLIENT_ID" : "MICROSOFT_CLIENT_ID");
  const state = (await import("../_lib/auth")).randomToken(32);
  const hash = await sha256(state);
  const callback = appUrl(`/api/auth/oauth/${provider}/callback`);
  const sql = getDb();
  await sql`INSERT INTO oauth_states (state_hash, provider, redirect_uri, expires_at) VALUES (${hash}, ${provider}, ${callback}, now() + interval '10 minutes')`;
  const url = new URL(provider === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callback);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", provider === "google" ? "openid email profile" : "openid email profile User.Read");
  return redirect(url.toString(), 302, [oauthStateCookie(state)]);
}

async function oauthCallback(request: Request, provider: "google" | "microsoft") {
  const params = new URL(request.url).searchParams;
  const code = params.get("code") ?? "";
  const state = params.get("state") ?? "";
  const stateCookie = getCookie(request, "peppol_oauth_state");
  if (!code || !state || !stateCookie || stateCookie !== state) return redirect("/login?error=oauth", 302, [clearOAuthStateCookie()]);
  const sql = getDb();
  const stateHash = await sha256(state);
  const states = await sql<{ redirect_uri: string }[]>`DELETE FROM oauth_states WHERE state_hash = ${stateHash} AND provider = ${provider} AND expires_at > now() RETURNING redirect_uri`;
  if (!states[0]) return redirect("/login?error=oauth", 302, [clearOAuthStateCookie()]);
  const clientId = requireEnv(provider === "google" ? "GOOGLE_CLIENT_ID" : "MICROSOFT_CLIENT_ID");
  const clientSecret = requireEnv(provider === "google" ? "GOOGLE_CLIENT_SECRET" : "MICROSOFT_CLIENT_SECRET");
  const tokenUrl = provider === "google" ? "https://oauth2.googleapis.com/token" : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const tokenResponse = await fetch(tokenUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: states[0].redirect_uri, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) return redirect("/login?error=oauth", 302, [clearOAuthStateCookie()]);
  const tokens = await tokenResponse.json() as { access_token?: string };
  if (!tokens.access_token) return redirect("/login?error=oauth", 302, [clearOAuthStateCookie()]);
  const profileResponse = await fetch(provider === "google" ? "https://openidconnect.googleapis.com/v1/userinfo" : "https://graph.microsoft.com/oidc/userinfo", { headers: { authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) return redirect("/login?error=oauth", 302, [clearOAuthStateCookie()]);
  const profile = await profileResponse.json() as { sub?: string; email?: string; preferred_username?: string; name?: string };
  const providerId = profile.sub ?? "";
  const email = (profile.email ?? profile.preferred_username ?? "").trim().toLowerCase();
  if (!providerId || !email) return redirect("/login?error=oauth", 302, [clearOAuthStateCookie()]);
  const existing = await sql<any[]>`SELECT u.id, u.email, u.name, u.role, u.plan_id, u.email_verified_at, u.disabled_at FROM accounts a JOIN users u ON u.id = a.user_id WHERE a.provider = ${provider} AND a.provider_account_id = ${providerId} LIMIT 1`;
  let user = existing[0];
  if (!user) {
    const byEmail = await sql<any[]>`SELECT id, email, name, role, plan_id, email_verified_at, disabled_at FROM users WHERE lower(email) = ${email} LIMIT 1`;
    if (byEmail[0]) {
      user = byEmail[0];
      await sql`INSERT INTO accounts (user_id, provider, provider_account_id, email) VALUES (${user.id}, ${provider}, ${providerId}, ${email}) ON CONFLICT DO NOTHING`;
    } else {
      const created = await sql<any[]>`INSERT INTO users (email, name, email_verified_at) VALUES (${email}, ${profile.name ?? null}, now()) RETURNING id, email, name, role, plan_id, email_verified_at, disabled_at`;
      user = created[0];
      await sql`INSERT INTO accounts (user_id, provider, provider_account_id, email) VALUES (${user.id}, ${provider}, ${providerId}, ${email})`;
    }
  }
  if (user.disabled_at) return redirect("/login?error=disabled", 302, [clearOAuthStateCookie()]);
  const session = await createSession(user.id);
  await securityEvent(request, "oauth_signin", user.id, { provider });
  return redirect("/dashboard", 302, [sessionCookie(session), clearOAuthStateCookie()]);
}

export default async function handler(request: Request) {
  try {
    const path = new URL(request.url).pathname.replace(/^\/api\/auth\/?/, "").replace(/\/$/, "");
    if (request.method === "POST") requireSameOrigin(request);
    if (path === "signup" && request.method === "POST") return signup(request);
    if (path === "signin" && request.method === "POST") return signin(request);
    if (path === "signout" && request.method === "POST") return signout(request);
    if (path === "session" && request.method === "GET") return session(request);
    if (path === "verify" && request.method === "GET") return verify(request);
    if (path === "password-reset/request" && request.method === "POST") return resetRequest(request);
    if (path === "password-reset/complete" && request.method === "POST") return resetPassword(request);
    if (path === "oauth/google/start" && request.method === "GET") return oauthStart(request, "google");
    if (path === "oauth/google/callback" && request.method === "GET") return oauthCallback(request, "google");
    if (path === "oauth/microsoft/start" && request.method === "GET") return oauthStart(request, "microsoft");
    if (path === "oauth/microsoft/callback" && request.method === "GET") return oauthCallback(request, "microsoft");
    return json({ error: "Not found." }, 404);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("auth handler error", error);
    return json({ error: "Authentication service unavailable." }, 500);
  }
}
