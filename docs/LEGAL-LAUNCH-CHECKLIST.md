# Peppol Suite — Legal & Launch Readiness Checklist

This is an internal launch-control artifact. It records what can be completed in-product and what requires a Belgian/EU professional review. It must not be treated as legal advice or as proof of compliance.

## Technical facts already reflected in product copy

- PDF parsing is performed client-side for the current single-file and bulk conversion flows.
- Uploaded PDF bodies and generated XML bodies are not stored in the account database by the current implementation.
- Signed-in conversion history stores metadata such as invoice number, supplier/customer names, totals, currency, status, issue count and creation time.
- Signed-in users can export conversion-history metadata as CSV and delete conversion-history records scoped to their own account.
- Authentication uses Google or email/password today; additional providers are not represented as active processing partners.
- Production hosting uses Vercel and signed-in account/quota/history data uses Neon PostgreSQL.
- Live payment processing is disabled.
- Peppol Suite is positioned as a document conversion/validation utility, not as a certified Peppol Access Point, accountant, legal adviser, or tax authority service.

## Professional-review gates — must be confirmed before public commercial launch

### Privacy / GDPR
- [ ] Confirm legal entity/controller identity and registered/contact details.
- [ ] Confirm purposes and legal bases for every personal-data processing activity.
- [ ] Confirm retention periods for account, authentication, audit and conversion-history metadata.
- [ ] Confirm data-subject access, rectification, deletion, restriction, objection and portability procedures.
- [ ] Define and approve the operational process for privacy requests and account deletion.
- [ ] Confirm processors/subprocessors, roles, DPAs and international-transfer mechanisms.
- [ ] Confirm cookie/local-storage inventory and consent requirements.
- [ ] Confirm whether a DPIA or other privacy assessment is required.

### Terms / commercial
- [ ] Confirm contracting entity and jurisdiction details.
- [ ] Confirm B2B/B2C scope and any mandatory consumer requirements before consumer checkout is enabled.
- [ ] Confirm limitation-of-liability, warranty, acceptable-use and indemnity language.
- [ ] Confirm commercial cancellation/refund/renewal language before live payments.
- [ ] Confirm tax/VAT wording and invoice obligations.

### Peppol / product positioning
- [ ] Confirm wording around Peppol BIS/UBL generation and validation.
- [ ] Confirm no wording implies certified Access Point status or guaranteed network/tax acceptance.
- [ ] Confirm customer responsibility for source-data accuracy and final submission.

## Company / tax gates — external confirmation required

- [ ] Confirm Belgian company structure, ownership/control and director/active-partner requirements.
- [ ] Confirm UBO, registration, VAT and social-insurance obligations.
- [ ] Confirm founder employment-contract/IP/conflict restrictions before commercial operation.
- [ ] Confirm remuneration, related-party and cross-border tax treatment where applicable.

## Payment activation gate

Live payment processing remains OFF until the professional legal/company/tax review is complete and the Founder explicitly authorizes activation. Test-mode Stripe controls remain part of the engineering regression suite.

## Evidence rule

Do not mark any unchecked professional-review item as GREEN based only on product code, automated tests, or model analysis.
