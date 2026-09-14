import { Readable } from "node:stream";
import { getDb, requireEnv } from "../_lib/db.js";
import { securityEvent } from "../_lib/auth.js";
import { verifyStripeSignature } from "../_lib/stripe.js";

type StripeRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  readable?: boolean;
  [key: string]: unknown;
};
type VercelResponse = { statusCode?: number; setHeader(name: string, value: string): VercelResponse; end(body?: string): void };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

function header(request: StripeRequest, name: string): string | null {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(", ") : value ?? null;
}

async function rawBody(request: StripeRequest): Promise<string> {
  const raw = request.rawBody;
  if (typeof raw === "string") return raw;
  if (Buffer.isBuffer(raw)) return raw.toString("utf8");
  if (typeof request.body === "string") return request.body;
  if (request.readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of request as unknown as AsyncIterable<Buffer | string>) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks).toString("utf8");
  }
  throw new Error("Stripe webhook raw body is unavailable.");
}

function planForEvent(event: Record<string, unknown>): "paid" | "business" | null {
  const object = event.data as { object?: Record<string, unknown> } | undefined;
  const metadata = object?.object?.metadata as Record<string, unknown> | undefined;
  const plan = metadata?.plan;
  if (plan === "business") return "business";
  if (plan === "pro") return "paid";
  return null;
}

function subscriptionStatus(value: unknown): "trialing" | "active" | "past_due" | "canceled" | "incomplete" {
  if (value === "trialing" || value === "active" || value === "past_due" || value === "canceled" || value === "incomplete") return value;
  return "incomplete";
}

export async function handleStripeWebhook(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing Stripe signature." }, 400);
  const payload = await request.text();
  const secret = requireEnv("STRIPE_WEBHOOK_SECRET");
  if (!verifyStripeSignature(payload, signature, secret)) return json({ error: "Invalid Stripe signature." }, 400);
  let event: Record<string, unknown>;
  try { event = JSON.parse(payload) as Record<string, unknown>; } catch { return json({ error: "Invalid Stripe event payload." }, 400); }
  if (event.livemode === true) return json({ error: "Live Stripe events are disabled in test-mode integration." }, 403);
  const eventId = typeof event.id === "string" ? event.id : "";
  const eventType = typeof event.type === "string" ? event.type : "";
  if (!eventId || !eventType) return json({ error: "Stripe event id/type is required." }, 400);
  const sql = getDb();
  const inserted = await sql<{ event_id: string }[]>`
    INSERT INTO stripe_events (event_id, event_type, livemode, payload)
    VALUES (${eventId}, ${eventType}, FALSE, ${JSON.stringify(event)}::jsonb)
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id
  `;
  if (!inserted[0]) return json({ received: true, duplicate: true });

  const data = event.data as { object?: Record<string, unknown> } | undefined;
  const object = data?.object ?? {};
  const userId = typeof object.metadata === "object" && object.metadata ? String((object.metadata as Record<string, unknown>).user_id ?? "") : "";
  const customerId = typeof object.customer === "string" ? object.customer : null;
  const subscriptionId = typeof object.subscription === "string" ? object.subscription : typeof object.id === "string" && eventType.startsWith("customer.subscription.") ? object.id : null;

  if (eventType === "checkout.session.completed" && userId && customerId) {
    await sql`
      INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES (${userId}, ${customerId})
      ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id=EXCLUDED.stripe_customer_id, updated_at=now()
    `;
    if (subscriptionId) {
      const plan = planForEvent(event) ?? "paid";
      await sql`
        INSERT INTO subscriptions (user_id, plan_id, provider, provider_subscription_id, stripe_customer_id, status)
        VALUES (${userId}, ${plan}, 'stripe', ${subscriptionId}, ${customerId}, 'active')
        ON CONFLICT (provider, provider_subscription_id) DO UPDATE SET stripe_customer_id=EXCLUDED.stripe_customer_id, updated_at=now()
      `;
      await sql`UPDATE users SET plan_id=${plan}, updated_at=now() WHERE id=${userId}`;
      await sql`INSERT INTO billing_audit_log (user_id,event_id,action,metadata) VALUES (${userId},${eventId},'checkout_completed',${JSON.stringify({ subscriptionId, customerId, plan })}::jsonb)`;
    }
  }

  if (eventType === "customer.subscription.created" || eventType === "customer.subscription.updated" || eventType === "customer.subscription.deleted") {
    const plan = planForEvent(event);
    const status = eventType === "customer.subscription.deleted" ? "canceled" : subscriptionStatus(object.status);
    const existing = subscriptionId ? await sql<{ user_id: string; plan_id: string }[]>`SELECT user_id,plan_id FROM subscriptions WHERE provider='stripe' AND provider_subscription_id=${subscriptionId} LIMIT 1` : [];
    const resolvedUserId = userId || existing[0]?.user_id || "";
    const resolvedPlan = plan ?? existing[0]?.plan_id ?? null;
    if (resolvedUserId && subscriptionId && resolvedPlan) {
      await sql`
        INSERT INTO subscriptions (user_id,plan_id,provider,provider_subscription_id,stripe_customer_id,status,current_period_start,current_period_end,cancel_at_period_end,stripe_price_id)
        VALUES (${resolvedUserId},${resolvedPlan},'stripe',${subscriptionId},${customerId},${status},to_timestamp(${Number(object.current_period_start ?? 0)}),to_timestamp(${Number(object.current_period_end ?? 0)}),${Boolean(object.cancel_at_period_end)},${typeof object.items === "object" ? null : null})
        ON CONFLICT (provider,provider_subscription_id) DO UPDATE SET
          plan_id=EXCLUDED.plan_id, stripe_customer_id=COALESCE(EXCLUDED.stripe_customer_id,subscriptions.stripe_customer_id), status=EXCLUDED.status,
          current_period_start=EXCLUDED.current_period_start, current_period_end=EXCLUDED.current_period_end,
          cancel_at_period_end=EXCLUDED.cancel_at_period_end, updated_at=now()
      `;
      if (status === "active" || status === "trialing") await sql`UPDATE users SET plan_id=${resolvedPlan},updated_at=now() WHERE id=${resolvedUserId}`;
      if (status === "canceled") await sql`UPDATE users SET plan_id='free',updated_at=now() WHERE id=${resolvedUserId}`;
      await sql`INSERT INTO billing_audit_log (user_id,event_id,action,metadata) VALUES (${resolvedUserId},${eventId},${eventType},${JSON.stringify({ subscriptionId,status,plan:resolvedPlan })}::jsonb)`;
    }
  }

  return json({ received: true });
}

export const config = { api: { bodyParser: false } };

export default async function handler(request: StripeRequest, response: VercelResponse): Promise<void> {
  try {
    const payload = await rawBody(request);
    const headers = Object.fromEntries(Object.entries(request.headers).flatMap(([name,value]) => value == null ? [] : [[name,Array.isArray(value) ? value.join(", ") : value]]));
    const webRequest = new Request(`https://${header(request,"host") ?? "localhost"}/api/stripe/webhook`, { method: "POST", headers, body: payload });
    const result = await handleStripeWebhook(webRequest);
    response.statusCode = result.status;
    result.headers.forEach((value,name) => response.setHeader(name,value));
    response.end(await result.text());
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Webhook processing failed." }));
  }
}
