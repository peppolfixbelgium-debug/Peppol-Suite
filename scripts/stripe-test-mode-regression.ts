import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { verifyStripeSignature } from "../api/_lib/stripe.js";

const payload = JSON.stringify({ id: "evt_test_123", type: "checkout.session.completed", livemode: false });
const secret = "whsec_regression_secret";
const timestamp = 1_700_000_000;
const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");

assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, 300, timestamp), true, "valid Stripe signature must verify");
assert.equal(verifyStripeSignature(payload + "x", `t=${timestamp},v1=${signature}`, secret, 300, timestamp), false, "payload mutation must invalidate signature");
assert.equal(verifyStripeSignature(payload, `t=${timestamp - 301},v1=${signature}`, secret, 300, timestamp), false, "stale Stripe signature must be rejected");
assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${"0".repeat(64)}`, secret, 300, timestamp), false, "forged signature must be rejected");

const checkout = readFileSync("api/stripe/checkout.ts", "utf8");
assert.match(checkout, /getSessionUser/, "Checkout must require an authenticated session");
assert.match(checkout, /requireSameOrigin/, "Checkout must enforce same-origin POST protection");
const stripe = readFileSync("api/_lib/stripe.ts", "utf8");
assert.match(stripe, /stripePriceId\(input\.plan, input\.interval\)/, "server must resolve price from allowlisted plan/interval mapping");
assert.match(stripe, /assertTestMode\(\)/, "test-mode Checkout and Portal must reject live secret keys");
assert.doesNotMatch(checkout, /price_id|priceId.*request|amount.*request/i, "Checkout must not accept a client-supplied Stripe price or amount");

const webhook = readFileSync("api/stripe/webhook.ts", "utf8");
assert.match(webhook, /STRIPE_WEBHOOK_SECRET/, "webhook must use the server-side signing secret");
assert.match(webhook, /ON CONFLICT \(event_id\) DO NOTHING/, "webhook event processing must be idempotent");
assert.match(webhook, /event\.livemode === true/, "test-mode webhook integration must reject live events");
assert.match(webhook, /bodyParser: false/, "Stripe webhook must preserve the raw request body for signature verification");

console.log("Stripe test-mode regression suite: PASS");
