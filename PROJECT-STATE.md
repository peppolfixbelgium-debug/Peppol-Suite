# Peppol Suite — Project State

## Current execution checkpoint
- Annual pricing savings are now explicitly presented on the pricing page for Pro and Business in English, French, and Dutch.
- Current displayed annual pricing: Pro €149/year vs €178.80 at monthly rate (16.7% saving); Business €449/year vs €538.80 (16.7% saving).
- This presentation does not activate live payments.
- Pricing issue #52 remains open for Pricing-team confirmation of the final annual-billing commercial model.
- Founder approval remains required before changing approved commercial pricing or enabling live billing.
- Authenticated conversion-history deletion is implemented on main: `api/conversions.ts` supports same-origin-protected DELETE scoped to the authenticated session user and records `conversion_history_deleted`; the dashboard exposes confirmation-gated Delete history and the client library invokes the endpoint.
- Privacy copy now accurately discloses history deletion as distinct from account deletion and full GDPR portability.
- Regression coverage in `scripts/freemium-product-regression.ts` checks deletion ownership scoping, same-origin protection, audit-event emission, dashboard wiring, and irreversible warning copy.
- Deletion checkpoint commits: `f2d5a852...`, `e3d6e5ae...`, `c321f9b3...`, `a337193a...`, `5eea6ead...`; latest state commit follows this implementation sequence.
- Latest deletion checkpoint still requires CI verification; no GREEN claim is made until the resulting workflow completes successfully.

## Current launch posture
- Product/Engineering remains evidence-gated until production authenticated browser E2E can be independently evidenced.
- Legal/GDPR remains an external professional-review gate alongside engineering remediation.
- Live Stripe/payment processing remains OFF.
- Growth outbound remains OFF pending Founder approval.

## Operating rule
Execute → verify → commit → record evidence → move to the next blocker. Never claim GREEN without verifiable evidence.
