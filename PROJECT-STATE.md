# Peppol Suite — Project State

Last updated: 2026-09-13

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
- R&D / Product Intelligence issue: #25
- Stripe workstream issue: #24
- Production platform: Vercel + Neon PostgreSQL
- Do not expose credentials or secrets.

## Current repository checkpoint — 2026-09-13
- **Current `main`: `94f596faab4e6ec5c5a1b3737c24a5dce8e63b1c`** (`docs: sync project state to current main checkpoint`).
- This is documentation/checkpoint work, not a new product implementation.
- **Vercel status for exact `94f596f`: SUCCESS** (`Deployment has completed`, 2026-09-13 12:26:15Z). This is deployment evidence for the exact commit, not proof of full production QA readiness.
- GitHub Actions workflow runs for exact `94f596f` are **none**; no fresh CI pass is claimed for this docs-only commit.
- Latest substantive CI evidence remains **run #85 — SUCCESS** for PR #20 branch commit `127bc6d…` from 2026-09-11.

## Stripe checkpoint — 2026-09-13
- **GREEN:** architecture/specification complete.
- **GREEN:** existing-schema dependency audit complete; existing `plans`, `users.plan_id`, `subscriptions`, and `usage_quota` confirmed. Current subscription schema is not yet sufficient for full launch-grade Stripe event/audit/org billing, so any implementation must extend it minimally.
- **AMBER:** test-mode implementation remains to be executed and verified.
- **RED:** live activation intentionally OFF pending company/legal/tax/accounting gates.
- Founder-approved commercial baseline: Anonymous 3 units/month; Free 5 units/month; Pro €14.90/month or €149/year with 100 document + 500 bulk document units; Business €44.90/month or €449/year with 1,000 document + 10,000 bulk document units.

## Other launch state
- **Legal/GDPR: RED** — implementation and professional review remain outstanding.
- **Company/Ownership: AMBER/decision pending professional advice** — do not convert working direction into a legal decision without professional confirmation.
- **R&D/Product Intelligence: GREEN for initial market scan** — no P0 competitor feature gap identified.
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
