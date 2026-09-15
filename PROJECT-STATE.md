# Peppol Suite — Project State

## Current execution checkpoint
- Main includes the latest engineering/pricing/legal/company preparation plus authenticated Account/profile navigation and document-based bulk quota enforcement.
- Founder independently exercised the authenticated production browser flow on 2026-09-15 and subsequently observed successful PASS/READY single, bulk, and retry/duplicate history results.
- The extraction defect was fixed: VAT amount extraction ignores VAT-number/BE-number lines, and IBAN extraction accepts only candidates passing the existing IBAN validator. The IBAN candidate matcher is also line-safe and cannot cross invoice lines.
- Bulk quota semantics are document-based: each successfully saved bulk document consumes one `bulk_used` unit; bulk does not consume normal conversion quota.
- Admin/Founder test mode uses the same usage counters with a 1,000,000-unit test ceiling so QA usage reflects actual tested documents.
- Account usage UI labels bulk allowance explicitly as **Bulk documents** to match backend semantics.
- Account 2.0 is implemented: customer command-center header, first-use onboarding CTA, subscription/entitlement card backed by pricing config, monthly reset indicator, security card, quick actions, and prominent conversion/bulk actions.
- Account 2.0 evidence is recorded in `docs/account-command-center-2026-09-15.md`.
- CI run #238 (`35025943652`) is GREEN against main commit `86f5ec4a974e354e885c283f818b05ee1d9cc72e`. Typecheck, lint, build, regression, OAuth/auth, Vercel adapters, bulk-history, freemium/product/privacy, quota, and Stripe test-mode checks all passed.
- The latest production Vercel deployment is READY on commit `5773dbf0fe38603206feecb4c8b92f34561c5fb9`, which contains the Account 2.0 and extraction/bulk code changes; the later `86f5ec4...` commit only fixes the quota regression test's SQL variable ambiguity, so the production app code is unchanged by that final test-only commit.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering is ready for Founder browser verification of Account 2.0 on the current production deployment. The deployed application code includes the Account 2.0 changes; the exact latest main SHA differs only by a test-only regression fix.
- Founder production browser screenshots prove successful PASS/READY conversion, bulk, and retry/duplicate history behavior. Fresh Account 2.0 browser verification is the remaining Founder-side check.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Company/ownership remains a professional confirmation gate; the working direction must not be treated as incorporated/legal fact.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized.
- Production deployment is independently observed as READY and serves the Account 2.0 app code; the exact latest main SHA differs only because the last commit is test-only.

## Account/profile checkpoint — 2026-09-15
- Authenticated navigation exposes an Account link to the dashboard/profile surface.
- Account shows profile details, current plan, monthly usage cards, and conversion history.
- Admin accounts are explicitly marked as admin test mode.
- Usage cards show separate conversion and bulk-document counters with used/limit/remaining values.
- Account 2.0 adds customer-command-center framing, onboarding for unused Free accounts, pricing-backed subscription details, reset timing, security status, and quick-action navigation.
- The monthly reset countdown is calculated in an effect rather than during render, satisfying React purity lint.

## Quota semantics checkpoint — 2026-09-15
- Normal conversions consume `monthly_conversion_limit` document units.
- Bulk conversions consume `monthly_bulk_limit` **per successfully saved document**, not per ZIP/job/batch.
- Bulk history records use a distinct `kind: bulk` path so bulk document usage does not consume the normal conversion quota.
- Bulk quota reservation and history insertion are atomic through the same database CTE pattern used for normal conversion quota enforcement.
- Admin test mode uses the same usage counters with a 1,000,000-unit test ceiling, so Founder QA usage reflects actual tested documents.
- Bulk UI displays current bulk document units and stops based on the bulk-document allowance.
- Regression coverage asserts bulk document quota increments by one per document and blocks at the plan limit.
- Quota regression now uses an unambiguous PL/pgSQL variable name for the observed bulk usage value.

## Founder pricing baseline
- Free: 5 document units/month.
- Pro: €14.90/month or €149/year; 100 document units/month and 500 bulk document units/month.
- Business: €44.90/month or €449/year; 1,000 document units/month and 10,000 bulk document units/month.
- Annual discount baseline remains 16.7%.
- No live billing activation.

## Verification rules
- CI/deployment status must be independently observed before being called GREEN/READY.
- CI run #238 is GREEN on the latest main tree `86f5ec4...`.
- Production deployment is READY on `5773dbf...`, an ancestor containing all Account 2.0 application changes; the later `86f5ec4...` commit changes only regression-test code.
- Founder browser screenshots remain the required evidence for the final Account 2.0 UX/flow check.

## Operating rule
Execute → verify → commit → record evidence → move to next blocker. Never claim GREEN without verifiable evidence.