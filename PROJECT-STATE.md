# Peppol Suite — Project State

Last updated: 2026-09-14

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
- DQM / program quality gate: #28
- R&D / Product Intelligence issue: #25
- Stripe workstream issue: #24
- Growth / Customer Evidence issue: #26
- Active pricing verification: PR #43
- Production platform: Vercel + Neon PostgreSQL
- Do not expose credentials or secrets.

## Current repository checkpoint — 2026-09-14 21:22 CEST
- **Current `main`: `2126d82563fe53018161361429f8ec48c21294e6`**, merge of PR #41 (`ci: validate main branch on every push`).
- PR #41 was independently validated: GitHub Actions `validate` completed successfully on commit `43fa4b19…` before merge. Vercel preview check also passed.
- Main-branch CI verification is now enabled by the merged workflow change. A fresh CI run is queued for active pricing PR #43 on its current head `e87ce25…`.
- Stale duplicate CI/pricing PRs #30, #27 and #32 have been closed; the active paths are now #43 for pricing and #31 for Stripe test-mode.

## Governance / DQM
- **AMBER:** CEO HQ Delivery & Quality Manager model is active via Issue #28.
- GREEN requires independent evidence against the Definition of Done; implementers are not sole authority for completion.
- Claims/legal-surface consistency is a mandatory quality gate: implementation ↔ production behavior ↔ product copy ↔ Terms ↔ Privacy ↔ Security.

## Product / Engineering / Production QA
- **AMBER:** core auth/conversion/bulk/freemium foundation remains supported by merged PRs #18/#19/#20 and quota-concurrency regression work merged in #40.
- OAuth remains frozen after prior real-browser PASS; no diagnostics should be reintroduced.
- Remaining P0 verification: production 3-PDF + bulk-ZIP E2E pack; success/failure/retry/duplicate/re-download/concurrency quota semantics; anonymous-trial bypass/reset resistance; customer-facing copy/config regression.
- No full production READY claim until these are independently evidenced.

## Legal / GDPR
- **RED:** launch blocker.
- Mandatory audit includes: claim inventory; product-vs-promise verification; Terms; Privacy; Security; Cookie/consent; GDPR rights/deletion/export; retention; processors/subprocessors/DPA; liability/warranty/validation limitations; Peppol positioning; company identity/VAT/contact disclosures when known.
- Privacy page readability is a specific UX requirement: simplify/restructure excessive density without omitting legally required substance.
- Internal fixes must be separated from items requiring Belgian/EU lawyer/accountant confirmation.

## Company / Ownership
- **AMBER:** working direction remains a genuinely wife-owned/operated Belgian company, subject to professional confirmation.
- Required confirmation before commercial activity: ownership/control, director/active-partner eligibility, residence/professional-card implications, UBO, VAT/tax/accounting, and Founder employment/IP/conflict boundaries.
- Do not convert this working direction into a legal decision without professional advice.

## Pricing
- **AMBER:** Founder-approved commercial baseline is fixed and must not be silently changed.
- Anonymous: 3 document units/month.
- Free: 5 document units/month.
- Pro: €14.90/month or €149/year; 100 document units + 500 bulk document units.
- Business: €44.90/month or €449/year; 1,000 document units + 10,000 bulk units.
- **PR #43 OPEN:** current-main pricing implementation. CI is required before merge; no production pricing GREEN claim yet.

## Stripe
- **GREEN:** architecture/specification and existing-schema dependency audit.
- **AMBER:** PR #31 contains test-mode Checkout/Portal/webhook lifecycle implementation; its prior CI evidence passed on the older main base and it still requires current-base integration/reverification.
- **RED/OFF:** live activation intentionally blocked pending company/legal/tax/accounting/pricing gates and explicit go-live approval.
- No live Stripe activation or live payment claim is permitted.

## Growth / Customer Evidence
- **AMBER:** discovery route is active; no live outbound has been sent.
- Apollo is connected but net-new People Search is blocked on the current Free plan; no paid upgrade/credit spend is authorized.
- Early high-fit Belgian prospects have been identified; next proof is 20 qualified prospects plus personalized discovery outreach preparation, followed by Founder approval before first live outbound.

## R&D / Product Intelligence
- **GREEN for initial market scan and feature-gap decision set — 2026-09-14.** Generic Peppol sending/accounting is crowded; basic validation, batch validation, explanation and conversion are not sufficient standalone differentiation.
- Highest-value hypothesis remains workflow depth and trust: validate → understand → fix/convert → revalidate → export/history → bulk → accountant workflow.
- P1 feature implementation remains gated on customer evidence.

## Highest-value path to first paying customer
1. Engineering/DQM: close production E2E and remaining quota/anonymous-trial verification.
2. Legal/DQM: close claims + Terms/Privacy/Security/Cookie audit and professional-review queue.
3. Pricing/Product: verify and merge PR #43, then verify production pricing.
4. Growth: continue prospect qualification and discovery; seek strongest willingness-to-pay evidence.
5. Company: obtain professional confirmation of ownership/operator eligibility and tax/VAT/employment/IP boundaries.
6. Stripe: rebase/reverify PR #31 against current main; keep live OFF.
7. First payment only after the launch gate is GREEN and required Founder/legal/company/tax approvals are obtained.

## Founder approvals / escalation gates
- No approval required for routine execution.
- Escalate only material/irreversible decisions: final ownership/company structure; tax/VAT/legal conclusions; material pricing changes; first live outbound where approval is required; live Stripe activation/go-live.

## Process rule
GitHub is the shared source of truth. Update this file and Issue #23 after every completed task, meaningful decision, blocker, or cross-team dependency. Never claim GREEN without evidence.
