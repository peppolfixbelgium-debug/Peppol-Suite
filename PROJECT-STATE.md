# Peppol Suite — Project State

Last updated: 2026-09-14

## Source of truth
- GitHub repository: `peppolfixbelgium-debug/Peppol-Suite`
- Master development + production QA issue: #23
- DQM / program quality gate: #28
- R&D / Product Intelligence issue: #25
- Stripe workstream issue: #24
- Growth / Customer Evidence issue: #26
- Pricing fix: PR #27
- Production platform: Vercel + Neon PostgreSQL
- Do not expose credentials or secrets.

## Current repository checkpoint — 2026-09-14 04:56 CEST
- **Current `main`: `d16cda4488e99b6ce7dcc32ba678f7f1114c0351`** (`docs: update project state for CEO HQ checkpoint`).
- Recent `main` commits since the prior checkpoint are documentation/state synchronization only; no new substantive product implementation is verified.
- GitHub reports no workflow runs attached to the current docs commit, so this checkpoint does not claim fresh CI for `d16cda4` or infer production readiness from commit/deployment state alone.
- Latest substantive CI evidence remains **run #85 — SUCCESS** for PR #20 branch commit `127bc6d…` from 2026-09-11.

## Governance / DQM
- **AMBER:** CEO HQ Delivery & Quality Manager model is active via Issue #28.
- GREEN requires independent evidence against the Definition of Done; implementers are not sole authority for completion.
- Claims/legal-surface consistency is a mandatory quality gate: implementation ↔ production behavior ↔ product copy ↔ Terms ↔ Privacy ↔ Security.

## Product / Engineering / Production QA
- **AMBER:** core auth/conversion/bulk/freemium foundation remains supported by prior verified evidence from PRs #18/#19/#20.
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
- Business: €44.90/month or €449/year; 1,000 document units + 10,000 bulk document units.
- **PR #27 remains OPEN and UNMERGED**; therefore production pricing is not yet independently verified as corrected.

## Stripe
- **GREEN:** architecture/specification and existing-schema dependency audit.
- **AMBER:** test-mode implementation and lifecycle/security verification remain.
- **RED/OFF:** live activation intentionally blocked pending company/legal/tax/accounting/pricing gates and explicit go-live approval.
- No live Stripe activation or live payment claim is permitted.

## Growth / Customer Evidence
- **AMBER:** discovery route is active; no live outbound has been sent.
- Apollo is connected but net-new People Search is blocked on the current Free plan; no paid upgrade/credit spend is authorized.
- Free/public prospecting route has verified high-fit early Belgian prospects including Leuven Accountants, Impacct Accountants, Mijnboekhouder.eu and VP Accountants. CBE/KBO must be used only for targeted legitimate searches, not systematic scraping/reuse.
- Next commercial proof: expand to 20 qualified prospects, capture pain hypothesis/contact/source, prepare personalized discovery outreach, then obtain Founder approval before first live outbound.

## R&D / Product Intelligence
- **GREEN for initial market scan and feature-gap decision set — 2026-09-14.** Current research confirms the generic Peppol sending/accounting market is crowded and that free validation itself is increasingly commoditized. The strongest defensible launch hypothesis remains a focused document-problem workflow: validate → inspect/understand → explain errors → fix/convert → revalidate → export/history → bulk → accountant workflow.
- Completed R&D matrix decision set: P0 = existing reliability/launch gates only; P1 = guided validation troubleshooting and accountant multi-document workflow/reporting, but only after customer evidence/effort check; P2 = API/integrations/deeper workflow automation after evidence; PARK = generic accounting, banking, CRM, tax filing and full Access Point/sending-receiving stack before first-customer evidence.
- Current competitor evidence reviewed 2026-09-14: Peppolio combines validation, plain-language reports, batch processing and conversion; Peppol Validator offers free no-signup batch validation and shareable results; UBLExplain focuses browser-local validation/error explanation/viewer/checkers; InvoiceValidator.eu combines rule explanations, ZIP validation and auto-fix; e-invoice.be offers PDF→UBL conversion, validation and Peppol API/delivery. These establish that basic validation, batch validation, explanation and conversion are no longer sufficient as standalone differentiation.
- R&D therefore recommends prioritizing workflow depth and trust: actionable fix guidance tied to exact validation findings, safe revalidation, transparent processing/privacy behavior, useful history/export, and accountant-oriented repeat workflows. No engineering implementation is requested from R&D solely from competitor parity.
- Customer-validation requirement remains open: test whether Belgian accountants/bookkeepers/SMEs will pay for reducing document rejection/troubleshooting time before adding P1 scope.

## Highest-value path to first paying customer
1. Engineering/DQM: close production E2E and quota/anonymous-trial verification.
2. Legal/DQM: close claims + Terms/Privacy/Security/Cookie audit and professional-review queue.
3. Pricing/Product: verify and merge PR #27, then verify production pricing.
4. Growth: continue prospect qualification and discovery in parallel; seek strongest willingness-to-pay evidence.
5. Company: obtain professional confirmation of wife ownership/operator eligibility and tax/VAT/employment/IP boundaries.
6. Stripe: finish test-mode lifecycle/security; keep live OFF.
7. First payment only after the launch gate is GREEN and required Founder/legal/company/tax approvals are obtained.

## Founder approvals / escalation gates
- No approval required for routine execution.
- Escalate only material/irreversible decisions: final ownership/company structure; tax/VAT/legal conclusions; material pricing changes; first live outbound where approval is required; live Stripe activation/go-live.

## Process rule
GitHub is the shared source of truth. Update this file and Issue #23 after every completed task, meaningful decision, blocker, or cross-team dependency. Never claim GREEN without evidence.
