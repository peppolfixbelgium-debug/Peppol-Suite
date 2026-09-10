import { isValidBeVat, isValidIban, normalizeBeVat, parseAmount } from "@/lib/utils";
import { calculateTotals, CUSTOMIZATION, PROFILE, lineNet } from "./xml";
import type { InvoiceData, ValidationIssue, ValidationResult } from "./types";

function err(code: string, message: string, hint: string): ValidationIssue {
  return { severity: "error", code, message, hint };
}
function warn(code: string, message: string, hint: string): ValidationIssue {
  return { severity: "warning", code, message, hint };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY = /^[A-Z]{2}$/;
const CURRENCY = /^[A-Z]{3}$/;
const INVOICE_TYPES = new Set(["380", "381"]);
const COMMON_UNECE_UNITS = new Set([
  "C62", "EA", "H87", "HUR", "KGM", "LTR", "MTR", "MTK", "MTQ", "DAY", "MON", "ANN", "MIN", "SEC",
  "KWH", "TNE", "KMT", "MMT", "MLT", "SET", "PR", "PA", "BX", "CT", "BO", "BG", "PK", "RO", "TU",
]);

export function validateInvoice(data: InvoiceData): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data.invoiceNumber.value.trim()) issues.push(err("BR-02", "Invoice number is missing.", "EN16931 BT-1 is mandatory."));
  if (!ISO_DATE.test(data.issueDate.value)) issues.push(err("BR-03", "Issue date must be YYYY-MM-DD.", "Use an ISO date."));
  if (data.dueDate.value && !ISO_DATE.test(data.dueDate.value)) issues.push(err("BR-CO-25", "Due date must be YYYY-MM-DD.", "Leave blank or use an ISO date."));
  if (ISO_DATE.test(data.issueDate.value) && ISO_DATE.test(data.dueDate.value) && data.dueDate.value < data.issueDate.value) {
    issues.push(err("DATE-01", "Due date is before the issue date.", "Payment due date cannot precede the invoice issue date."));
  }
  if (!INVOICE_TYPES.has(data.invoiceTypeCode.value || "380")) {
    issues.push(err("PEPPOL-P0100", `Document type code ${data.invoiceTypeCode.value} is not supported by this converter.`, "Use 380 for an invoice or 381 for a credit note."));
  }
  if (data.invoiceTypeCode.value === "381" && data.lines.some((line) => (parseAmount(line.quantity) ?? 0) === 0)) {
    issues.push(err("CN-LINE-01", "Credit note contains a zero quantity line.", "Credit note quantities must be non-zero."));
  }
  if (!CURRENCY.test(data.currency.value)) issues.push(err("BR-05", "Currency must be a 3-letter ISO code.", "Use an ISO 4217 currency code."));
  if (data.taxAccountingCurrency.value && data.taxAccountingCurrency.value === data.currency.value) {
    issues.push(err("PEPPOL-EN16931-R005", "Tax accounting currency must differ from invoice currency.", "Leave tax accounting currency blank or use a different currency."));
  }

  if (!data.supplierName.value.trim()) issues.push(err("BR-06", "Seller name is missing.", "Add the legal seller name."));
  if (!data.customerName.value.trim()) issues.push(err("BR-07", "Buyer name is missing.", "Add the legal buyer name."));
  if (!data.supplierStreet.value.trim() || !data.supplierPostal.value.trim() || !data.supplierCity.value.trim()) {
    issues.push(err("BR-08", "Seller postal address is incomplete.", "Provide street, postcode and city."));
  }
  if (!data.customerStreet.value.trim() || !data.customerPostal.value.trim() || !data.customerCity.value.trim()) {
    issues.push(err("BR-10", "Buyer postal address is incomplete.", "Provide street, postcode and city."));
  }

  checkCountry(data.supplierCountry.value, "seller", issues);
  checkCountry(data.customerCountry.value, "buyer", issues);
  checkVat(data.supplierVat.value, "seller", issues);
  checkVat(data.customerVat.value, "buyer", issues);

  if (data.supplierCountry.value === "BE" && data.supplierVat.value && !isValidBeVat(normalizeBeVat(data.supplierVat.value))) {
    issues.push(err("PEPPOL-COMMON-R043", "Seller Belgian enterprise number is invalid.", "The 0208 identifier must be 10 digits and satisfy the Belgian mod-97 rule."));
  }
  if (data.customerCountry.value === "BE" && data.customerVat.value && !isValidBeVat(normalizeBeVat(data.customerVat.value))) {
    issues.push(err("PEPPOL-COMMON-R043", "Buyer Belgian enterprise number is invalid.", "The 0208 identifier must be 10 digits and satisfy the Belgian mod-97 rule."));
  }

  if (!data.buyerReference.value.trim() && !data.orderReference.value.trim()) {
    issues.push(err("PEPPOL-EN16931-R003", "Buyer reference or purchase-order reference is missing.", "At least one of BT-10 Buyer reference or BT-13 Purchase order reference is required."));
  }

  const net = parseAmount(data.netAmount.value);
  const vat = parseAmount(data.vatAmount.value);
  const payable = parseAmount(data.payableAmount.value);
  if (net === null) issues.push(err("BR-13", "Invoice total without VAT is missing or invalid.", "This value must be derived from invoice lines and document allowances/charges."));
  if (vat === null) issues.push(err("BR-14", "Invoice total with VAT amount is missing or invalid.", "Provide the VAT total derived from the VAT breakdown."));
  if (payable === null) issues.push(err("BR-15", "Amount due is missing or invalid.", "Provide BT-115 after prepaid and rounding amounts."));

  if (!data.lines.length) {
    issues.push(err("BR-16", "No invoice lines were found.", "An Invoice must contain at least one InvoiceLine. The generator will not fabricate one."));
  }

  for (const [index, line] of data.lines.entries()) {
    const n = index + 1;
    if (!line.description.trim()) issues.push(err("LINE-01", `Line ${n} has no description.`, "Provide the item or service name."));
    const q = parseAmount(line.quantity);
    const p = parseAmount(line.unitPrice);
    const base = parseAmount(line.baseQuantity || "1");
    const reported = parseAmount(line.lineTotal);
    const isCreditNote = data.invoiceTypeCode.value === "381";
    if (q === null || (isCreditNote ? q === 0 : q <= 0)) issues.push(err("LINE-02", `Line ${n} quantity is invalid.`, isCreditNote ? "Credit note quantity must be non-zero." : "Quantity must be greater than zero."));
    if (p === null || p < 0) issues.push(err("LINE-03", `Line ${n} unit price is invalid.`, "Provide a non-negative unit price."));
    if (base === null || base <= 0) issues.push(err("LINE-06", `Line ${n} base quantity is invalid.`, "Price base quantity must be greater than zero."));
    if (reported === null) issues.push(err("LINE-04", `Line ${n} net line amount is missing or invalid.`, "Provide the reported tax-exclusive line amount."));
    if (q !== null && p !== null && base !== null && reported !== null) {
      const expected = Math.round(((q * p) / base) * 100) / 100;
      const allowance = parseAmount(line.allowanceAmount) ?? 0;
      const charge = parseAmount(line.chargeAmount) ?? 0;
      const expectedNet = Math.round((expected - allowance + charge) * 100) / 100;
      if (Math.abs(expectedNet - reported) > 0.01) {
        issues.push(err("BR-CO-11-LINE", `Line ${n} amount ${reported.toFixed(2)} does not equal quantity × price/base − allowance + charge (${expectedNet.toFixed(2)}).`, "Correct the extracted line data instead of silently recalculating it."));
      }
    }
    const rate = Number(line.vatRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) issues.push(err("LINE-05", `Line ${n} VAT rate is invalid.`, "Use a valid VAT percentage."));
    const unitCode = line.unitCode.trim().toUpperCase();
    if (!unitCode) issues.push(err("LINE-07", `Line ${n} unit code is missing.`, "Select a UN/ECE Rec 20 unit code."));
    else if (!COMMON_UNECE_UNITS.has(unitCode)) issues.push(warn("LINE-08", `Line ${n} unit code ${unitCode} is not in the local common-code set.`, "Verify it against UN/ECE Recommendation 20 before sending."));
  }

  const documentAllowance = parseAmount(data.documentAllowanceAmount.value) ?? 0;
  const documentCharge = parseAmount(data.documentChargeAmount.value) ?? 0;
  if (documentAllowance > 0 && !data.documentAllowanceVatRate.value.trim()) issues.push(err("BR-52", "Document allowance VAT rate is missing.", "Each document-level allowance needs its VAT category/rate."));
  if (documentCharge > 0 && !data.documentChargeVatRate.value.trim()) issues.push(err("BR-53", "Document charge VAT rate is missing.", "Each document-level charge needs its VAT category/rate."));
  const paymentCode = data.paymentMeansCode.value.trim();
  if (paymentCode && !/^\d{1,3}$/.test(paymentCode)) issues.push(err("BR-49", "Payment means code is invalid.", "Use a Peppol payment means code such as 30 or 58."));
  if (["30", "58"].includes(paymentCode) && !data.paymentAccount.value.trim()) issues.push(err("BR-50", "Payment account is missing for credit transfer.", "Provide the seller payee financial account / IBAN."));
  if (data.paymentAccount.value.trim() && /^BE/i.test(data.paymentAccount.value) && !isValidIban(data.paymentAccount.value)) {
    issues.push(err("IBAN-01", "The Belgian IBAN is invalid.", "Check the IBAN checksum and account digits before sending the invoice."));
  }

  if (data.lines.length) {
    const totals = calculateTotals(data);
    if (net !== null && Math.abs(totals.taxExclusive - net) > 0.01) issues.push(err("BR-CO-13", `BT-109 is ${net.toFixed(2)}, but line/VAT-level components produce ${totals.taxExclusive.toFixed(2)}.`, "Document total without VAT must equal line nets minus allowances plus charges."));
    if (vat !== null && Math.abs(totals.vat - vat) > 0.01) issues.push(err("BR-CO-14", `BT-110 is ${vat.toFixed(2)}, but VAT breakdowns produce ${totals.vat.toFixed(2)}.`, "VAT total must equal the sum of VAT category tax amounts."));
    if (payable !== null && Math.abs(totals.payable - payable) > 0.01) issues.push(err("BR-CO-16", `BT-115 is ${payable.toFixed(2)}, but calculated payable amount is ${totals.payable.toFixed(2)}.`, "Payable = tax-inclusive total − prepaid + rounding."));
  }

  return { ok: issues.every((i) => i.severity !== "error"), issues };
}

function checkCountry(raw: string, role: string, issues: ValidationIssue[]) {
  if (!COUNTRY.test(raw)) issues.push(err(role === "seller" ? "BR-09" : "BR-11", `${role} country must be a 2-letter ISO code.`, "Use e.g. BE."));
}

function checkVat(raw: string, role: "seller" | "buyer", issues: ValidationIssue[]) {
  if (!raw.trim()) {
    issues.push(err(role === "seller" ? "BR-CO-09" : "BR-CO-26", `${role} VAT number is missing.`, "Provide a valid party VAT identifier."));
    return;
  }
  const vat = normalizeBeVat(raw);
  if (!/^BE\d{10}$/.test(vat)) {
    issues.push(err("VAT-01", `${role} VAT ${raw} is not a Belgian 10-digit VAT number.`, "Use BE followed by 10 digits."));
    return;
  }
  if (!isValidBeVat(vat)) issues.push(err("VAT-02", `${role} VAT ${vat} fails the Belgian mod-97 checksum.`, "Correct the VAT/enterprise number before generating Peppol XML."));
}

const UBL_REQUIRED = [
  { tag: "CustomizationID", hint: "Must identify EN16931 + Peppol BIS Billing 3.0." },
  { tag: "ProfileID", hint: "Peppol billing profile 01:1.0." },
  { tag: "ID", hint: "Invoice number (BT-1)." },
  { tag: "IssueDate", hint: "Invoice issue date (BT-2)." },
  { tag: "InvoiceTypeCode", hint: "Invoice type code (BT-3)." },
  { tag: "DocumentCurrencyCode", hint: "Invoice currency code (BT-5)." },
  { tag: "AccountingSupplierParty", hint: "Seller party is required." },
  { tag: "AccountingCustomerParty", hint: "Buyer party is required." },
  { tag: "TaxTotal", hint: "VAT total and VAT category breakdown are required." },
  { tag: "LegalMonetaryTotal", hint: "Monetary totals are required." },
  { tag: "PayableAmount", hint: "Amount due (BT-115)." },
];

function xmlText(xml: string, tag: string): string[] {
  const re = new RegExp(`<(?:(?:cbc|cac):)?${tag}(?:\\s[^>]*)?>([^<]*)</(?:(?:cbc|cac):)?${tag}>`, "gi");
  return [...xml.matchAll(re)].map((m) => m[1].trim());
}

export function validateUblXml(xml: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const trimmed = xml.trim();
  if (!trimmed) return { ok: false, issues: [err("XML-00", "No XML provided.", "Paste or upload a UBL Invoice.")] };

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(trimmed, "application/xml");
    if (doc.querySelector("parsererror")) issues.push(err("XML-01", "XML is not well formed.", "Fix XML syntax before checking Peppol rules."));
  } else if (!trimmed.startsWith("<?xml") && !trimmed.startsWith("<Invoice")) {
    issues.push(err("XML-01", "This does not look like XML.", "A UBL Invoice starts with an XML declaration or Invoice root."));
  }

  const isCreditNote = /<CreditNote\b/i.test(trimmed);
  if ((!isCreditNote && !/<Invoice\b/i.test(trimmed)) || (isCreditNote && !/urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2/.test(trimmed)) || (!isCreditNote && !/urn:oasis:names:specification:ubl:schema:xsd:Invoice-2/.test(trimmed))) {
    issues.push(err("XML-02", "Root element is not a supported UBL 2.1 Invoice/CreditNote.", "Peppol BIS Billing 3.0 uses UBL 2.1 Invoice or CreditNote syntax."));
  }
  for (const req of UBL_REQUIRED) {
    if (req.tag === "InvoiceTypeCode") {
      const typeTag = isCreditNote ? "CreditNoteTypeCode" : "InvoiceTypeCode";
      if (!new RegExp(`<[^>]*${typeTag}\\b`, "i").test(trimmed)) issues.push(err(`XML-${typeTag}`, `Missing ${typeTag}.`, req.hint));
      continue;
    }
    if (!new RegExp(`<[^>]*${req.tag}\\b`, "i").test(trimmed)) issues.push(err(`XML-${req.tag}`, `Missing ${req.tag}.`, req.hint));
  }

  const customization = xmlText(trimmed, "CustomizationID")[0] ?? "";
  const profile = xmlText(trimmed, "ProfileID")[0] ?? "";
  if (customization !== CUSTOMIZATION) issues.push(err("PEPPOL-EN16931-R004", "CustomizationID is not the exact Peppol BIS Billing 3.0 identifier.", `Expected ${CUSTOMIZATION}`));
  if (profile !== PROFILE) issues.push(err("PEPPOL-EN16931-R001", "ProfileID is not the expected Billing 3.0 process identifier.", `Expected ${PROFILE}`));
  if (!xmlText(trimmed, "BuyerReference").length && !/<cac:OrderReference[\s\S]*?<cbc:ID>[^<]+<\/cbc:ID>[\s\S]*?<\/cac:OrderReference>/i.test(trimmed)) {
    issues.push(err("PEPPOL-EN16931-R003", "Buyer reference or purchase-order reference is missing.", "Provide cbc:BuyerReference or cac:OrderReference/cbc:ID."));
  }
  const endpoints = [...trimmed.matchAll(/<cbc:EndpointID\b[^>]*schemeID=["']0208["'][^>]*>(\d{10})<\/cbc:EndpointID>/gi)].map((m) => m[1]);
  if (endpoints.length < 2) {
    issues.push(err("PEPPOL-EN16931-R010/R020", "Seller and buyer electronic addresses are not both present as Belgian 0208 endpoints.", "Both parties need a valid electronic address."));
  }
  for (const endpoint of endpoints) {
    if (!isValidBeVat(`BE${endpoint}`)) issues.push(err("PEPPOL-COMMON-R043", `Belgian 0208 identifier ${endpoint} fails the mod-97 check.`, "Correct the enterprise number."));
  }
  if (/<(?:cbc:|cac:)[A-Za-z0-9]+(?:\s[^>]*)?\s*><\/(?:cbc:|cac:)[A-Za-z0-9]+>|<(?:cbc:|cac:)[A-Za-z0-9]+(?:\s[^>]*)?\s*\/>/i.test(trimmed)) {
    issues.push(err("PEPPOL-EN16931-R008", "XML contains an empty element.", "Peppol BIS forbids empty XML elements."));
  }

  const invoiceLines = [...trimmed.matchAll(/<cac:InvoiceLine\b/g)].length;
  const creditLines = [...trimmed.matchAll(/<cac:CreditNoteLine\b/g)].length;
  if ((!isCreditNote && !invoiceLines) || (isCreditNote && !creditLines)) issues.push(err("BR-16", "Document has no invoice line.", "At least one InvoiceLine or CreditNoteLine is mandatory."));

  const payable = xmlText(trimmed, "PayableAmount")[0];
  if (payable !== undefined && parseAmount(payable) === null) issues.push(err("XML-AMT", "PayableAmount is not numeric.", "Use a decimal amount."));

  return { ok: issues.every((i) => i.severity !== "error"), issues };
}
