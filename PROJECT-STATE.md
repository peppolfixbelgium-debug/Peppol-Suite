# Peppol Suite — Project State

Last updated: 2026-09-15

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
- DQM / program quality gate: #28
- R&D / Product Intelligence issue: #25
- Stripe workstream issue: #24
- Growth / Customer Evidence issue: #26
- Production platform: Vercel + Neon PostgreSQL
- Do not expose credentials or secrets.

## Current repository checkpoint — 2026-09-15
- **Current `main`: `5480097f0721587b8391b1977769622032928f26`**, merge of PR #44 (Stripe test-mode rebase onto current pricing main).
- PR #44 passed current-main CI #108 before merge and was merged without activating live Stripe.
- Post-merge Vercel status for `5480097f…` is successful. Post-merge main CI remains a verification gate; do not claim full GREEN until its run completes successfully.
- Stale duplicate Stripe PR #31 is closed without merge.

## Governance / DQM
- **AMBER:** CEO HQ Delivery & Quality Manager model is active via Issue #28.
- GREEN requires independent evidence against the Definition of Done; implementers are not sole authority for completion.
- Claims/legal-surface consistency is a mandatory quality gate: implementation ↔ production behavior ↔ product copy ↔ Terms ↔ Privacy ↔ Security.

## Product / Engineering / Production QA
- **AMBER:** core auth/conversion/bulk/freemium foundation remains supported by merged PRs #18/#19/#20 and quota-concurrency regression work in #40.
- OAuth remains frozen after prior real-browser PASS; no diagnostics should be reintroduced.
- **P0 evidence gap:** production 3-PDF + bulk-ZIP real-browser E2E pack; success/failure/retry/duplicate/re-download/concurrency quota semantics; anonymous-trial bypass/reset resistance; customer-facing copy/config regression.
- Issues #34/#36 explicitly document environment limitations: no repository PDF/ZIP samples and no connector capability to perform the complete authenticated browser upload flow. Do not fabricate PASS from API-only checks.
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
- Pricing implementation was merged in PR #43 at `9d5d477…`; production pricing still requires independent production verification.

## Stripe
- **AMBER / test-mode integrated:** PR #44 merged current-main Stripe Checkout/Portal/webhook test-mode implementation at `5480097f…`.
- Current implementation includes server-side price mapping, authenticated same-origin Checkout, test-key enforcement, signed webhook verification, live-event rejection, event-id idempotency, and billing persistence.
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
1. Verify post-merge main CI and production deployment for `5480097f…`.
2. Engineering/DQM: close production E2E and remaining quota/anonymous-trial verification using independently available evidence; obtain/execute real-browser sample pack when environment permits.
3. Legal/DQM: close claims + Terms/Privacy/Security/Cookie audit and professional-review queue.
4. Pricing/Product: verify production pricing against Founder-approved baseline.
5. Growth: continue prospect qualification and discovery; seek strongest willingness-to-pay evidence without live outbound until approved.
6. Company: obtain professional confirmation of ownership/operator eligibility and tax/VAT/employment/IP boundaries.
7. First payment only after the launch gate is GREEN and required Founder/legal/company/tax approvals are obtained.

## Founder approvals / escalation gates
- No approval required for routine execution.
- Escalate only material/irreversible decisions: final ownership/company structure; tax/VAT/legal conclusions; material pricing changes; first live outbound where approval is required; live Stripe activation/go-live.

## Process rule
GitHub is the shared source of truth. Update this file and Issue #23 after every completed task, meaningful decision, blocker, or cross-team dependency. Never claim GREEN without evidence.
