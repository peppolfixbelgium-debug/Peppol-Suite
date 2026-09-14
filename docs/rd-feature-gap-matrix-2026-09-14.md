# R&D / Product Intelligence — Feature Gap Matrix — 2026-09-14

Purpose: evidence-based launch prioritization for Peppol Suite. This is a research artifact, not an implementation backlog.

## Evidence set
- Peppolio: validation, plain-language reports, batch upload, conversion, UBL viewer, edit/fix, UBL↔CII and UBL→PDF tooling. https://www.peppolio.com/
- Peppol Validator: free/no-signup BIS Billing 3.0 + EN16931 validation, batch validation, shareable results, UBL/CII support. https://peppolvalidator.com/
- UBLExplain: browser-local validation/error explanation, UBL viewer, totals/VAT checks, field explainer and Peppol BIS checks. https://ublexplainer.com/
- InvoiceValidator.eu: UBL/CII/Factur-X validation, ZIP up to 200 invoices, plain-language rule explanations, rule reference library and auto-fix. https://invoicevalidator.eu/
- e-invoice.be: PDF→UBL conversion, XML→PDF viewer/converter, validation and Peppol API/delivery. https://e-invoice.be/

## Matrix

| Capability | Current competitive evidence | Peppol Suite launch position | Priority | Recommendation |
|---|---|---|---|---|
| Basic Peppol/UBL validation | Multiple free tools already provide this | Core existing capability | P0 reliability | KEEP + harden; do not add parity-only scope |
| Plain-language validation errors | Peppolio, Peppol Validator, UBLExplain, InvoiceValidator.eu | Strategic direction | P1 | TEST with real users; differentiate on actionability, not explanation alone |
| Guided fix suggestions | InvoiceValidator.eu auto-fix; Peppolio edit/fix | Opportunity if safely scoped | P1 | BUILD only for deterministic/high-confidence fixes after evidence; otherwise TEST guidance first |
| Revalidation after fix | Natural workflow extension, not unique alone | Fits focused utility | P1 | TEST; make fix→revalidate a single workflow |
| UBL/XML readable inspection | UBLExplain/Peppolio and other viewers | Existing product direction | P0/P1 | KEEP; improve clarity only if it materially reduces troubleshooting time |
| PDF→UBL conversion | e-invoice.be and Peppolio provide conversion | Existing conversion focus | P1 | TEST accuracy and workflow value; avoid competing on generic OCR alone |
| XML/UBL→PDF | e-invoice.be and Peppolio provide it | Useful utility | P1/P2 | DEFER unless customer interviews show frequent need |
| Batch validation | Peppol Validator, InvoiceValidator.eu, Peppolio | Bulk capability exists | P0 reliability | KEEP + verify quota/concurrency; no parity rewrite |
| Bulk conversion | Competitors increasingly offer batch/conversion | Existing bulk direction | P1 | KEEP; prioritize reliability and transparent per-document accounting |
| History/export | Common workflow utility; less commoditized than validation itself | Existing direction | P1 | KEEP; focus on evidence trail and useful exports |
| Shareable validation results | Peppol Validator offers shareable links | Not required for launch | P2 | TEST only with accountant/team evidence |
| Accountant multi-document workflow | Broad suites such as Yuki/Accountable support accountant workflows | Potential channel wedge | P1 | TEST with 5–10 accountant conversations before build |
| Peppol sending/receiving | Accountable, Billit, Teamleader and e-invoice.be already offer it | Not launch differentiator | PARK | REJECT for launch unless customer evidence makes it P0/P1 |
| Full accounting/bookkeeping | Accountable/Yuki/Teamleader and others | Outside focused utility | PARK | REJECT before first-customer evidence |
| Banking/tax/CRM | Broad suites bundle these | Outside scope | PARK | REJECT |
| Full Access Point stack | Infrastructure/API providers compete here | High complexity and compliance surface | PARK | REJECT before first-customer evidence |
| Developer API/integrations | e-invoice.be and mature platforms provide APIs/integrations | Future expansion | P2 | DEFER until repeated customer demand |

## P0 / P1 / P2 / PARK

### P0 — launch protection
1. Existing validation/conversion/bulk reliability.
2. Production E2E and quota semantics owned by Engineering/DQM.
3. No R&D feature addition is currently justified as a new P0.

### P1 — evidence-gated differentiation
1. Guided troubleshooting: failed rule → affected field → plain-language cause → actionable fix guidance → revalidate.
2. Deterministic safe auto-fix for narrowly bounded, reversible errors only if customer evidence and engineering safety review support it.
3. Accountant-oriented repeat workflow/reporting if interviews demonstrate recurring multi-document pain.
4. Conversion workflow improvements only where accuracy/reviewability can be demonstrated.

### P2 — after first-customer evidence
- API/integrations.
- Shareable validation evidence.
- Deeper workflow automation.
- XML→PDF and broader format utilities where demand is demonstrated.

### PARK / REJECT before evidence
- Generic accounting suite.
- Banking.
- CRM.
- Tax filing.
- Full Peppol Access Point / sending-receiving stack.
- Broad speculative integrations.

## Customer-validation test
Before Engineering starts P1 work, Growth/R&D should validate with Belgian accountants/bookkeepers/SMEs:
1. What document rejection/error problem occurs repeatedly?
2. How long does diagnosis/fixing currently take?
3. What tools are used today?
4. Is the pain frequent enough to pay to reduce?
5. Would a fix→revalidate workflow save measurable time?
6. Is multi-client/accountant reporting a recurring need?

Success criterion: repeated pain from multiple qualified prospects plus a credible willingness-to-pay signal. Competitor feature presence alone is insufficient.

## Decision
R&D GREEN for the research deliverable. No new engineering feature is mandated by this matrix. Launch remains protected while customer evidence is gathered in parallel.
