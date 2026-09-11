import { clearOAuthStateCookie, createSession, getCookie, getSessionUser, requireSameOrigin, securityEvent, sessionCookie } from "../../../_lib/auth.js";
import { createUserWithFreePlan, getDb, requireEnv } from "../../../_lib/db.js";
import { decideOAuthLink } from "../../../_lib/oauth-policy.js";
import { consumeOAuthState, oauthStateBindingValid, providerAccountId, verifyIdToken } from "../../[...path].js";

type JwtClaims = { sub?: string; email?: string; preferred_username?: string; name?: string; email_verified?: boolean };

function redirect(path: string, cookies: string[] = []) {
  const headers = new Headers({ location: path });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const params = new URL(request.url).searchParams;
    const code = params.get("code") ?? "";
    const state = params.get("state") ?? "";
    const stateCookie = getCookie(request, "peppol_oauth_state");
    const fail = (path = "/login?error=oauth") => redirect(path, [clearOAuthStateCookie()]);
    if (!code || !oauthStateBindingValid(state, stateCookie)) return fail();

    const sql = getDb();
    const stateRow = await consumeOAuthState(sql, state, "google");
    if (!stateRow) return fail();

    const clientId = requireEnv("GOOGLE_CLIENT_ID");
    const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: stateRow.redirect_uri, grant_type: "authorization_code" }),
    });
    if (!tokenResponse.ok) return fail();

    const tokens = await tokenResponse.json() as { access_token?: string; id_token?: string };
    if (!tokens.access_token || !tokens.id_token) return fail();

    let claims: JwtClaims;
    try { claims = await verifyIdToken("google", tokens.id_token, clientId, state); } catch { return fail(); }

    const accountId = providerAccountId("google", claims);
    const email = (claims.email ?? claims.preferred_username ?? "").trim().toLowerCase();
    if (!claims.sub || !email || claims.email_verified !== true) return fail("/login?error=oauth_profile");

    const existing = await sql<any[]>`SELECT u.id, u.email, u.name, u.role, u.plan_id, u.email_verified_at, u.disabled_at FROM accounts a JOIN users u ON u.id = a.user_id WHERE a.provider = ${"google"} AND a.provider_account_id = ${accountId} LIMIT 1`;
    let user = existing[0];
    let currentUserId: string | null = null;
    if (stateRow.user_id) {
      const current = await getSessionUser(request);
      if (!current || current.id !== stateRow.user_id) return fail("/login?error=oauth_link");
      currentUserId = current.id;
    }
    const byEmail = !stateRow.user_id && !user && email ? await sql<any[]>`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1` : [];
    const decision = decideOAuthLink(user?.id ?? null, byEmail[0]?.id ?? null, currentUserId);
    if (decision === "reject_already_linked") return fail("/dashboard?error=oauth_already_linked");
    if (decision === "link") {
      if (!currentUserId) return fail("/login?error=oauth_link");
      if (!user) await sql`INSERT INTO accounts (user_id, provider, provider_account_id, email) VALUES (${currentUserId}, ${"google"}, ${accountId}, ${email || null})`;
      if (!user) await securityEvent(request, "oauth_linked", currentUserId, { provider: "google" });
      return redirect("/dashboard", [clearOAuthStateCookie()]);
    }
    if (decision === "reject_existing_email") return fail("/login?error=account_exists");
    if (decision === "create") {
      user = await createUserWithFreePlan(sql, { email, name: claims.name ?? null, emailVerifiedAt: new Date().toISOString() });
      await sql`INSERT INTO accounts (user_id, provider, provider_account_id, email) VALUES (${user.id}, ${"google"}, ${accountId}, ${email})`;
    }
    if (!user || user.disabled_at) return fail("/login?error=disabled");

    const session = await createSession(user.id);
    await securityEvent(request, "oauth_signin", user.id, { provider: "google" });
    return redirect("/dashboard", [sessionCookie(session), clearOAuthStateCookie()]);
  } catch (error) {
    console.error("google_oauth_callback_error", { error: error instanceof Error ? error.message : "unknown" });
    return redirect("/login?error=oauth", [clearOAuthStateCookie()]);
  }
}
