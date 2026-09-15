# Peppol Suite — Project State

## Current execution checkpoint
- Main now includes the latest engineering/pricing/legal/company preparation plus the authenticated Account/profile navigation and document-based bulk quota fix.
- Founder independently exercised the authenticated production browser flow on 2026-09-15 and subsequently observed successful PASS/READY single, bulk, and retry/duplicate history results.
- The extraction defect was fixed: VAT amount extraction ignores VAT-number/BE-number lines, and IBAN extraction accepts only candidates passing the existing IBAN validator.
- CI verification must be treated separately from documentation/evidence commits; no CI GREEN claim is made for the latest quota-fix checkpoint until a workflow is independently observed.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering remains evidence-gated until successful production authenticated browser E2E can be independently evidenced against the latest deployment: PASS validation, XML download, bulk success, retry/duplicate/re-download semantics and quota behavior.
- Production authenticated browser execution is no longer an environment-only blocker: Founder supplied direct production screenshots proving successful PASS/READY conversion, bulk, and retry/duplicate history behavior. Fresh deployment verification against the latest main SHA remains required before claiming production GREEN.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Company/ownership remains a professional confirmation gate; the working direction must not be treated as incorporated/legal fact.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized.
- Production deployment still requires independent fresh verification against the latest verified SHA; no Vercel deployment GREEN claim is made without that evidence.

## Account/profile checkpoint — 2026-09-15
- Authenticated navigation now exposes an Account link to the existing dashboard/profile surface.
- Account shows profile details, current plan, monthly usage cards, and conversion history.
- Admin accounts are explicitly marked as admin test mode.

## Quota semantics checkpoint — 2026-09-15
- Normal conversions consume `monthly_conversion_limit` document units.
- Bulk conversions now consume `monthly_bulk_limit` **per successfully saved document**, not per ZIP/job/batch.
- Bulk history records use a distinct `kind: bulk` path so bulk document usage does not consume the normal conversion quota.
- Bulk quota reservation and history insertion are atomic through the same database CTE pattern used for normal conversion quota enforcement.
- Bulk UI displays current bulk document units and stops based on the bulk-document allowance.
- Regression coverage asserts bulk document quota increments by one per document and blocks at the plan limit.

## Founder pricing baseline
- Free: 5 document units/month.
- Pro: €14.90/month or €149/year; 100 document units/month and 500 bulk document units/month.
- Business: €44.90/month or €449/year; 1,000 document units/month and 10,000 bulk document units/month.
- Annual discount baseline remains 16.7%.
- No live billing activation.

## Verification rules
- CI/deployment status must be independently observed for the exact latest main SHA before being called GREEN/READY.
- GitHub workflow lookup for the latest quota-fix commit currently returns no workflow runs, so CI is not claimed GREEN here.
- Founder production browser screenshots are evidence of the tested flows, but do not substitute for independent deployment verification against the latest SHA.

## Operating rule
Execute → verify → commit → record evidence → move to next blocker. Never claim GREEN without verifiable evidence.
