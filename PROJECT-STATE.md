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

## Next work
1. Continue end-to-end production QA using the three PDF regression samples and bulk ZIP sample pack.
2. Verify quota semantics explicitly for success, failure, retry, duplicate/re-download, multi-PDF ZIPs, concurrent requests, and anonymous trial reset/bypass behavior.
3. Audit the customer-facing website copy across Product, Convert, Validate, Bulk, Pricing, Sign in, and Privacy for a consistent simple SaaS message. Keep implementation/security details out of marketing copy unless they are useful to customers.
4. Privacy page should remain factually accurate but be concise; retain detailed technical/compliance facts in project/compliance documentation rather than the primary customer-facing page. Do not invent retention periods, controller details, or legal claims.
5. Confirm the final commercial quota/pricing decisions before enabling live payments. No Stripe/live payments yet.
6. For every genuine failure: reproduce -> root cause -> smallest fix -> focused regression -> full CI -> normal merge -> production deploy -> retest.
7. Do not touch Microsoft OAuth, Resend, database schema, or unrelated functionality unless proven necessary.

## Process rule
GitHub is the shared source of truth. Update this file and issue #23 after every completed task. Do not ask the user to relay information between agents.
