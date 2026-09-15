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
- **Current `main`: conversion-history export plus prior privacy/readability hardening, latest code commit `0009daa7502e5e5a23d87efd279738cc66777cd4`.**
- **CI #162 (`34960708705`) completed SUCCESS on the prior documented main checkpoint `240f4ae70b9268ed1440529afe412fef5fc7425c`.** All validation steps passed on that checkpoint.
- Added a client-side CSV export of the signed-in conversion history in `src/routes/dashboard.tsx` (`0009daa...`). This exposes the metadata already displayed by the authenticated history view without adding a server-side data collection path. It is a conversion-history export capability, not a claim that the full GDPR portability/deletion workflow is complete.
- Parser hardening covers invoice-number/date ordering, integer amounts, split-label invoice/purchase-order extraction, deterministic BPOST Description/Amount-excl-VAT extraction, and line-parser compatibility.
- Converter UX explicitly reports PASS/FAIL/NOT CHECKED, rejects empty/non-PDF/unreadable/non-invoice-looking uploads, and blocks invalid XML download.
- Bulk conversion reports explicit PASS/FAIL states and includes blocking validation codes rather than the generic `Has issues` label.
- Privacy readability was hardened without changing substantive privacy claims; the regression assertion was made whitespace-tolerant without weakening the storage claim.
- Production deployment must still be independently verified against the latest verified SHA before declaring production GREEN; the Vercel connector is currently unavailable for a fresh deployment check.

## Governance / DQM
- **AMBER:** CEO HQ Delivery & Quality Manager model is active via Issue #28.
- GREEN requires independent evidence against the Definition of Done; implementers are not sole authority for completion.
- Claims/legal-surface consistency is a mandatory quality gate: implementation ↔ production behavior ↔ product copy ↔ Terms ↔ Privacy ↔ Security.

## Product / Engineering / Production QA
- **AMBER:** repository implementation and deterministic CI are currently strong, but production evidence remains incomplete.
- OAuth remains frozen after prior real-browser PASS; no diagnostics should be reintroduced. Obsolete PR #8 is closed and must not be reopened or merged.
- PDF extraction limits remain 20 MB / 50 pages; scanned PDFs without extractable text are rejected with an explicit message.
- **P0 evidence gap:** production 3-PDF + bulk-ZIP real-browser E2E pack; success/failure/retry/duplicate/re-download/concurrency quota semantics; anonymous-trial bypass/reset resistance; customer-facing copy/config regression.
- Issues #34/#36 explicitly document environment limitations: the available connector cannot perform the complete authenticated browser upload flow with the user's local PDF/ZIP and authenticated browser cookie. Do not fabricate PASS from API-only checks.
- User-provided production screenshots show successful extraction of synthetic Belgian invoice fields and UBL XML generation; bulk screenshots require a fresh production run against the current deployment to prove current behavior.
- No full production READY claim until independent production evidence is current.

## Production entitlements
- Founder explicitly approved the live entitlement migration.
- Migration `159993ec-df65-4615-ba96-3ec32046825d` was applied to production Neon branch `br-young-heart-b1j6ptrm` and read-back verified.
- Verified: Free = 5 document / 0 bulk / API false; Pro (legacy `paid`) = 100 document / 500 bulk / API false; Business = 1,000 document / 10,000 bulk / API true.
- Issue #35 is closed as completed after production verification.

## Legal / GDPR
- **RED:** launch blocker.
- Mandatory audit includes: claim inventory; product-vs-promise verification; Terms; Privacy; Security; Cookie/consent; GDPR rights/deletion/export; retention; processors/subprocessors/DPA; liability/warranty/validation limitations; Peppol positioning; company identity/VAT/contact disclosures when known.
- Privacy page readability was hardened internally; this does not constitute professional legal review.
- Conversion-history CSV export is now available for authenticated users, but deletion, full-account export, retention and rights-request operations remain open and require further product/legal work.
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
- **RED/OFF:** live activation intentionally blocked pending company/legal/tax/accounting/pricing/go-live gates and explicit go-live approval.
- No live Stripe activation or live payment claim is permitted.

## Growth / Customer Evidence
- **AMBER:** discovery route is active; no live outbound has been sent.
- Apollo is connected but net-new People Search is blocked on the current Free plan; no paid upgrade/credit spend is authorized.
- Next proof is 20 qualified prospects plus personalized discovery outreach preparation, followed by Founder approval before first live outbound.

## R&D / Product Intelligence
- **GREEN for initial market scan and feature-gap decision set — 2026-09-14.** Generic Peppol sending/accounting is crowded; basic validation, explanation, batch validation and conversion are not sufficient standalone differentiation.
- Highest-value hypothesis remains workflow depth and trust: validate → understand → fix/convert → revalidate → export/history → bulk → accountant workflow.
- P1 feature implementation remains gated on customer evidence.

## Highest-value path to first paying customer
1. Verify current production deployment is serving the latest verified SHA.
2. Engineering/DQM: close production 3-PDF + bulk-ZIP real-browser E2E and remaining quota/anonymous-trial evidence.
3. Legal/DQM: close claims + Terms/Privacy/Security/Cookie audit and professional-review queue.
4. Pricing/Product: verify production pricing against Founder-approved baseline.
5. Growth: continue prospect qualification and discovery; no live outbound until approved.
6. Company: obtain professional confirmation of ownership/operator eligibility and tax/VAT/employment/IP boundaries.
7. First payment only after the launch gate is GREEN and required Founder/legal/company/tax approvals are obtained.

## Founder approvals / escalation gates
- No approval required for routine execution.
- Escalate only material/irreversible decisions: final ownership/company structure; tax/VAT/legal conclusions; material pricing changes; first live outbound where approval is required; live Stripe activation/go-live.

## Process rule
GitHub is the shared source of truth. Update this file and Issue #23 after every completed task, meaningful decision, blocker, or cross-team dependency. Never claim GREEN without evidence.
