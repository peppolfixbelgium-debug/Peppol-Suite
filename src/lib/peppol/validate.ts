import { isValidBeVat, normalizeBeVat, parseAmount } from "@/lib/utils";
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

export function validateInvoice(data: InvoiceData): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!data.invoiceNumber.value.trim()) {
    issues.push(err("BR-02", "Invoice number is missing.", "EN16931 requires BT-1 Invoice number."));
  }
  if (!ISO_DATE.test(data.issueDate.value)) {
    issues.push(err("BR-03", "Issue date must be YYYY-MM-DD.", "Use an ISO date, e.g. 2026-04-12."));
  }
  if (data.dueDate.value && !ISO_DATE.test(data.dueDate.value)) {
    issues.push(err("BR-CO-25", "Due date must be YYYY-MM-DD.", "Leave blank or use an ISO date."));
  }
  if (ISO_DATE.test(data.issueDate.value) && ISO_DATE.test(data.dueDate.value)) {
    if (data.dueDate.value < data.issueDate.value) {
      issues.push(err("DATE-01", "Due date is before the issue date.", "Payment terms cannot end before the invoice is issued."));
    }
  }
  if (!CURRENCY.test(data.currency.value)) {
    issues.push(err("BR-05", "Currency must be a 3-letter ISO code.", "Belgian Peppol invoices almost always use EUR."));
  }

  if (!data.supplierName.value.trim()) {
    issues.push(err("BR-06", "Seller name is missing.", "Add the legal name of the supplier (BT-27)."));
  }
  if (!data.customerName.value.trim()) {
    issues.push(err("BR-11", "Buyer name is missing.", "Add the legal name of the customer (BT-44)."));
  }

  checkVat(data.supplierVat.value, "seller", issues);
  checkVat(data.customerVat.value, "buyer", issues);

  if (!COUNTRY.test(data.supplierCountry.value)) {
    issues.push(err("BR-09", "Seller country must be a 2-letter ISO code.", "Use BE for Belgium."));
  }
  if (!COUNTRY.test(data.customerCountry.value)) {
    issues.push(err("BR-14", "Buyer country must be a 2-letter ISO code.", "Use BE for Belgium."));
  }
  if (data.supplierPostal.value && !/^\d{4}$/.test(data.supplierPostal.value) && data.supplierCountry.value === "BE") {
    issues.push(warn("ADDR-01", "Seller postal code does not look Belgian.", "Belgian postcodes are 4 digits."));
  }
  if (data.customerPostal.value && !/^\d{4}$/.test(data.customerPostal.value) && data.customerCountry.value === "BE") {
    issues.push(warn("ADDR-02", "Buyer postal code does not look Belgian.", "Belgian postcodes are 4 digits."));
  }

  const net = parseAmount(data.netAmount.value);
  const vat = parseAmount(data.vatAmount.value);
  const payable = parseAmount(data.payableAmount.value);

  if (net === null) issues.push(err("BR-14-AMT", "Net amount is missing or not a number.", "Enter the tax-exclusive total (BT-109)."));
  if (vat === null) issues.push(err("BR-CO-11", "VAT amount is missing or not a number.", "Enter the total VAT (BT-110)."));
  if (payable === null) issues.push(err("BR-15", "Payable amount is missing or not a number.", "Enter the amount to pay (BT-115)."));

  if (net !== null && vat !== null && payable !== null) {
    const sum = Math.round((net + vat) * 100) / 100;
    const pay = Math.round(payable * 100) / 100;
    if (Math.abs(sum - pay) > 0.05) {
      issues.push(
        err(
          "BR-CO-15",
          `Net (${net.toFixed(2)}) + VAT (${vat.toFixed(2)}) = ${sum.toFixed(2)}, but payable is ${pay.toFixed(2)}.`,
          "These three totals must add up. Fix the PDF fields before you send the XML.",
        ),
      );
    }
  }

  if (!data.lines.length) {
    issues.push(warn("LINE-00", "No invoice lines were found.", "Peppol invoices should include at least one InvoiceLine. We will emit a single catch-all line from the net amount."));
  } else {
    data.lines.forEach((line, i) => {
      if (!line.description.trim()) {
        issues.push(err("LINE-01", `Line ${i + 1} has no description.`, "Each line needs a name (BT-153)."));
      }
      const q = parseAmount(line.quantity);
      const p = parseAmount(line.unitPrice);
      const t = parseAmount(line.lineTotal);
      if (q === null || q <= 0) issues.push(err("LINE-02", `Line ${i + 1} quantity is invalid.`, "Quantity must be a positive number."));
      if (p === null) issues.push(err("LINE-03", `Line ${i + 1} unit price is invalid.`, "Unit price is required."));
      if (q !== null && p !== null && t !== null) {
        const expect = Math.round(q * p * 100) / 100;
        if (Math.abs(expect - t) > 0.05) {
          issues.push(
            warn(
              "LINE-04",
              `Line ${i + 1}: ${q} × ${p.toFixed(2)} = ${expect.toFixed(2)}, but line total is ${t.toFixed(2)}.`,
              "Line totals are tax-exclusive in UBL.",
            ),
          );
        }
      }
      const rate = Number(line.vatRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        issues.push(err("LINE-05", `Line ${i + 1} VAT rate is invalid.`, "Use 21, 12, 6 or 0 for Belgium."));
      }
    });

    if (net !== null) {
      const lineSum = data.lines.reduce((a, l) => a + (parseAmount(l.lineTotal) ?? 0), 0);
      if (Math.abs(lineSum - net) > 0.05) {
        issues.push(
          warn(
            "BR-CO-10",
            `Sum of line nets (${lineSum.toFixed(2)}) does not equal document net (${net.toFixed(2)}).`,
            "Check whether line totals include VAT — UBL line amounts are exclusive.",
          ),
        );
      }
    }
  }

  return { ok: issues.filter((i) => i.severity === "error").length === 0, issues };
}

function checkVat(raw: string, role: "seller" | "buyer", issues: ValidationIssue[]) {
  if (!raw.trim()) {
    issues.push(
      err(
        role === "seller" ? "BR-CO-09" : "BR-CO-26",
        `${role === "seller" ? "Seller" : "Buyer"} VAT number is missing.`,
        "Belgian Peppol parties use a BE + 10-digit VAT (scheme 0208 / 9925).",
      ),
    );
    return;
  }
  const vat = normalizeBeVat(raw);
  if (!/^BE\d{10}$/.test(vat)) {
    issues.push(
      err(
        "VAT-01",
        `${role} VAT “${raw}” is not BE + 10 digits.`,
        "Example: BE0123456789. Spaces and dots are stripped automatically.",
      ),
    );
    return;
  }
  if (!isValidBeVat(vat)) {
    issues.push(
      warn(
        "VAT-02",
        `${role} VAT ${vat} fails the Belgian 97-modulus checksum.`,
        "The last two digits should equal 97 − (first eight modulo 97). Confirm against the KBO.",
      ),
    );
  }
}

const UBL_REQUIRED = [
  { tag: "CustomizationID", hint: "Must identify EN16931 + Peppol BIS 3.0." },
  { tag: "ProfileID", hint: "Peppol billing profile 01:1.0." },
  { tag: "ID", hint: "Invoice number (BT-1)." },
  { tag: "IssueDate", hint: "Invoice issue date (BT-2)." },
  { tag: "InvoiceTypeCode", hint: "380 = commercial invoice." },
  { tag: "DocumentCurrencyCode", hint: "ISO currency, typically EUR." },
  { tag: "AccountingSupplierParty", hint: "Seller party is required." },
  { tag: "AccountingCustomerParty", hint: "Buyer party is required." },
  { tag: "LegalMonetaryTotal", hint: "Monetary totals are required." },
  { tag: "PayableAmount", hint: "Amount due (BT-115)." },
];

export function validateUblXml(xml: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const trimmed = xml.trim();
  if (!trimmed) {
    return {
      ok: false,
      issues: [err("XML-00", "No XML provided.", "Paste a UBL Invoice or upload a .xml file.")],
    };
  }
  if (!trimmed.startsWith("<")) {
    issues.push(err("XML-01", "This does not look like XML.", "A UBL invoice starts with <Invoice or an XML declaration."));
  }
  if (!/<Invoice[\s>]/i.test(trimmed) && !/Invoice-2/.test(trimmed)) {
    issues.push(err("XML-02", "Root element should be a UBL Invoice.", "Peppol BIS Billing 3.0 uses UBL 2.1 Invoice."));
  }
  for (const req of UBL_REQUIRED) {
    if (!trimmed.includes(req.tag)) {
      issues.push(err(`XML-${req.tag}`, `Missing <${req.tag}>.`, req.hint));
    }
  }
  if (!/urn:fdc:peppol\.eu:2017:poacc:billing:3\.0/.test(trimmed) && !/peppol.eu/.test(trimmed)) {
    issues.push(
      warn(
        "XML-PEPPOL",
        "CustomizationID does not mention Peppol BIS 3.0.",
        "Expected urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0",
      ),
    );
  }
  const payable = trimmed.match(/PayableAmount[^>]*>([^<]+)/);
  if (payable && parseAmount(payable[1]) === null) {
    issues.push(err("XML-AMT", "PayableAmount is not a number.", "Use a dot decimal, e.g. 1512.50"));
  }
  return { ok: issues.filter((i) => i.severity === "error").length === 0, issues };
}
