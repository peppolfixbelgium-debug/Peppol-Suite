# Peppol Suite — Project State

Last updated: 2026-09-13

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
- R&D / Product Intelligence issue: #25
- Stripe workstream issue: #24
- Production platform: Vercel + Neon PostgreSQL
- Do not expose credentials or secrets.

## Current checkpoint
- Stripe architecture/specification: GREEN.
- Stripe dependency audit: GREEN.
- Stripe test-mode implementation: AMBER; not yet implemented/verified.
- Stripe live activation: RED and intentionally OFF pending company/legal/tax/pricing/accounting gates.
- Existing database already contains `plans`, `users.plan_id`, `subscriptions`, and `usage_quota`; Stripe must extend this minimally rather than replace it speculatively.
- Founder-approved commercial baseline: Anonymous 3 units/month; Free 5 units/month; Pro €14.90/month or €149/year with 100 document + 500 bulk document units; Business €44.90/month or €449/year with 1,000 document + 10,000 bulk document units.

## Completed
- Auth/database foundation implemented and migrated to production Neon.
- Google OAuth production flow diagnosed and fixed; real-browser Google login proven working.
- Temporary OAuth diagnostics removed in PR #16 and merged normally.
- Conversion, usage, and remaining Vercel Node/Web request adapters fixed and regression-tested (PRs #14 and #17).
- Production authenticated conversion recorded successfully: invoice `INV-2026-0412`, supplier `Acme Atelier BV`, customer `Studio Nord SRL`, total `1512.5000 EUR`, status `ok`, issue_count `0`.
- PR #18 fixed bulk conversion-history persistence and quota accounting so successful bulk PDFs are represented in conversion history.
- PR #19 established the freemium/quota/privacy foundation: anonymous browser trial, server-side authenticated conversion quota/history, Pro-only bulk entitlement, ZIP robustness limits, duplicate-output handling, and Free/Pro/Business product structure without publishing unfinalized prices.
- PR #20 fixed bulk entitlement accounting: one bulk-job allowance per ZIP/batch, while successful PDFs consume one conversion allowance/history separately. CI run 85 passed on the PR branch.
- Legal/GDPR launch audit completed 2026-09-12 and posted to Issue #23.
- R&D/Product Intelligence initial current-market scan completed 2026-09-13 and recorded in Issue #25.
- Stripe launch architecture and dependency decision documented in Issue #24 and master tracker #23.

## Stripe — architecture and launch gates
- Stripe is the payment/billing system of record; Peppol Suite maintains a local subscription/entitlement projection.
- Free creates no Stripe subscription; Pro/Business use Stripe Checkout + Billing.
- Customer Portal handles billing self-service.
- Verified Stripe webhooks, not browser success redirects, grant/update paid access.
- Products/Prices: Pro and Business monthly/yearly; application-owned plan catalogue maps plan codes to environment-specific Price IDs.
- Backend-only Checkout Session creation; never trust client-supplied price IDs, amounts, currencies or customer IDs.
- Webhook endpoint must verify signatures, persist events, enforce event-ID uniqueness/idempotency and safely handle retries/out-of-order delivery.
- Local billing projection should cover Stripe customer, subscription, events, payments/invoices/refunds as needed, entitlements, usage periods and billing audit history.
- B2B-ready organization/workspace ownership is preferred, but must be reconciled with the current user-centric schema before migration.
- Upgrades may be immediate with Stripe prorations; downgrades/cancellations normally take effect at period end.
- Failed payments enter recovery/grace states; no destructive data deletion on first failure. Final grace period is a Founder/business decision.
- Refunds are backend/admin-only and auditable.
- Stripe Tax/VAT-ID handling waits for finalized company/VAT configuration.
- SCA/3DS/payment-action-required states must be supported.

### Test-mode work allowed now
- Stripe SDK/service boundary, plan mapping, Checkout, webhook verification/idempotency, subscription state projection, entitlements, portal, upgrade/downgrade/cancel/reactivation, payment-failure handling, refund/audit plumbing and automated security/lifecycle tests.
- Existing `plans`/`users.plan_id`/`subscriptions`/`usage_quota` must be audited and extended minimally.

### Live activation blockers
1. Company/legal ownership structure not finalized.
2. Belgian/Indian VAT/tax registration and treatment not finalized.
3. Final commercial pricing/quotas are now Founder-approved, but customer-facing implementation and Stripe live Products/Prices still require reconciliation to the approved baseline.
4. Terms/refund/cancellation/privacy/billing disclosures and accounting workflow not finalized.
5. Production Stripe entity, bank/settlement verification, live keys/signing secret and live Price IDs cannot be configured until the above are resolved.

## Legal/GDPR launch status
**RED / launch blocker.** Required implementation and professional review remain outstanding. See Issue #23 for the full MUST-DO list and lawyer/accountant confirmation gates.

## Company/Ownership
- Working direction remains Belgian company owned/controlled by the Founder's wife, but this is planning direction only, not legal/tax approval.
- Professional confirmation remains required for ownership/control, director eligibility, employment/conflict, IP, UBO, VAT/tax and residence/professional-card considerations.

## R&D/Product Intelligence
- Issue #25 is the dedicated tracker. Initial market scan completed.
- Strategic focus: validation, readable inspection, explainable errors, conversion/repair, revalidation, bulk, history and export; do not add generic accounting/banking/CRM/full Access Point functionality before customer evidence.
- R&D must not delay production QA, legal completion, company setup, pricing reconciliation, Stripe test-mode work or Growth.

## Growth
- Priority remains founder-led acquisition toward the first 10 paying customers, with accountants/bookkeepers as a high-value distribution hypothesis.
- Immediate funnel: free validation/viewing/troubleshooting utility -> useful result -> account/history/bulk usage -> paid conversion/referral.

## Cross-team launch timeline — target, not commitment
- Sep 13–15: close production QA/P0 engineering defects; continue Stripe test-mode; convert Legal/GDPR audit into implementation backlog; finalize commercial reconciliation; prepare company/VAT decision pack and first prospect assets.
- Sep 16–18: complete legal MUST-DO implementation; finish billing test lifecycle; finalize customer-facing pricing/copy; prepare first-100 prospect outreach.
- Sep 19–21: full regression/security review; professional legal/accounting review; company/Stripe entity preparation; launch copy; founder-led acquisition.
- Sep 22–24: launch-candidate freeze, production smoke/E2E, billing/tax/legal checklist, rollback verification, funnel/support readiness, go/no-go.
- Sep 25: target production live date only if every mandatory legal, company, tax, pricing, Stripe, security and production gate is green. If a mandatory gate remains red, move the release date.

## Team execution rules
- Routine implementation decisions are autonomous; do not wait for Founder for non-material decisions.
- No live payment activation around legal/company/tax gates.
- No speculative schema/OAuth/unrelated refactors.
- Any material legal, ownership, tax, pricing, live-payment, or irreversible decision must be escalated with one concrete recommendation and the exact Founder approval required.
- Every meaningful decision, completed deliverable, blocker, and cross-team dependency must be recorded in this file and Issue #23.

## Next highest-value actions
1. Engineering: execute the three-PDF + bulk-ZIP production E2E pack and close quota edge cases.
2. Legal/GDPR: implement Privacy/Terms/DPA/deletion/export/retention artifacts and obtain lawyer/accountant review.
3. Company: confirm wife's exact residence/self-employment/director eligibility and execute incorporation/UBO/VAT/accounting setup after advice.
4. Pricing/Product: reconcile customer-facing pricing/quotas with Founder-approved €14.90/€149 and €44.90/€449 packages.
5. Stripe: implement and verify test-mode lifecycle/security; keep live mode OFF.
6. Growth: build first-100 prospect list and founder-led discovery/outreach.
7. R&D: continue focused evidence gathering without speculative feature work.

## Process rule
GitHub is the shared source of truth. Update this file and Issue #23 after every completed task, meaningful decision, blocker, or cross-team dependency. Do not ask the user to relay information between agents.
