# Peppol Suite — Project State

## Current execution checkpoint
- Current main includes the latest engineering/pricing/legal/company preparation plus the Belgian prospect evidence pack at `9525b82ebbd36367de73ac571ab94784e03abc80`.
- Founder has now independently exercised the previously environment-blocked authenticated production browser flow using synthetic invoice fixtures on 2026-09-15.
- The first E2E fixture set reached extraction, validation and bulk UI paths, but the three nominally valid fixtures exposed a real production extraction defect: VAT amount could be populated from VAT-number digits and payment IBAN could be populated from a VAT-number/street collision.
- CI verification must be treated separately from documentation/evidence commits; no CI GREEN claim is made for the current checkpoint until a workflow is independently observed.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering remains evidence-gated until successful production authenticated browser E2E can be independently evidenced using Peppol-valid synthetic invoices: PASS validation, XML download, bulk success, retry/duplicate/re-download semantics and quota behavior.
- Production authenticated browser execution is no longer an environment-only blocker: Founder supplied direct production screenshots proving the browser flow can be exercised. The remaining blocker is successful PASS-path evidence after the extraction fix is deployed.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Company/ownership remains a professional confirmation gate; the working direction must not be treated as incorporated/legal fact.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized. Current public-web research provides a 10-prospect additional evidence cohort for founder-led discovery preparation.
- Production deployment still requires independent fresh verification against the latest verified SHA; no Vercel deployment GREEN claim is made without that evidence.

## E2E evidence checkpoint — 2026-09-15
- Founder tested three single-PDF fixtures plus two ZIP packs in the deployed authenticated browser.
- PDFs 1–3 extracted the expected invoice/party/net/payable fields, but all failed on a common extraction collision: VAT amount was populated with VAT-number digits and payment account showed a VAT-number/street-derived value. The UI therefore reported `BR-CO-14` and `IBAN-01` blockers instead of PASS.
- Bulk ZIP surfaced all individual files with explicit FAIL states and the same blocking checks, including the duplicate file.
- Retry/duplicate ZIP surfaced both attempts with explicit FAIL states.
- These screenshots are valid evidence of the production browser flow and the defect; they are not successful conversion evidence.
- Root cause was identified in `src/lib/peppol/extract.ts`.
- Fix committed on main at `31bdae0488e47831e9710e03bec13a880cb38ad9`: VAT extraction now ignores VAT-number/BE-number lines; IBAN extraction validates candidates with the existing IBAN mod-97 validator before accepting one.
- Regression coverage was added and corrected at `72c0b76c61737eeda7e91668ab29302fec54703d`, covering the exact VAT-number/IBAN collision pattern.
- Remaining verification: independently observe CI/build, deploy the latest main SHA, rerun the three corrected single-PDF fixtures, then rerun bulk and retry/duplicate packs. Do not mark production PASS/GREEN until those browser results are observed.

## Operating rule
Execute → verify → commit → record evidence → move to the next blocker. Never claim GREEN without verifiable evidence.
