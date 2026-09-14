import { getSessionUser, requireSameOrigin } from "../_lib/auth.js";
import { createCheckoutSession, type BillingInterval, type BillingPlan } from "../_lib/stripe.js";

type VercelRequest = { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined> };
type VercelResponse = { statusCode?: number; setHeader(name: string, value: string): VercelResponse; end(body?: string): void };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

function header(request: VercelRequest, name: string): string | null {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(", ") : value ?? null;
}

export async function handleCheckout(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  requireSameOrigin(request);
  const user = await getSessionUser(request);
  if (!user) return json({ error: "Authentication required." }, 401);
  const input = await request.json().catch(() => null) as { plan?: unknown; interval?: unknown } | null;
  if ((input?.plan !== "pro" && input?.plan !== "business") || (input?.interval !== "month" && input?.interval !== "year")) {
    return json({ error: "Invalid billing selection." }, 400);
  }
  try {
    const session = await createCheckoutSession({ userId: user.id, email: user.email, plan: input.plan as BillingPlan, interval: input.interval as BillingInterval });
    return json(session, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create Checkout Session." }, 503);
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const webRequest = new Request("https://${header(request, "host") ?? "localhost"}${(request as { url?: string }).url ?? "/"}", {
    method: request.method ?? "GET",
    headers: Object.fromEntries(Object.entries(request.headers).flatMap(([name, value]) => value == null ? [] : [[name, Array.isArray(value) ? value.join(", ") : value]])),
    body: request.method === "GET" || request.method === "HEAD" ? undefined : typeof request.body === "string" ? request.body : JSON.stringify(request.body ?? {}),
  });
  const result = await handleCheckout(webRequest);
  response.statusCode = result.status;
  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(await result.text());
}
