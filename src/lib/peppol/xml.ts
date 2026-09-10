import { enterpriseNumber, isValidBeVat, moneyString, normalizeBeVat, parseAmount, xmlEscape } from "@/lib/utils";
import type { InvoiceData, InvoiceLine } from "./types";

export const CUSTOMIZATION =
  "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
export const PROFILE = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

function cbc(tag: string, value: string, attrs: Record<string, string> = {}) {
  if (!value) return "";
  const a = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${xmlEscape(v)}"`)
    .join("");
  return `    <cbc:${tag}${a}>${xmlEscape(value)}</cbc:${tag}>`;
}

function amount(raw: string): number {
  return parseAmount(raw) ?? 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineNet(line: InvoiceLine): number {
  const qty = amount(line.quantity);
  const price = amount(line.unitPrice);
  const base = amount(line.baseQuantity || "1") || 1;
  const allowance = amount(line.allowanceAmount);
  const charge = amount(line.chargeAmount);
  return round2((qty * price) / base - allowance + charge);
}

function partyXml(role: "AccountingSupplierParty" | "AccountingCustomerParty", data: InvoiceData, which: "supplier" | "customer") {
  const name = which === "supplier" ? data.supplierName.value : data.customerName.value;
  const rawVat = which === "supplier" ? data.supplierVat.value : data.customerVat.value;
  const vat = normalizeBeVat(rawVat);
  const street = which === "supplier" ? data.supplierStreet.value : data.customerStreet.value;
  const city = which === "supplier" ? data.supplierCity.value : data.customerCity.value;
  const postal = which === "supplier" ? data.supplierPostal.value : data.customerPostal.value;
  const country = (which === "supplier" ? data.supplierCountry.value : data.customerCountry.value).toUpperCase();
  const endpoint = country === "BE" && isValidBeVat(vat) ? enterpriseNumber(vat) : "";
  const endpointXml = endpoint ? cbc("EndpointID", endpoint, { schemeID: "0208" }) : "";
  const legalId = endpoint ? cbc("CompanyID", endpoint, { schemeID: "0208" }) : "";

  return `  <cac:${role}>
    <cac:Party>
${endpointXml}
      <cac:PartyName>
${cbc("Name", name)}
      </cac:PartyName>
      <cac:PostalAddress>
${cbc("StreetName", street)}
${cbc("CityName", city)}
${cbc("PostalZone", postal)}
        <cac:Country>
${cbc("IdentificationCode", country)}
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
${cbc("CompanyID", vat)}
        <cac:TaxScheme>
${cbc("ID", "VAT")}
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
${cbc("RegistrationName", name)}
${legalId}
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:${role}>`;
}

function taxCategory(rate: string, indent = "        ") {
  const numeric = amount(rate);
  const id = numeric === 0 ? "Z" : "S";
  return `${indent}<cbc:ID>${xmlEscape(id)}</cbc:ID>
${indent}${cbc("Percent", moneyString(numeric)).trimStart()}
${indent}  <cac:TaxScheme>
${indent}${cbc("ID", "VAT").trimStart()}
${indent}  </cac:TaxScheme>`;
}

function lineAllowanceCharge(line: InvoiceLine, currency: string) {
  const blocks: string[] = [];
  const allowance = amount(line.allowanceAmount);
  const charge = amount(line.chargeAmount);
  if (allowance > 0) {
    blocks.push(`      <cac:AllowanceCharge>
${cbc("ChargeIndicator", "false")}
${cbc("Amount", moneyString(allowance), { currencyID: currency })}
      </cac:AllowanceCharge>`);
  }
  if (charge > 0) {
    blocks.push(`      <cac:AllowanceCharge>
${cbc("ChargeIndicator", "true")}
${cbc("Amount", moneyString(charge), { currencyID: currency })}
      </cac:AllowanceCharge>`);
  }
  return blocks.join("\n");
}

function lineXml(line: InvoiceLine, index: number, currency: string, creditNote: boolean) {
  const qty = amount(line.quantity);
  const unit = amount(line.unitPrice);
  const base = amount(line.baseQuantity || "1") || 1;
  const net = lineNet(line);
  const rate = line.vatRate;
  const unitCode = line.unitCode || "C62";
  const root = creditNote ? "CreditNoteLine" : "InvoiceLine";
  const quantityTag = creditNote ? "CreditedQuantity" : "InvoicedQuantity";
  return `  <cac:${root}>
${cbc("ID", String(index + 1))}
${cbc(quantityTag, moneyString(qty), { unitCode, unitCodeListID: "UNECERec20" })}
${cbc("LineExtensionAmount", moneyString(net), { currencyID: currency })}
${lineAllowanceCharge(line, currency)}
    <cac:Item>
${cbc("Name", line.description)}
      <cac:ClassifiedTaxCategory>
${taxCategory(rate, "        ")}
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
${cbc("PriceAmount", moneyString(Math.abs(unit)), { currencyID: currency })}
${base !== 1 ? cbc("BaseQuantity", moneyString(base), { unitCode, unitCodeListID: "UNECERec20" }) : ""}
    </cac:Price>
  </cac:${root}>`;
}
function groupedVat(data: InvoiceData) {
  const groups = new Map<string, number>();
  for (const line of data.lines) {
    const rate = String(amount(line.vatRate));
    groups.set(rate, round2((groups.get(rate) ?? 0) + lineNet(line)));
  }
  const allowance = amount(data.documentAllowanceAmount.value);
  const allowanceRate = data.documentAllowanceVatRate.value.trim();
  if (allowance > 0 && allowanceRate) {
    const rate = String(amount(allowanceRate));
    groups.set(rate, round2((groups.get(rate) ?? 0) - allowance));
  }
  const charge = amount(data.documentChargeAmount.value);
  const chargeRate = data.documentChargeVatRate.value.trim();
  if (charge > 0 && chargeRate) {
    const rate = String(amount(chargeRate));
    groups.set(rate, round2((groups.get(rate) ?? 0) + charge));
  }
  return [...groups.entries()].map(([rate, taxable]) => ({
    rate,
    taxable,
    tax: round2((taxable * amount(rate)) / 100),
  }));
}

function documentAllowanceCharge(data: InvoiceData, currency: string) {
  const blocks: string[] = [];
  const allowance = amount(data.documentAllowanceAmount.value);
  const charge = amount(data.documentChargeAmount.value);
  if (allowance > 0) {
    blocks.push(`  <cac:AllowanceCharge>\n${cbc("ChargeIndicator", "false")}\n${cbc("Amount", moneyString(allowance), { currencyID: currency })}\n${taxCategory(data.documentAllowanceVatRate.value || "0", "    ")}\n  </cac:AllowanceCharge>`);
  }
  if (charge > 0) {
    blocks.push(`  <cac:AllowanceCharge>\n${cbc("ChargeIndicator", "true")}\n${cbc("Amount", moneyString(charge), { currencyID: currency })}\n${taxCategory(data.documentChargeVatRate.value || "0", "    ")}\n  </cac:AllowanceCharge>`);
  }
  return blocks.join("\n");
}

export function calculateTotals(data: InvoiceData) {
  const lineNetTotal = round2(data.lines.reduce((sum, line) => sum + lineNet(line), 0));
  const allowance = round2(amount(data.documentAllowanceAmount.value));
  const charge = round2(amount(data.documentChargeAmount.value));
  const taxExclusive = round2(lineNetTotal - allowance + charge);
  const vatBreakdown = groupedVat(data);
  const vat = round2(vatBreakdown.reduce((sum, group) => sum + group.tax, 0));
  const taxInclusive = round2(taxExclusive + vat);
  const prepaid = round2(amount(data.prepaidAmount.value));
  const rounding = round2(amount(data.roundingAmount.value));
  const payable = round2(taxInclusive - prepaid + rounding);
  return { lineNetTotal, allowance, charge, taxExclusive, vatBreakdown, vat, taxInclusive, prepaid, rounding, payable };
}

export function buildUblXml(data: InvoiceData): string {
  const currency = data.currency.value || "EUR";
  const totals = calculateTotals(data);
  const vatXml = totals.vatBreakdown
    .map(
      (group) => `    <cac:TaxSubtotal>
${cbc("TaxableAmount", moneyString(group.taxable), { currencyID: currency })}
${cbc("TaxAmount", moneyString(group.tax), { currencyID: currency })}
${taxCategory(group.rate, "      ")}
    </cac:TaxSubtotal>`,
    )
    .join("\n");

  const buyerReference = data.buyerReference.value.trim();
  const orderReference = data.orderReference.value.trim();
  const paymentReference = data.paymentReference.value.trim();
  const paymentMeansCode = data.paymentMeansCode.value.trim();
  const paymentAccount = data.paymentAccount.value.trim();
  const taxAccountingCurrency = data.taxAccountingCurrency.value.trim();

  const paymentXml = paymentMeansCode
    ? `  <cac:PaymentMeans>
${cbc("PaymentMeansCode", paymentMeansCode)}
${data.dueDate.value ? cbc("PaymentDueDate", data.dueDate.value) : ""}
${paymentReference ? cbc("PaymentID", paymentReference) : ""}
${paymentAccount ? `    <cac:PayeeFinancialAccount>\n${cbc("ID", paymentAccount)}\n    </cac:PayeeFinancialAccount>` : ""}
  </cac:PaymentMeans>`
    : "";

  const creditNote = data.invoiceTypeCode.value === "381";
  const root = creditNote ? "CreditNote" : "Invoice";
  const rootNs = creditNote ? "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" : "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
  const lines = data.lines.map((line, i) => lineXml(line, i, currency, creditNote)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<${root} xmlns="${rootNs}"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
${cbc("CustomizationID", CUSTOMIZATION)}
${cbc("ProfileID", PROFILE)}
${cbc("ID", data.invoiceNumber.value)}
${cbc("IssueDate", data.issueDate.value)}
${cbc("DueDate", data.dueDate.value)}
${cbc(creditNote ? "CreditNoteTypeCode" : "InvoiceTypeCode", data.invoiceTypeCode.value || "380")}
${cbc("DocumentCurrencyCode", currency)}
${taxAccountingCurrency && taxAccountingCurrency !== currency ? cbc("TaxCurrencyCode", taxAccountingCurrency) : ""}
${cbc("BuyerReference", buyerReference)}
${orderReference ? `  <cac:OrderReference>\n${cbc("ID", orderReference)}\n  </cac:OrderReference>` : ""}
${data.notes ? cbc("Note", data.notes) : ""}
${partyXml("AccountingSupplierParty", data, "supplier")}
${partyXml("AccountingCustomerParty", data, "customer")}
${paymentXml}
${documentAllowanceCharge(data, currency)}
  <cac:TaxTotal>
${cbc("TaxAmount", moneyString(totals.vat), { currencyID: currency })}
${vatXml}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
${cbc("LineExtensionAmount", moneyString(totals.lineNetTotal), { currencyID: currency })}
${totals.allowance ? cbc("AllowanceTotalAmount", moneyString(totals.allowance), { currencyID: currency }) : ""}
${totals.charge ? cbc("ChargeTotalAmount", moneyString(totals.charge), { currencyID: currency }) : ""}
${cbc("TaxExclusiveAmount", moneyString(totals.taxExclusive), { currencyID: currency })}
${cbc("TaxInclusiveAmount", moneyString(totals.taxInclusive), { currencyID: currency })}
${totals.prepaid ? cbc("PrepaidAmount", moneyString(totals.prepaid), { currencyID: currency }) : ""}
${totals.rounding ? cbc("PayableRoundingAmount", moneyString(totals.rounding), { currencyID: currency }) : ""}
${cbc("PayableAmount", moneyString(totals.payable), { currencyID: currency })}
  </cac:LegalMonetaryTotal>
${lines}
</${root}>
`;
}

export function suggestedFilename(data: InvoiceData) {
  const id = (data.invoiceNumber.value || "invoice").replace(/[^\w.-]+/g, "_");
  return `${id}.xml`;
}
