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
- Clean main deployment completed before current QA cycle.
- Conversion and usage Vercel request adapters fixed and regression-tested.
- Production authenticated conversion recorded successfully: invoice `INV-2026-0412`, supplier `Acme Atelier BV`, customer `Studio Nord SRL`, total `1512.5000 EUR`, status `ok`, issue_count `0`.
- PR #17 fixed two remaining Vercel Node/Web request adapter failures in API-key/admin endpoints; merged normally and deployed. This was discovered during Phase 1 QA, not an OAuth change.

## Current production
- Latest production deployment: `dpl_6hHZVC3HYPXs6Zj52zVLf1wmSaJz`
- Main commit: `4251560bc6dd93c824cf5c2620434cca72d0d0e5`
- State: READY
- Canonical URL: `https://peppol-suite.vercel.app`

## Current QA findings
- Google OAuth: real-browser PASS; do not modify OAuth behavior.
- Authenticated `/api/conversions` and `/api/usage`: production PASS on authenticated browser flow.
- Unauthenticated `/api/conversions` and `/api/usage`: expected 401 PASS.
- Anonymous browser-side PDF processing exists with a 20 MB PDF and 50-page limit.
- Anonymous trial quota is currently client-side/local-state based and needs audit before final entitlement design.
- Free plan currently has 5 monthly conversions and 1 monthly bulk operation in the seeded production plan; final commercial numbers are not yet approved.
- Bulk route currently performs PDF extraction/conversion in browser and increments server-side bulk usage per processed PDF, subject to the user's bulk allowance.
- Conversion history stores metadata, not PDF/XML files.

## Next work
1. Audit existing freemium/product implementation before changing quotas/pricing.
2. Audit quota semantics for success, failure, retry, bulk, duplicate/re-download, and concurrency.
3. Audit Privacy page against actual implementation and correct factual inaccuracies; flag legal/business questions.
4. Continue production QA using the existing three PDF regression samples and bulk ZIP sample pack.
5. For every genuine failure: reproduce -> root cause -> smallest fix -> focused regression -> full CI -> normal merge -> production deploy -> retest.
6. No Stripe/live payments yet.
7. Do not touch Microsoft OAuth, Resend, database schema, or unrelated functionality unless proven necessary.

## Process rule
GitHub is the shared source of truth. Update this file and issue #23 after every completed task. Do not ask the user to relay information between agents.
