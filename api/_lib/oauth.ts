import { getDb, requireEnv } from "./db";
import { appUrl, createSession, publicUser, randomToken, securityEvent, sessionCookie, sha256 } from "./auth";

type Provider = "google" | "microsoft";

export async function startOAuth(provider: Provider): Promise<Response> {
  const clientId = requireEnv(provider === "google" ? "GOOGLE_CLIENT_ID" : "MICROSOFT_CLIENT_ID");
  const state = randomToken(32);
  const sql = getDb();
  await sql`INSERT INTO oauth_states (state_hash, provider, redirect_uri, expires_at) VALUES (${await sha256(state)}, ${provider}, ${appUrl(`/api/auth/oauth/${provider}/callback`)}, now() + interval '10 minutes')`;
  const url = new URL(provider === "google" ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", appUrl(`/api/auth/oauth/${provider}/callback`));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", provider === "google" ? "openid email profile" : "openid email profile User.Read");
  return new Response(null, { status: 302, headers: { location: url.toString() } });
}

export async function callbackOAuth(request: Request, provider: Provider): Promise<Response> {
  const params = new URL(request.url).searchParams; const code=params.get("code")??""; const state=params.get("state")??"";
  if(!code||!state)return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});
  const sql=getDb();const stateHash=await sha256(state);const states=await sql<{redirect_uri:string}[]>`SELECT redirect_uri FROM oauth_states WHERE state_hash=${stateHash} AND provider=${provider} AND expires_at>now() LIMIT 1`;if(!states[0])return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});await sql`DELETE FROM oauth_states WHERE state_hash=${stateHash}`;
  const clientId=requireEnv(provider==="google"?"GOOGLE_CLIENT_ID":"MICROSOFT_CLIENT_ID");const clientSecret=requireEnv(provider==="google"?"GOOGLE_CLIENT_SECRET":"MICROSOFT_CLIENT_SECRET");const tokenUrl=provider==="google"?"https://oauth2.googleapis.com/token":"https://login.microsoftonline.com/common/oauth2/v2.0/token";
  const tokenResponse=await fetch(tokenUrl,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:states[0].redirect_uri,grant_type:"authorization_code"})});if(!tokenResponse.ok)return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});const tokens=await tokenResponse.json() as {access_token?:string};if(!tokens.access_token)return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});
  const profileResponse=await fetch(provider==="google"?"https://openidconnect.googleapis.com/v1/userinfo":"https://graph.microsoft.com/oidc/userinfo",{headers:{authorization:`Bearer ${tokens.access_token}`}});if(!profileResponse.ok)return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});const profile=await profileResponse.json() as {sub?:string;email?:string;preferred_username?:string;name?:string};const providerId=profile.sub??"";const email=(profile.email??profile.preferred_username??"").trim().toLowerCase();if(!providerId||!email)return new Response(null,{status:302,headers:{location:"/login?error=oauth"}});
  const existing=await sql<any[]>`SELECT u.id,u.email,u.name,u.role,u.plan_id,u.email_verified_at,u.disabled_at FROM accounts a JOIN users u ON u.id=a.user_id WHERE a.provider=${provider} AND a.provider_account_id=${providerId} LIMIT 1`;let user=existing[0];if(!user){const byEmail=await sql<any[]>`SELECT id,email,name,role,plan_id,email_verified_at,disabled_at FROM users WHERE lower(email)=${email} LIMIT 1`;if(byEmail[0]){user=byEmail[0];await sql`INSERT INTO accounts(user_id,provider,provider_account_id,email) VALUES(${user.id},${provider},${providerId},${email}) ON CONFLICT DO NOTHING`;}else{const created=await sql<any[]>`INSERT INTO users(email,name,email_verified_at) VALUES(${email},${profile.name??null},now()) RETURNING id,email,name,role,plan_id,email_verified_at,disabled_at`;user=created[0];await sql`INSERT INTO accounts(user_id,provider,provider_account_id,email) VALUES(${user.id},${provider},${providerId},${email})`;}}
  if(user.disabled_at)return new Response(null,{status:302,headers:{location:"/login?error=disabled"}});const session=await createSession(user.id);await securityEvent(request,"oauth_signin",user.id,{provider});return new Response(null,{status:302,headers:{location:"/dashboard","set-cookie":sessionCookie(session)}});
}
