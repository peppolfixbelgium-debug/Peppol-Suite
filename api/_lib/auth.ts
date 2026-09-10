import { timingSafeEqual } from "node:crypto";
import { getDb, requireEnv } from "./db";

const SESSION_COOKIE = "peppol_session";
const SESSION_DAYS = 30;
const TOKEN_TTL_MINUTES = 30;
const PASSWORD_ITERATIONS = 600_000;
const PASSWORD_ALGORITHM = "pbkdf2-sha256";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  plan_id: string;
  email_verified_at: string | null;
  disabled_at: string | null;
};

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===";
  const binary = atob(padded.slice(0, padded.length - (padded.length % 4)));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export function randomToken(bytes = 32): string {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64url(value);
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64url(new Uint8Array(digest));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `${PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] = encoded.split("$");
  if (algorithm !== PASSWORD_ALGORITHM || Number(iterationsRaw) !== PASSWORD_ITERATIONS || !saltRaw || !hashRaw) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromBase64url(saltRaw), iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  const expected = Buffer.from(fromBase64url(hashRaw));
  const actual = Buffer.from(new Uint8Array(bits));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function publicUser(row: UserRow) {
  return { id: row.id, email: row.email, name: row.name, role: row.role, planId: row.plan_id, emailVerified: Boolean(row.email_verified_at) };
}

export function getCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  const item = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

export function sessionCookie(token: string, maxAge = SESSION_DAYS * 86400): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  const sql = getDb();
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${tokenHash}, ${userId}, ${expiresAt})`;
  return token;
}

export async function revokeSession(request: Request): Promise<void> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  const sql = getDb();
  const hash = await sha256(token);
  await sql`UPDATE sessions SET revoked_at = now() WHERE token_hash = ${hash} AND revoked_at IS NULL`;
}

export async function getSessionUser(request: Request): Promise<UserRow | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const hash = await sha256(token);
  const sql = getDb();
  const rows = await sql<UserRow[]>`
    SELECT u.id, u.email, u.name, u.role, u.plan_id, u.email_verified_at, u.disabled_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hash} AND s.revoked_at IS NULL AND s.expires_at > now() AND u.disabled_at IS NULL
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function requireSession(request: Request): Promise<UserRow> {
  const user = await getSessionUser(request);
  if (!user) throw new Response(JSON.stringify({ error: "Authentication required." }), { status: 401, headers: { "content-type": "application/json" } });
  return user;
}

export function requireSameOrigin(request: Request): void {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return;
  const origin = request.headers.get("origin");
  if (!origin) return;
  const appUrl = requireEnv("APP_URL").replace(/\/$/, "");
  if (origin !== appUrl) throw new Response(JSON.stringify({ error: "Invalid request origin." }), { status: 403, headers: { "content-type": "application/json" } });
}

export function requestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
}

export async function securityEvent(request: Request, eventType: string, userId: string | null = null, metadata: Record<string, unknown> = {}) {
  const sql = getDb();
  await sql`INSERT INTO security_events (user_id, event_type, ip_address, user_agent, metadata) VALUES (${userId}, ${eventType}, ${requestIp(request)}, ${request.headers.get("user-agent")?.slice(0, 1000) ?? null}, ${JSON.stringify(metadata)}::jsonb)`;
}

export async function rateLimit(request: Request, bucket: string, limit: number, windowSeconds: number): Promise<void> {
  const ip = requestIp(request) ?? "unknown";
  const key = `${bucket}:${ip}`;
  const sql = getDb();
  const rows = await sql<{ request_count: number; window_started_at: string }[]>`SELECT request_count, window_started_at FROM rate_limits WHERE key = ${key}`;
  const now = Date.now();
  if (!rows[0] || now - new Date(rows[0].window_started_at).getTime() >= windowSeconds * 1000) {
    await sql`INSERT INTO rate_limits (key, window_started_at, request_count) VALUES (${key}, now(), 1) ON CONFLICT (key) DO UPDATE SET window_started_at = now(), request_count = 1`;
    return;
  }
  if (Number(rows[0].request_count) >= limit) throw new Response(JSON.stringify({ error: "Too many requests. Try again later." }), { status: 429, headers: { "content-type": "application/json", "retry-after": String(Math.ceil((windowSeconds * 1000 - (now - new Date(rows[0].window_started_at).getTime())) / 1000)) } });
  await sql`UPDATE rate_limits SET request_count = request_count + 1 WHERE key = ${key}`;
}

export async function issueAuthToken(userId: string, type: "email_verification" | "password_reset"): Promise<string> {
  const token = randomToken(32);
  const hash = await sha256(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60000).toISOString();
  const sql = getDb();
  await sql`UPDATE auth_tokens SET used_at = now() WHERE user_id = ${userId} AND type = ${type} AND used_at IS NULL`;
  await sql`INSERT INTO auth_tokens (user_id, type, token_hash, expires_at) VALUES (${userId}, ${type}, ${hash}, ${expiresAt})`;
  return token;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("EMAIL_FROM");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
}

export function appUrl(path: string): string {
  return `${requireEnv("APP_URL").replace(/\/$/, "")}${path}`;
}

export { SESSION_COOKIE };
