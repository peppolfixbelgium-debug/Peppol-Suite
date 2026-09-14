export type BillingPlan = "pro" | "business";
export type BillingInterval = "month" | "year";

export const BILLING_PLANS: Record<
  BillingPlan,
  { monthlyDocumentUnits: number; monthlyBulkDocumentUnits: number }
> = {
  pro: { monthlyDocumentUnits: 100, monthlyBulkDocumentUnits: 500 },
  business: { monthlyDocumentUnits: 1000, monthlyBulkDocumentUnits: 10000 },
};

const PRICE_ENV: Record<`${BillingPlan}_${BillingInterval}`, string> = {
  pro_month: "STRIPE_PRICE_PRO_MONTHLY",
  pro_year: "STRIPE_PRICE_PRO_YEARLY",
  business_month: "STRIPE_PRICE_BUSINESS_MONTHLY",
  business_year: "STRIPE_PRICE_BUSINESS_YEARLY",
};

export function getStripePriceId(plan: BillingPlan, interval: BillingInterval): string {
  const envName = PRICE_ENV[`${plan}_${interval}`];
  const value = process.env[envName];
  if (!value) throw new Error(`Missing ${envName}`);
  if (!value.startsWith("price_")) throw new Error(`Invalid ${envName}`);
  return value;
}

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === "pro" || value === "business";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

export function billingMode(): "test" | "live" {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return "test";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  throw new Error("STRIPE_SECRET_KEY must be a Stripe test or live secret key");
}
