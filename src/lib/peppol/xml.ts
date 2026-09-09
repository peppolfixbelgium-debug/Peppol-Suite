import { xmlEscape, normalizeBeVat, enterpriseNumber, parseAmount, moneyString } from "@/lib/utils";
import type { InvoiceData, InvoiceLine } from "./types";

const CUSTOMIZATION =
  "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
const PROFILE = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

function cbc(tag: string, value: string, attrs: Record<string, string> = {}) {
  if (!value) return "";
  const a = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${xmlEscape(v)}"`)
    .join("");
  return `    <cbc:${tag}${a}>${xmlEscape(value)}</cbc:${tag}>`;
}

function partyXml(role: "AccountingSupplierParty" | "AccountingCustomerParty", data: InvoiceData, which: "supplier" | "customer") {
  const name = which === "supplier" ? data.supplierName.value : data.customerName.value;
  const vat = normalizeBeVat(which === "supplier" ? data.supplierVat.value : data.customerVat.value);
  const street = which === "supplier" ? data.supplierStreet.value : data.customerStreet.value;
  const city = which === "supplier" ? data.supplierCity.value : data.customerCity.value;
  const postal = which === "supplier" ? data.supplierPostal.value : data.customerPostal.value;
  const country = (which === "supplier" ? data.supplierCountry.value : data.customerCountry.value) || "BE";
  const endpoint = enterpriseNumber(vat) || vat.replace(/^BE/, "");
  return `  <cac:${role}>
    <cac:Party>
      <cbc:EndpointID schemeID="0208">${xmlEscape(endpoint)}</cbc:EndpointID>
      <cac:PartyName>
        <cbc:Name>${xmlEscape(name)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
${cbc("StreetName", street)}
${cbc("CityName", city)}
${cbc("PostalZone", postal)}
        <cac:Country>
          <cbc:IdentificationCode>${xmlEscape(country)}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${xmlEscape(vat)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${xmlEscape(name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeID="0208">${xmlEscape(endpoint)}</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:${role}>`;
}

function taxCategory(rate: string) {
  return `        <cac:TaxCategory>
          <cbc:ID>${Number(rate) === 0 ? "Z" : "S"}</cbc:ID>
          <cbc:Percent>${xmlEscape(rate || "21")}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>`;
}

function lineXml(line: InvoiceLine, index: number, currency: string) {
  const qty = parseAmount(line.quantity) ?? 1;
  const unit = parseAmount(line.unitPrice) ?? 0;
  const net = parseAmount(line.lineTotal) ?? qty * unit;
  const rate = line.vatRate || "21";
  return `  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">${xmlEscape(String(qty))}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${xmlEscape(currency)}">${moneyString(net)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${xmlEscape(line.description || `Line ${index + 1}`)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${Number(rate) === 0 ? "Z" : "S"}</cbc:ID>
        <cbc:Percent>${xmlEscape(rate)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${xmlEscape(currency)}">${moneyString(unit)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
}

export function buildUblXml(data: InvoiceData): string {
  const currency = data.currency.value || "EUR";
  const net = moneyString(parseAmount(data.netAmount.value) ?? 0);
  const vat = moneyString(parseAmount(data.vatAmount.value) ?? 0);
  const payable = moneyString(parseAmount(data.payableAmount.value) ?? 0);
  const rate =
    data.lines[0]?.vatRate ||
    (() => {
      const n = parseAmount(data.netAmount.value) ?? 0;
      const v = parseAmount(data.vatAmount.value) ?? 0;
      if (n > 0) return moneyString((v / n) * 100).replace(/\.00$/, "");
      return "21";
    })();

  const lines = (data.lines.length
    ? data.lines
    : [
        {
          description: data.notes || "Invoice line",
          quantity: "1",
          unitPrice: net,
          vatRate: rate,
          lineTotal: net,
        },
      ]
  ).map((l, i) => lineXml(l, i, currency));

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>${CUSTOMIZATION}</cbc:CustomizationID>
  <cbc:ProfileID>${PROFILE}</cbc:ProfileID>
  <cbc:ID>${xmlEscape(data.invoiceNumber.value || "DRAFT")}</cbc:ID>
  <cbc:IssueDate>${xmlEscape(data.issueDate.value)}</cbc:IssueDate>
${data.dueDate.value ? `  <cbc:DueDate>${xmlEscape(data.dueDate.value)}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${xmlEscape(currency)}</cbc:DocumentCurrencyCode>
${data.notes ? `  <cbc:Note>${xmlEscape(data.notes)}</cbc:Note>` : ""}
${partyXml("AccountingSupplierParty", data, "supplier")}
${partyXml("AccountingCustomerParty", data, "customer")}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${xmlEscape(currency)}">${vat}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${xmlEscape(currency)}">${net}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${xmlEscape(currency)}">${vat}</cbc:TaxAmount>
${taxCategory(rate)}
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${xmlEscape(currency)}">${net}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${xmlEscape(currency)}">${net}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${xmlEscape(currency)}">${payable}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${xmlEscape(currency)}">${payable}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines.join("\n")}
</Invoice>
`;
}

export function suggestedFilename(data: InvoiceData) {
  const id = (data.invoiceNumber.value || "invoice").replace(/[^\w.-]+/g, "_");
  return `${id}.xml`;
}
