# Peppol Suite — Project State

## Current execution checkpoint
- Annual pricing savings are now explicitly presented on the pricing page for Pro and Business in English, French, and Dutch.
- Current displayed annual pricing: Pro €149/year vs €178.80 at monthly rate (16.7% saving); Business €449/year vs €538.80 (16.7% saving).
- Pricing UX hardening commit `fb1e6af79175fea22148606e07182ccab0fa49d3` now labels the billing-period control in the active language and makes the annual saving amount explicitly annual in English, French, and Dutch. This does not alter the Founder-approved prices or activate live payments.
- Regression commit `79695b4b74e8e286d1e16f4bca15c8cba231927a` locks the localized billing-period labels and explicit annual-savings semantics into the freemium/product regression suite.
- Pricing issue #52 remains open for Pricing-team / Founder confirmation of the final annual-billing commercial model; no commercial baseline was changed.
- Founder approval remains required before changing approved commercial pricing or enabling live billing.
- Authenticated conversion-history deletion is implemented on main: `api/conversions.ts` supports same-origin-protected DELETE scoped to the authenticated session user and records `conversion_history_deleted`; the dashboard exposes confirmation-gated Delete history and the client library invokes the endpoint.
- Privacy copy now accurately discloses history deletion as distinct from account deletion and full GDPR portability.
- Regression coverage in `scripts/freemium-product-regression.ts` checks deletion ownership scoping, same-origin protection, audit-event emission, dashboard wiring, irreversible warning copy, and the current pricing presentation semantics.
- Deletion checkpoint commits: `f2d5a852...`, `e3d6e5ae...`, `c321f9b3...`, `a337193a...`, `5eea6ead...`; pricing UX commits are recorded above.
- The pricing UX/regression changes trigger CI verification; no GREEN claim is made until the resulting workflow completes successfully.

## Current launch posture
- Product/Engineering remains evidence-gated until production authenticated browser E2E can be independently evidenced.
- Legal/GDPR remains an external professional-review gate alongside engineering remediation.
- Live Stripe/payment processing remains OFF.
- Growth outbound remains OFF pending Founder approval.

## Operating rule
Execute → verify → commit → record evidence → move to the next blocker. Never claim GREEN without verifiable evidence.
