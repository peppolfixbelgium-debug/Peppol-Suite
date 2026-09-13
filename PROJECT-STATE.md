# Peppol Suite — Project State

Last updated: 2026-09-13

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
- R&D / Product Intelligence issue: #25
- Stripe workstream issue: #24
- Production platform: Vercel + Neon PostgreSQL
- Do not expose credentials or secrets.

## Completed
- Auth/database foundation implemented and migrated to production Neon.
- Google OAuth production flow diagnosed and fixed; real-browser Google login proven working.
- Temporary OAuth diagnostics removed in PR #16 and merged normally.
- Conversion, usage, and remaining Vercel Node/Web request adapters fixed and regression-tested (PRs #14 and #17).
- Production authenticated conversion recorded successfully: invoice `INV-2026-0412`, supplier `Acme Atelier BV`, customer `Studio Nord SRL`, total `1512.5000 EUR`, status `ok`, issue_count `0`.
- PR #18 fixed bulk conversion-history persistence and quota accounting so successful bulk PDFs are represented in conversion history.
- PR #19 established the freemium/quota/privacy foundation: anonymous browser trial, server-side authenticated conversion quota/history, Pro-only bulk entitlement, ZIP robustness limits, duplicate-output handling, and Free/Pro/Business product structure without publishing unfinalized prices.
- PR #20 fixed bulk entitlement accounting: one bulk-job allowance per ZIP/batch, while successful PDFs consume one conversion allowance/history separately. CI run 85 passed on the PR branch.
- Shared project tracking established in `PROJECT-STATE.md` and issue #23.
- Legal/GDPR launch audit completed 2026-09-12 and posted to Issue #23, covering GDPR/privacy, Terms, cookies/analytics, retention, processors/subprocessors, DPA/international transfers, deletion/export, liability, Peppol positioning, Belgian 2026 e-invoicing, VAT boundaries, disclosures, and lawyer/accountant gates.
- R&D/Product Intelligence workstream created in Issue #25. Initial current-market scan completed 2026-09-13 against current/primary product and Belgian government sources. The evidence supports a focused document-problem/workflow position rather than a generic accounting-suite strategy.

## Current production / repository state — 2026-09-13
- Current `main`: `0a28b18dcb3c6d7fbb5b34e474989ed837788d1c` (`docs: refresh project state for CEO checkpoint`, 2026-09-13 09:58:06Z).
- Parent was `16f192311934736893da962a9924132b73034c94`; the intervening commits are documentation/state synchronizations, not new product implementation.
- GitHub Vercel status for the exact current main commit reports `success` with description `Deployment has completed` at 2026-09-13 09:58:28Z.
- No GitHub Actions workflow run is attached to the current docs-only commit; do not infer fresh CI success from Vercel status.
- Canonical URL: `https://peppol-suite.vercel.app`
- This exact Vercel status establishes deployment completion for `0a28b18…`, but does not by itself establish full production QA/READY. Remaining E2E and launch gates still apply.
- Previous runtime-error evidence was a historical two-hour query with no error/fatal entries; it is not a current guarantee.

## Current QA findings
- Google OAuth: real-browser PASS; do not modify OAuth behavior.
- Authenticated `/api/conversions` and `/api/usage`: production PASS on authenticated browser flow.
- Unauthenticated `/api/conversions` and `/api/usage`: expected 401 PASS.
- Anonymous browser-side PDF processing exists with a 20 MB PDF and 50-page limit.
- Anonymous trial is intentionally soft/client-side; authenticated entitlements are server-side.
- Bulk is currently Pro-only; one bulk job consumes one bulk allowance, while each successfully persisted PDF consumes one conversion allowance.
- Conversion history stores metadata, not PDF/XML files.
- Remaining engineering QA: three-PDF + bulk-ZIP production E2E pack; success/failure/retry/duplicate/re-download/concurrency quota semantics; anonymous trial bypass/reset; customer-facing Product/Convert/Validate/Bulk/Pricing/Sign-in/Privacy copy audit.

## Commercial baseline — Founder approved
- Anonymous: 3 document units/month.
- Free: 5 document units/month.
- Pro: €14.90/month or €149/year; 100 document units + 500 bulk document units.
- Business: €44.90/month or €449/year; 1,000 document units + 10,000 bulk document units.
- Do not silently change prices or quotas. Material pricing changes require Founder approval.

## Legal/GDPR launch status — 2026-09-12
**Status: RED / launch blocker for first paying customer.** Core architecture is workable, but legal implementation and professional sign-off are not complete.

### Meaningful decisions
- First paying launch should be B2B-first; defer B2C until consumer checkout/withdrawal requirements are deliberately implemented.
- Peppol Suite must not claim to be a certified Peppol Access Point or guarantee legal/tax compliance. Position it as a document utility that generates structured UBL/Peppol-ready output for use with the customer's Access Point.
- Keep document-body storage minimized. Current architecture storing conversion metadata rather than PDF/XML bodies is a favorable privacy decision.
- Stripe/live payments remain OFF until VAT treatment, commercial terms, cancellation/refund flow, and payment-provider legal documentation are approved.
- Validation must be described as checks performed by Peppol Suite, not as a blanket legal/accounting guarantee.

### Launch blockers
- Current Privacy page still requires final legal replacement/review.
- No self-service account/history deletion workflow currently exists.
- Retention/controller/processor details remain to be defined in the final Privacy notice.
- Current Terms are too short/incomplete for paid SaaS and contain stale dating/quota language.
- Legal company identity, VAT/contact disclosures, DPA/subprocessor register, data-rights workflow and retention schedule need completion/confirmation.

### MUST DO before first customer
- Final legal entity/company/VAT/contact identity and website legal disclosures.
- Replace Privacy Policy with final reviewed notice.
- Replace Terms with full SaaS terms.
- Cookie Policy + consent controls if non-essential tracking exists.
- DPA + subprocessor register.
- Review/document Vercel, Neon and Google terms; document Resend/Stripe before activation.
- Account deletion + GDPR request workflow.
- Data export/access workflow.
- Internal retention schedule and deletion procedure.
- Incident/breach response procedure.
- GDPR data map/processing inventory and DPIA applicability screening.
- Converter/validation liability and Peppol-status disclaimers in product copy.
- Accountant VAT determination for launch customer model.
- Lawyer review of Terms, Privacy, DPA and liability/consumer clauses.

### Requires lawyer/accountant confirmation
- Final Terms, liability cap/exclusions/indemnities, B2B jurisdiction, B2C terms if later introduced, DPA, IP/licensing and Peppol marketing claims.
- Belgian/EU VAT treatment, B2B/B2C VAT, OSS, invoice requirements, statutory accounting retention, and Stripe Tax configuration.

## Company/Ownership — working direction
- Working direction remains Belgian company owned/controlled by the Founder's wife, who is expected to run the company while the Founder remains employed.
- This is a planning direction, not incorporation or legal/tax approval.
- Before incorporation, Belgian professional advice must confirm ownership/control, director/manager eligibility, employment/conflict considerations, remuneration, IP ownership/licensing, UBO, VAT/tax treatment and related-party implications as applicable.
- In particular, confirm whether her exact Belgian residence status permits self-employed/director activity or whether a professional-card requirement/exemption applies. Do not infer this from a general right to work as an employee.

## R&D / Product Intelligence — 2026-09-13
- Issue #25 is the dedicated R&D tracker; initial market scan completed and recorded there.
- Strategic decision: do not add generic Peppol sending/receiving, accounting, banking, tax or CRM to launch solely because competitors offer them.
- Focus differentiation on difficult document problems: validation, readable inspection, explainable errors, conversion/repair, revalidation, bulk, history and export.
- P0: existing core-flow reliability and mandatory launch gates; no competitor feature newly discovered is a P0 blocker.
- P1 candidates: guided validation troubleshooting and accountant-oriented multi-document workflow/reporting, subject to engineering effort and real-user evidence.
- P2: API/integrations and deeper workflow automation after customer evidence.
- PARK: generic accounting/banking/CRM/tax filing/full Access Point stack before first-customer evidence.
- R&D must not delay production QA, legal completion, company setup, pricing, Stripe test-mode work or Growth.

## Stripe — current status
- **GREEN (architecture/specification):** Stripe is designated as payment/billing system of record; Peppol Suite will maintain a local subscription/entitlement projection. Free will not create a Stripe subscription; paid plans will use Stripe Checkout + Billing; Customer Portal will handle billing self-service; verified webhooks, not browser redirects, will control paid access.
- **GREEN (dependency audit):** Existing schema already contains `plans`, `users.plan_id`, `subscriptions`, and `usage_quota`. Existing subscription schema is Stripe-provider-compatible but is not yet sufficient for full launch-grade webhook/event/audit/organization billing. Existing quota semantics must not regress.
- **AMBER (implementation):** Full Stripe test-mode integration, webhook processor, entitlement projection, billing-event persistence, portal endpoint, lifecycle handling, and tests are still to be implemented and verified.
- **RED / blocked by CEO decisions (live activation only):** company/legal ownership entity, bank/settlement identity, VAT/tax registration/treatment, final commercial pricing/quotas, legal billing/refund/cancellation terms, and production Stripe account/live secrets.

## Stripe architectural decisions
- Products/Prices: Pro and Business monthly/yearly; environment-specific Price IDs mapped through an application-owned plan catalogue.
- Backend-only Checkout Session creation; never trust client-supplied prices, amounts, currencies or customer IDs.
- Webhook endpoint must verify signatures, persist events, enforce event-ID uniqueness/idempotency, and safely handle retries/out-of-order delivery.
- Local billing projection should cover Stripe customer, subscription, events, payments/invoices/refunds as needed, entitlements, usage periods and billing audit history.
- B2B-ready organization/workspace ownership is preferred over billing directly to one login, but must be reconciled with the current user-centric schema before migration.
- Upgrades may be immediate with Stripe prorations; downgrades/cancellations normally take effect at period end.
- Failed payments enter recovery/grace states; no destructive data deletion on first failure. Final grace period is a business decision.
- Refunds are backend/admin-only and auditable.
- Stripe Tax/VAT-ID handling waits for finalized company/VAT configuration.
- SCA/3DS/payment-action-required states must be supported.

## Stripe implementation allowed now
- Test-mode SDK/service boundary, plan mapping, Checkout, webhook verification/idempotency, subscription state projection, entitlements, portal, upgrade/downgrade/cancel/reactivation, payment-failure handling, refund/audit plumbing and automated security/lifecycle tests.
- Existing `plans`/`users.plan_id`/`subscriptions`/`usage_quota` must be audited and extended minimally rather than replaced speculatively.

## Stripe launch blockers
1. Company/legal ownership structure not finalized.
2. Belgian/Indian VAT/tax registration and treatment not finalized.
3. Final Free/Pro/Business prices, quotas, currency and intervals not approved.
4. Terms/refund/cancellation/privacy/billing disclosures and accounting workflow not finalized.
5. Production Stripe entity, bank/settlement verification, live keys/signing secret and live Price IDs cannot be configured until the above are resolved.

## Growth — current status
- Priority remains founder-led acquisition toward the first 10 paying customers, with accountants/bookkeepers as a high-value distribution hypothesis.
- Immediate funnel focus: free validation/viewing/troubleshooting utility -> useful result -> account/history/bulk usage -> paid conversion/referral.
- Prepare first-100 prospect list, accountant proposition, outreach scripts, and basic funnel measurement without delaying launch engineering/legal work.

## Cross-team launch timeline — target, not commitment
- Sep 13–15: close production QA/P0 engineering defects; continue Stripe test-mode; convert Legal/GDPR audit into implementation backlog; finalize commercial reconciliation; prepare company/VAT decision pack and first prospect assets.
- Sep 16–18: complete legal MUST-DO implementation; finish billing test lifecycle; finalize customer-facing pricing/copy; prepare first-100 prospect outreach.
- Sep 19–21: full regression/security review; professional legal/accounting review; company/Stripe entity preparation; launch copy; founder-led acquisition.
- Sep 22–24: launch-candidate freeze, production smoke/E2E, billing/tax/legal checklist, rollback verification, funnel/support readiness, go/no-go.
- Sep 25: target production live date only if every mandatory legal, company, tax, pricing, Stripe, security and production gate is green. If a mandatory gate remains red, do not bypass it; move the release date.
- Sep 26–29: target first paying customer through founder-led real-document problem solving and direct outreach.
- Sep 30 onward: optimize from real customer evidence; target first 10 paying customers before material paid acquisition scaling.

## Team execution rules
- Routine implementation decisions are autonomous; do not wait for Founder for non-material decisions.
- No live payment activation around legal/company/tax gates.
- No speculative schema/OAuth/unrelated refactors.
- Any material legal, ownership, tax, pricing, live-payment, or irreversible decision must be escalated with one concrete recommendation and the exact Founder approval required.
- Every meaningful decision, completed deliverable, blocker, and cross-team dependency must be recorded in this file and issue #23.

## Next highest-value actions
1. Engineering: execute the three-PDF + bulk-ZIP production E2E pack and close quota edge cases; this is the fastest route to technical launch confidence.
2. Legal/GDPR: turn the completed audit into actual Privacy/Terms/DPA/deletion/export/retention artifacts and obtain lawyer/accountant review.
3. Company: confirm wife's exact residence/self-employment/director eligibility and then execute incorporation/UBO/VAT/accounting setup.
4. Pricing/Product: reconcile all customer-facing pricing/quotas with the Founder-approved €14.90/€149 and €44.90/€449 packages.
5. Stripe: continue test-mode lifecycle/security tests; keep live mode OFF until all launch gates are green.
6. Growth: build the first-100 prospect list and start founder-led discovery/outreach as soon as the legal-safe product proposition is ready.
7. R&D: research validation/troubleshooting/conversion/OCR competitors and gather customer evidence; do not create speculative implementation work.
8. For genuine engineering failures: reproduce -> root cause -> smallest fix -> focused regression -> full CI -> normal merge -> production deploy -> retest.
9. Do not touch Microsoft OAuth, Resend, database schema, or unrelated functionality unless proven necessary.

## Process rule
GitHub is the shared source of truth. Update this file and Issue #23 after every completed task, meaningful decision, blocker, or cross-team dependency. Do not ask the user to relay information between agents.
