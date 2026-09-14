import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "./db.js";

export type BillingPlan = "pro" | "business";
export type BillingInterval = "month" | "year";

const STRIPE_API = "https://api.stripe.com/v1";

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripePriceId(plan: BillingPlan, interval: BillingInterval): string {
  const key = plan === "pro"
    ? interval === "month" ? "STRIPE_PRICE_PRO_MONTHLY" : "STRIPE_PRICE_PRO_YEARLY"
    : interval === "month" ? "STRIPE_PRICE_BUSINESS_MONTHLY" : "STRIPE_PRICE_BUSINESS_YEARLY";
  return requireEnv(key);
}

export function stripeMode(): "test" | "live" {
  const key = requireEnv("STRIPE_SECRET_KEY");
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  throw new Error("STRIPE_SECRET_KEY must be a Stripe test or live key.");
}

export function assertTestMode(): void {
  if (stripeMode() !== "test") throw new Error("Stripe test-mode endpoint requires a test secret key.");
}

async function stripeRequest(path: string, body: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${requireEnv("STRIPE_SECRET_KEY")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = typeof payload?.error === "object" && payload.error && "message" in payload.error
      ? String((payload.error as { message?: unknown }).message)
      : `Stripe returned ${response.status}.`;
    throw new Error(message);
  }
  return payload ?? {};
}

export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  plan: BillingPlan;
  interval: BillingInterval;
}): Promise<{ id: string; url: string }> {
  assertTestMode();
  const appUrl = requireEnv("APP_URL").replace(/\/$/, "");
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", stripePriceId(input.plan, input.interval));
  body.set("line_items[0][quantity]", "1");
  body.set("success_url", `${appUrl}/pricing?checkout=success`);
  body.set("cancel_url", `${appUrl}/pricing?checkout=cancelled`);
  body.set("customer_email", input.email);
  body.set("client_reference_id", input.userId);
  body.set("metadata[user_id]", input.userId);
  body.set("metadata[plan]", input.plan);
  body.set("metadata[interval]", input.interval);
  body.set("subscription_data[metadata][user_id]", input.userId);
  body.set("subscription_data[metadata][plan]", input.plan);
  body.set("subscription_data[metadata][interval]", input.interval);
  const session = await stripeRequest("/checkout/sessions", body);
  if (typeof session.id !== "string" || typeof session.url !== "string") throw new Error("Stripe did not return a Checkout Session URL.");
  return { id: session.id, url: session.url };
}

export async function createPortalSession(customerId: string): Promise<{ id: string; url: string }> {
  assertTestMode();
  const appUrl = requireEnv("APP_URL").replace(/\/$/, "");
  const body = new URLSearchParams({ customer: customerId, return_url: `${appUrl}/pricing` });
  const session = await stripeRequest("/billing_portal/sessions", body);
  if (typeof session.id !== "string" || typeof session.url !== "string") throw new Error("Stripe did not return a Customer Portal URL.");
  return { id: session.id, url: session.url };
}

export function verifyStripeSignature(payload: string, signature: string, secret: string, toleranceSeconds = 300, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const timestampPart = signature.split(",").find((part) => part.startsWith("t="));
  const signatures = signature.split(",").filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestampPart || signatures.length === 0) return false;
  const timestamp = Number(timestampPart.slice(2));
  if (!Number.isInteger(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return signatures.some((candidate) => {
    if (!/^[0-9a-f]{64}$/i.test(candidate)) return false;
    const actual = Buffer.from(candidate, "hex");
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  });
}
