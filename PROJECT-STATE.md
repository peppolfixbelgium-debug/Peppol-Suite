# Peppol Suite — Project State

Last updated: 2026-09-12

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
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
- PR #20 fixed bulk entitlement accounting: one bulk-job allowance per ZIP/batch, while successful PDFs consume the normal server-side conversion allowance/history separately. CI run 85 passed on the PR branch.
- Shared project tracking established in `PROJECT-STATE.md` and issue #23.
- **Legal/GDPR launch audit completed 2026-09-12.** A concrete Belgium/EU first-paying-customer legal launch checklist was completed and posted to Issue #23, covering GDPR/privacy, Terms, cookies/analytics, document retention, processors/subprocessors, DPA/international transfers, deletion/export, conversion/validation liability, Peppol positioning, Belgian 2026 e-invoicing, B2B/B2C and VAT boundaries, website disclosures, and lawyer/accountant gates.

## Current production
- Latest production deployment: `dpl_DPnu6g5WRip2Lrgopwv9vkLVhj8J`
- Main commit: `7e23fa9ac493dec9e3f054dc257411af455a1e7e`
- State: READY
- Canonical URL: `https://peppol-suite.vercel.app`
- The latest production deployment contains the PR #18, #19, and #20 changes plus the shared-state documentation commit.
- Latest production build completed successfully; Vercel build log contains only the existing large-chunk warning, not a build failure.
- Production runtime error log query for the last two hours returned no error/fatal entries.

## Current QA findings
- Google OAuth: real-browser PASS; do not modify OAuth behavior.
- Authenticated `/api/conversions` and `/api/usage`: production PASS on authenticated browser flow.
- Unauthenticated `/api/conversions` and `/api/usage`: expected 401 PASS.
- Anonymous browser-side PDF processing exists with a 20 MB PDF and 50-page limit.
- Anonymous trial is intentionally soft/client-side; authenticated entitlements are server-side.
- Current seeded Free plan remains 5 monthly conversions; final commercial limits/pricing are not approved yet.
- Bulk is currently Pro-only; one bulk job consumes one bulk allowance, while each successfully persisted PDF consumes one conversion allowance.
- Conversion history stores metadata, not PDF/XML files.
- Production currently shows no Vercel error/fatal runtime entries in the last two hours of monitoring.

## Legal/GDPR launch status — 2026-09-12
**Status: RED / launch blocker for first paying customer.** Core architecture is workable, but legal implementation and sign-off are not complete.

### Meaningful decisions
- First paying launch should be **B2B-first**; defer B2C until consumer checkout/withdrawal requirements are deliberately implemented.
- Peppol Suite must **not** claim to be a certified Peppol Access Point or guarantee legal/tax compliance. Position it as a document utility that generates structured UBL/Peppol-ready output for use with the customer's Access Point.
- Keep document-body storage minimized. Current architecture storing conversion metadata rather than PDF/XML bodies is a favorable privacy decision.
- Stripe/live payments remain OFF until VAT treatment, commercial terms, cancellation/refund flow, and payment-provider legal documentation are approved.
- Validation must be described as checks performed by Peppol Suite, not as a blanket legal/accounting guarantee.

### Launch blockers discovered
- Current Privacy page explicitly says it is not the final legal notice.
- No self-service account/history deletion workflow currently exists.
- Retention/controller/processor details remain to be defined in the current Privacy page.
- Current Terms are too short/incomplete for a production paid SaaS.
- Terms contain stale April 2026 dating and quota language that no longer matches current server-side authenticated quota architecture.
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

### SHOULD DO before public launch
- Security/TOM documentation.
- Public subprocessor page.
- Security page aligned with actual implementation.
- Customer DPA download/versioning.
- Automated data export/deletion where appropriate.
- Consent logging and preference management.
- Formal retention/deletion automation.
- Enterprise DPA/SLA package.

### CAN DO later
- B2C launch.
- India-specific legal package.
- Advanced analytics/marketing tracking.
- Enterprise security certification work.
- Advanced data residency/custom retention.
- Peppol transmission/access-point integration.

### Requires lawyer/accountant confirmation
- Final Terms, liability cap/exclusions/indemnities, B2B jurisdiction, B2C terms if later introduced, DPA, IP/licensing and Peppol marketing claims.
- Belgian/EU VAT treatment, B2B/B2C VAT, OSS, invoice requirements, statutory accounting retention, and Stripe Tax configuration.

### Positive legal findings
- Current production is Vercel + Neon with authenticated server-side quota/history.
- Current conversion history stores metadata, not uploaded PDF/generated XML bodies.
- Existing legal/product wording correctly avoids claiming Peppol Suite itself is an Access Point.

## Next work
1. Continue end-to-end production QA using the three PDF regression samples and bulk ZIP sample pack.
2. Verify quota semantics explicitly for success, failure, retry, duplicate/re-download, multi-PDF ZIPs, concurrent requests, and anonymous trial reset/bypass behavior.
3. Audit the customer-facing website copy across Product, Convert, Validate, Bulk, Pricing, Sign in, and Privacy for a consistent simple SaaS message. Keep implementation/security details out of marketing copy unless they are useful to customers.
4. Execute the Legal/GDPR MUST-DO backlog before accepting the first paying customer; do not publish invented retention periods, controller details, processor claims, or legal guarantees.
5. Confirm the final commercial quota/pricing decisions before enabling live payments. No Stripe/live payments yet.
6. For every genuine failure: reproduce -> root cause -> smallest fix -> focused regression -> full CI -> normal merge -> production deploy -> retest.
7. Do not touch Microsoft OAuth, Resend, database schema, or unrelated functionality unless proven necessary.

## Process rule
GitHub is the shared source of truth. Update this file and issue #23 after every completed task, meaningful decision, blocker, or cross-workstream dependency. Do not ask the user to relay information between agents.
