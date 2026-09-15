# Peppol Suite — Project State

## Current execution checkpoint
- Main includes the latest engineering/pricing/legal/company preparation plus authenticated Account/profile navigation and document-based bulk quota enforcement.
- Founder independently exercised the authenticated production browser flow on 2026-09-15 and subsequently observed successful PASS/READY single, bulk, and retry/duplicate history results.
- The extraction defect was fixed: VAT amount extraction ignores VAT-number/BE-number lines, and IBAN extraction accepts only candidates passing the existing IBAN validator.
- Bulk quota semantics are document-based: each successfully saved bulk document consumes one `bulk_used` unit; bulk does not consume normal conversion quota.
- Admin/Founder test mode uses the same usage counters with a 1,000,000-unit test ceiling so QA usage reflects actual tested documents.
- Account usage UI labels bulk allowance explicitly as **Bulk documents** to match backend semantics.
- Account 2.0 is implemented: customer command-center header, first-use onboarding CTA, subscription/entitlement card backed by pricing config, monthly reset indicator, security card, quick actions, and prominent conversion/bulk actions.
- Account 2.0 evidence is recorded in `docs/account-command-center-2026-09-15.md`.
- CI verification is tracked separately from documentation/evidence; the latest Account 2.0 engineering commit `3b6928f2f3c3ae93b494acd0da8234f3d23d8200` has GitHub CI run #228 observed in progress. No CI GREEN claim is made until completion.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering remains evidence-gated until successful production authenticated browser E2E can be independently evidenced against the latest deployment: PASS validation, XML download, bulk success, retry/duplicate/re-download semantics and quota behavior.
- Founder production browser screenshots prove successful PASS/READY conversion, bulk, and retry/duplicate history behavior. Fresh deployment verification against the latest main SHA remains required before claiming production GREEN.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Company/ownership remains a professional confirmation gate; the working direction must not be treated as incorporated/legal fact.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized.
- Production deployment must be independently verified against the latest main SHA before calling deployment GREEN.

## Account/profile checkpoint — 2026-09-15
- Authenticated navigation exposes an Account link to the dashboard/profile surface.
- Account shows profile details, current plan, monthly usage cards, and conversion history.
- Admin accounts are explicitly marked as admin test mode.
- Usage cards show separate conversion and bulk-document counters with used/limit/remaining values.
- Account 2.0 adds customer-command-center framing, onboarding for unused Free accounts, pricing-backed subscription details, reset timing, security status, and quick-action navigation.

## Quota semantics checkpoint — 2026-09-15
- Normal conversions consume `monthly_conversion_limit` document units.
- Bulk conversions consume `monthly_bulk_limit` **per successfully saved document**, not per ZIP/job/batch.
- Bulk history records use a distinct `kind: bulk` path so bulk document usage does not consume the normal conversion quota.
- Bulk quota reservation and history insertion are atomic through the same database CTE pattern used for normal conversion quota enforcement.
- Admin test mode uses the same usage counters with a 1,000,000-unit test ceiling, so Founder QA usage reflects actual tested documents.
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
- The latest Account 2.0 engineering push has CI run #228 in progress; the subsequent evidence/state commits must not be mistaken for a completed CI result for the latest tree.
- Founder production browser screenshots are evidence of the tested flows, but do not substitute for independent deployment verification against the latest SHA.

## Operating rule
Execute → verify → commit → record evidence → move to next blocker. Never claim GREEN without verifiable evidence.
