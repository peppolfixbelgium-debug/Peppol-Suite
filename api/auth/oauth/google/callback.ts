import { clearOAuthStateCookie, createSession, getCookie, getSessionUser, requireSameOrigin, securityEvent, sessionCookie } from "../../../_lib/auth.js";
import { createUserWithFreePlan, getDb, requireEnv } from "../../../_lib/db.js";
import { decideOAuthLink } from "../../../_lib/oauth-policy.js";
import { consumeOAuthState, oauthStateBindingValid, providerAccountId, verifyIdToken } from "../../[...path].js";

type JwtClaims = { sub?: string; email?: string; preferred_username?: string; name?: string; email_verified?: boolean };

type Trace = { callback_received: boolean; state_validation_passed: boolean; state_consumed: boolean; token_exchange_passed: boolean; token_response_valid: boolean; id_token_validation_passed: boolean; google_profile_passed: boolean; user_account_passed: boolean; session_created: boolean; callback_success: boolean; failure_branch: string | null; };

function redirect(path: string, cookies: string[] = []) { const headers = new Headers({ location: path }); for (const cookie of cookies) headers.append("set-cookie", cookie); return new Response(null, { status: 302, headers }); }

export async function GET(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const trace: Trace = { callback_received: true, state_validation_passed: false, state_consumed: false, token_exchange_passed: false, token_response_valid: false, id_token_validation_passed: false, google_profile_passed: false, user_account_passed: false, session_created: false, callback_success: false, failure_branch: null };
  const emit = () => console.log("google_oauth_browser_discrepancy", { correlationId, ...trace });
  const fail = (branch: string, path = "/login?error=oauth") => { trace.failure_branch = branch; emit(); return redirect(path, [clearOAuthStateCookie()]); };
  try {
    const params = new URL(request.url).searchParams;
    const code = params.get("code") ?? "";
    const state = params.get("state") ?? "";
    const stateCookie = getCookie(request, "peppol_oauth_state");
    if (!code) return fail("missing_code");
    if (!oauthStateBindingValid(state, stateCookie)) return fail("state_binding");
    trace.state_validation_passed = true;
    const sql = getDb();
    const stateRow = await consumeOAuthState(sql, state, "google");
    if (!stateRow) return fail("state_not_found_or_expired");
    trace.state_consumed = true;
    const clientId = requireEnv("GOOGLE_CLIENT_ID");
    const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: stateRow.redirect_uri, grant_type: "authorization_code" }) });
    if (!tokenResponse.ok) return fail(`token_exchange_http_${tokenResponse.status}`);
    trace.token_exchange_passed = true;
    const tokens = await tokenResponse.json() as { access_token?: string; id_token?: string };
    if (!tokens.access_token || !tokens.id_token) return fail("token_response_missing_tokens");
    trace.token_response_valid = true;
    let claims: JwtClaims;
    try { claims = await verifyIdToken("google", tokens.id_token, clientId, state); } catch (error) { return fail(`id_token_validation_${error instanceof Error ? error.message : "unknown"}`); }
    trace.id_token_validation_passed = true;
    const accountId = providerAccountId("google", claims);
    const email = (claims.email ?? claims.preferred_username ?? "").trim().toLowerCase();
    if (!claims.sub || !email || claims.email_verified !== true) return fail("google_profile", "/login?error=oauth_profile");
    trace.google_profile_passed = true;
    const existing = await sql<any[]>`SELECT u.id, u.email, u.name, u.role, u.plan_id, u.email_verified_at, u.disabled_at FROM accounts a JOIN users u ON u.id = a.user_id WHERE a.provider = ${"google"} AND a.provider_account_id = ${accountId} LIMIT 1`;
    let user = existing[0];
    let currentUserId: string | null = null;
    if (stateRow.user_id) { const current = await getSessionUser(request); if (!current || current.id !== stateRow.user_id) return fail("oauth_link_session", "/login?error=oauth_link"); currentUserId = current.id; }
    const byEmail = !stateRow.user_id && !user && email ? await sql<any[]>`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1` : [];
    const decision = decideOAuthLink(user?.id ?? null, byEmail[0]?.id ?? null, currentUserId);
    if (decision === "reject_already_linked") return fail("reject_already_linked", "/dashboard?error=oauth_already_linked");
    if (decision === "link") { if (!currentUserId) return fail("link_without_session", "/login?error=oauth_link"); if (!user) await sql`INSERT INTO accounts (user_id, provider, provider_account_id, email) VALUES (${currentUserId}, ${"google"}, ${accountId}, ${email || null})`; trace.user_account_passed = true; trace.callback_success = true; emit(); return redirect("/dashboard", [clearOAuthStateCookie()]); }
    if (decision === "reject_existing_email") return fail("reject_existing_email", "/login?error=account_exists");
    if (decision === "create") { user = await createUserWithFreePlan(sql, { email, name: claims.name ?? null, emailVerifiedAt: new Date().toISOString() }); await sql`INSERT INTO accounts (user_id, provider, provider_account_id, email) VALUES (${user.id}, ${"google"}, ${accountId}, ${email})`; }
    if (!user || user.disabled_at) return fail("disabled", "/login?error=disabled");
    trace.user_account_passed = true;
    const session = await createSession(user.id);
    trace.session_created = true;
    await securityEvent(request, "oauth_signin", user.id, { provider: "google" });
    trace.callback_success = true;
    emit();
    return redirect("/dashboard", [sessionCookie(session), clearOAuthStateCookie()]);
  } catch (error) {
    trace.failure_branch = `unexpected_${error instanceof Error ? error.message : "unknown"}`;
    console.error("google_oauth_browser_discrepancy_unexpected", { correlationId, error: error instanceof Error ? error.message : "unknown" });
    emit();
    return redirect("/login?error=oauth", [clearOAuthStateCookie()]);
  }
}
