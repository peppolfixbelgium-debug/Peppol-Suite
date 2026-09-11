import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractInvoice } from "@/lib/peppol/extract";
import { validateInvoice, validateUblXml } from "@/lib/peppol/validate";
import { buildUblXml, calculateTotals } from "@/lib/peppol/xml";
import { isValidIban } from "@/lib/utils";

const callbackSource = readFileSync("api/auth/oauth/google/callback.ts", "utf8");
assert.ok(!callbackSource.includes("google_oauth_browser_discrepancy"));
assert.ok(!callbackSource.includes("google_oauth_token_exchange_diagnostic"));

const sample = `FACTUUR / FACTURE
Acme Atelier BV
Korenmarkt 12
9000 Gent
België
BTW BE 1234.567.894
IBAN BE68 5390 0754 7034
Factuurnummer: INV-2026-0412
Factuurdatum: 12/04/2026
Vervaldatum: 12/05/2026
Referentie klant: PO-2026-0412
Klant
Studio Nord SRL
Rue de la Loi 24
1000 Bruxelles
BTW BE 9876.543.265
Grafisch ontwerp website 1 1000.00 21% 1000.00
Hosting Q2 2026 1 250.00 21% 250.00
Subtotaal excl. BTW 1250.00
BTW 21% 262.50
Totaal te betalen EUR 1512.50`;

const data = extractInvoice(sample);
assert.equal(data.lines.length, 2);
assert.equal(data.buyerReference.value, "PO-2026-0412");
assert.equal(data.lines[0].lineTotal, "1000.00");
assert.equal(validateInvoice(data).ok, true);
assert.deepEqual(calculateTotals(data), {
  lineNetTotal: 1250,
  allowance: 0,
  charge: 0,
  taxExclusive: 1250,
  vatBreakdown: [{ rate: "21", taxable: 1250, tax: 262.5 }],
  vat: 262.5,
  taxInclusive: 1512.5,
  prepaid: 0,
  rounding: 0,
  payable: 1512.5,
});

const xml = buildUblXml(data);
assert.equal((xml.match(/<cac:InvoiceLine\b/g) || []).length, 2);
assert.equal((xml.match(/<cac:TaxSubtotal>/g) || []).length, 1);
assert.match(xml, /<cbc:BuyerReference>PO-2026-0412<\/cbc:BuyerReference>/);
assert.match(xml, /<cbc:EndpointID schemeID="0208">1234567894<\/cbc:EndpointID>/);
assert.match(xml, /<cbc:EndpointID schemeID="0208">9876543265<\/cbc:EndpointID>/);
assert.equal(validateUblXml(xml).ok, true);
assert.equal(isValidIban("BE68 5390 0754 7034"), true);

const bpost = extractInvoice(`BPOST NV\nMuntstraat 1, 1000 Brussels\nBE 0200.123.456\nInvoice #INV-2026-001\nDate: 15/08/2026\nBill to: Jan Peeters, BE 0550.123.456\nIBAN: BE71 0961 2345 6789\nDescription: Postal services\nAmount excl VAT: 100 EUR\nVAT 21%: 21 EUR\nTotal: 121 EUR`);
assert.equal(bpost.invoiceNumber.value, "INV-2026-001");
assert.equal(bpost.issueDate.value, "2026-08-15");
assert.equal(bpost.lines.length, 1);
assert.equal(bpost.lines[0].lineTotal, "100.00");
assert.equal(bpost.supplierVat.value, "BE0200123456");
assert.equal(bpost.customerVat.value, "BE0550123456");
assert.equal(validateInvoice(bpost).ok, false);
assert.ok(validateInvoice(bpost).issues.some((i) => i.code === "PEPPOL-COMMON-R043"));
assert.ok(validateInvoice(bpost).issues.some((i) => i.code === "IBAN-01"));

const noLines = structuredClone(data);
noLines.lines = [];
assert.ok(validateInvoice(noLines).issues.some((i) => i.code === "BR-16"));
assert.ok(!buildUblXml(noLines).includes("<cac:InvoiceLine>"));

const multi = structuredClone(data);
multi.lines[1].vatRate = "6";
multi.vatAmount.value = "225.00";
multi.payableAmount.value = "1475.00";
assert.equal(validateInvoice(multi).ok, true);
assert.equal((buildUblXml(multi).match(/<cac:TaxSubtotal>/g) || []).length, 2);

const credit = structuredClone(data);
credit.invoiceTypeCode.value = "381";
credit.lines[0].quantity = "-1";
credit.lines[0].lineTotal = "-1000.00";
credit.lines[1].quantity = "-1";
credit.lines[1].lineTotal = "-250.00";
credit.netAmount.value = "-1250.00";
credit.vatAmount.value = "-262.50";
credit.payableAmount.value = "-1512.50";
assert.equal(validateInvoice(credit).ok, true);
const creditXml = buildUblXml(credit);
assert.match(creditXml, /<CreditNote\b/);
assert.match(creditXml, /<cbc:CreditNoteTypeCode>381<\/cbc:CreditNoteTypeCode>/);
assert.equal((creditXml.match(/<cac:CreditNoteLine\b/g) || []).length, 2);
console.log("CREDIT XML:", creditXml);
console.log("CREDIT XML VALIDATION:", validateUblXml(creditXml));
assert.equal(validateUblXml(creditXml).ok, true);

const bad = validateUblXml("<Invoice><cbc:CustomizationID>wrong</cbc:CustomizationID></Invoice>");
assert.equal(bad.ok, false);
assert.ok(bad.issues.some((i) => i.code === "PEPPOL-EN16931-R004"));

console.log("REGRESSION PASS");
