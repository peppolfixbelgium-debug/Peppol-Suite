import { getSessionUser, requireSameOrigin } from "../_lib/auth.js";
import { createPortalSession } from "../_lib/stripe.js";
import { getDb } from "../_lib/db.js";

type VercelRequest = { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined>; url?: string };
type VercelResponse = { statusCode?: number; setHeader(name: string, value: string): VercelResponse; end(body?: string): void };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export async function handlePortal(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  requireSameOrigin(request);
  const user = await getSessionUser(request);
  if (!user) return json({ error: "Authentication required." }, 401);
  const sql = getDb();
  const rows = await sql<{ stripe_customer_id: string }[]>`SELECT stripe_customer_id FROM billing_customers WHERE user_id=${user.id} LIMIT 1`;
  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) return json({ error: "No billing customer is available yet." }, 404);
  try {
    return json(await createPortalSession(customerId));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create Customer Portal session." }, 503);
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const headers = Object.fromEntries(Object.entries(request.headers).flatMap(([name, value]) => value == null ? [] : [[name, Array.isArray(value) ? value.join(", ") : value]]));
  const url = new URL(request.url ?? "/", `https://${headers.host ?? "localhost"}`).toString();
  const webRequest = new Request(url, { method: request.method ?? "GET", headers, body: request.method === "GET" || request.method === "HEAD" ? undefined : typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}) });
  const result = await handlePortal(webRequest);
  response.statusCode = result.status;
  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(await result.text());
}
