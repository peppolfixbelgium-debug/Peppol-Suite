# Peppol Suite — Project State

## Current execution checkpoint
- Current main includes the latest engineering/pricing/legal/company preparation plus the Belgian prospect evidence pack at `9525b82ebbd36367de73ac571ab94784e03abc80`.
- Founder has now independently exercised the previously environment-blocked authenticated production browser flow using synthetic invoice fixtures on 2026-09-15.
- The first E2E fixture set reached extraction, validation and bulk UI paths, but the three nominally valid fixtures were not valid Peppol-ready invoices: they lacked required addresses/party VAT/reference/line/VAT/IBAN data and some Belgian VAT identifiers failed the local checksum. Therefore those screenshots are failure-path evidence, not successful conversion evidence.
- CI verification must be treated separately from documentation/evidence commits; no CI GREEN claim is made for the current docs checkpoint until a workflow is independently observed.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering remains evidence-gated until a successful production authenticated browser E2E can be independently evidenced using Peppol-valid synthetic invoices: PASS validation, XML download, bulk success, retry/duplicate/re-download semantics and quota behavior.
- Production authenticated browser execution is no longer an environment-only blocker: Founder supplied direct production screenshots proving the browser flow can be exercised. The remaining gap is successful PASS-path evidence with valid fixtures. API/database checks must still not be represented as authenticated UI PASS.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Company/ownership remains a professional confirmation gate; the working direction must not be treated as incorporated/legal fact.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized. Current public-web research provides a 10-prospect additional evidence cohort for founder-led discovery preparation.
- Production deployment still requires independent fresh verification against the latest verified SHA; no Vercel deployment GREEN claim is made without that evidence.

## E2E evidence checkpoint — 2026-09-15
- Founder tested PDFs 1–4 and two ZIP packs in the deployed authenticated browser.
- PDF 1: extracted E2E-VALID-001, supplier/customer, net 100.00 and amount due 121.00; UI showed FAIL with 9 blocking checks and displayed UBL XML preview.
- PDF 2: extracted E2E-VALID-002, net 250.00 and amount due 302.50; UI showed FAIL with 9 blocking checks.
- PDF 3: extracted E2E-VALID-003, net 80.00 and amount due 96.80; UI showed FAIL with 7 blocking checks and displayed UBL XML preview.
- PDF 4: negative/non-invoice fixture produced blocking validation checks as expected.
- Bulk ZIP: individual files were surfaced with explicit FAIL states and blocking-check summaries, including the duplicate file.
- Retry/duplicate ZIP: both attempts were surfaced with explicit FAIL states.
- Conclusion: production browser execution and failure-state handling are evidenced; successful PASS-path conversion is not yet evidenced because the first success fixtures were themselves invalid.
- Corrected success fixtures have been generated for the next Founder browser run with checksum-valid Belgian VAT numbers, complete seller/buyer addresses, PO references, VAT/totals, invoice lines and a checksum-valid Belgian IBAN.

## Operating rule
Execute → verify → commit → record evidence → move to the next blocker. Never claim GREEN without verifiable evidence.
