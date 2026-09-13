# Peppol Suite — Project State

Last updated: 2026-09-13

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
- R&D / Product Intelligence issue: #25
- Stripe workstream issue: #24
- Production platform: Vercel + Neon PostgreSQL
- Do not expose credentials or secrets.

## Stripe checkpoint — 2026-09-13
- **GREEN:** architecture/specification complete.
- **GREEN:** existing-schema dependency audit complete; existing `plans`, `users.plan_id`, `subscriptions`, and `usage_quota` confirmed. Current subscription schema is not yet sufficient for full launch-grade Stripe event/audit/org billing, so any implementation must extend it minimally.
- **AMBER:** test-mode implementation remains to be executed and verified.
- **RED:** live activation intentionally OFF pending company/legal/tax/accounting gates.
- Founder-approved commercial baseline: Anonymous 3 units/month; Free 5 units/month; Pro €14.90/month or €149/year with 100 document + 500 bulk document units; Business €44.90/month or €449/year with 1,000 document + 10,000 bulk document units.

### Stripe decisions
- Stripe is billing/payment system of record; local Peppol Suite subscription/entitlement projection is application authorization source.
- Free has no Stripe subscription. Pro/Business use Stripe Checkout + Billing.
- Customer Portal handles billing self-service.
- Verified/idempotent webhooks, not browser success redirects, control paid access.
- Backend maps approved plan codes to environment-specific Stripe Price IDs; never trust client-supplied amount/price/customer IDs.
- Upgrade can be immediate with Stripe prorations; downgrade/cancellation normally at period end.
- Failed payments use recovery/grace states; no destructive first-failure deletion. Final grace period requires business decision.
- Refunds are backend/admin-only and auditable.
- Stripe Tax/VAT-ID handling waits for finalized company/VAT configuration.
- SCA/3DS/payment-action-required paths are required.

### Test-mode allowed now
- SDK/service boundary, plan mapping, Checkout, webhook signature/idempotency/event store, subscription projection, entitlements, Customer Portal, lifecycle handling, payment failure, refunds/audit and automated security/lifecycle tests.

### Live blockers
- Company/legal ownership entity and Stripe account identity.
- Bank/settlement information.
- Belgian/Indian VAT/tax registration and treatment.
- Final legal billing/refund/cancellation/privacy disclosures and accounting workflow.
- Production Stripe live keys/signing secret/live Price IDs.

## Other launch state
- **Legal/GDPR: RED** — implementation and professional review remain outstanding.
- **Company/Ownership: AMBER/decision pending professional advice** — working direction is Belgian company owned/controlled by Founder's wife, but not legal/tax approval.
- **R&D/Product Intelligence: GREEN for initial market scan** — focused document-problem/workflow strategy; no P0 competitor feature gap identified.
- **Production QA/Engineering: AMBER** — core auth/conversion paths have evidence of passing, but remaining E2E/quota/copy regression gates are not closed.
- **Growth: AMBER** — strategy is defined; first-100 prospect/outreach assets remain to be executed.

## Next highest-value actions
1. Engineering: execute production E2E regression pack and quota edge cases.
2. Legal/GDPR: implement mandatory launch artifacts and obtain professional review.
3. Company: resolve ownership/director/residence eligibility and incorporation/tax setup with professional advice.
4. Pricing/Product: reconcile customer-facing pricing/quotas to Founder-approved baseline.
5. Stripe: implement and verify complete test-mode billing lifecycle; keep live OFF.
6. Growth: execute first-100 prospect list and founder-led outreach assets.
7. R&D: continue evidence gathering without speculative feature work.

## Process rule
GitHub is the shared source of truth. Update this file and Issue #23 after every completed task, meaningful decision, blocker, or cross-team dependency. Do not ask the user to relay information between agents.
