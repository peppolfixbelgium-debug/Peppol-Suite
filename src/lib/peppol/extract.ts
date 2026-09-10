import { EMPTY_INVOICE, type Confidence, type InvoiceData, type InvoiceField, type InvoiceLine } from "./types";
import { moneyString, normalizeBeVat, parseAmount, toIsoDate } from "@/lib/utils";

function field(value: string, confidence: Confidence): InvoiceField { return { value, confidence }; }
function firstMatch(text: string, patterns: RegExp[]): { value: string; confidence: Confidence } | null {
  for (const p of patterns) {
    const m = p.exec(text);
    if (m?.[1]) return { value: m[1].trim(), confidence: "high" };
  }
  return null;
}

const INVOICE_NO_PATTERNS = [
  /\b(INV[-/]\d{2,4}[-/]?\d{2,})\b/i,
  /(?:factuurnummer|factuurnr\.?|invoice\s*(?:number|no\.?|#)|n[°oº]\s*(?:de\s*)?facture|num[eé]ro\s*(?:de\s*)?facture)\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i,
];
const ISSUE_DATE_PATTERNS = [/(?:factuurdatum|invoice\s*date|issue\s*date|date\s*(?:de\s*)?facture|(?<!verval)\bdate)\s*[:.]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})/i];
const DUE_DATE_PATTERNS = [/(?:vervaldatum|due\s*date|date\s*[eé]ch[eé]ance|[eé]ch[eé]ance|betaaldatum|payment\s*due)\s*[:.]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})/i];
const BUYER_REF_PATTERNS = [/(?:buyer\s*reference|buyer\s*ref\.?|referentie\s*(?:klant|koper)|klantreferentie|r[ée]f[ée]rence\s*(?:client|acheteur))\s*[:#.]?\s*([^\n]+)/i];
const ORDER_REF_PATTERNS = [/(?:purchase\s*order|po\s*(?:number|no\.?|#)?|order\s*(?:number|no\.?|#)|bestelbon|bon\s*de\s*commande)\s*[:#.]?\s*([A-Z0-9][A-Z0-9/_-]{1,})/i];
const PAYMENT_REF_PATTERNS = [/(?:payment\s*reference|gestructureerde\s*mededeling|structured\s*communication|communication\s*structur[ée]e|mededeling)\s*[:#.]?\s*([^\n]+)/i];
const IBAN_PATTERNS = [/\b([A-Z]{2}\d{2}[A-Z0-9]{11,30})\b/gi];
const VAT_PATTERN = /\b(?:BTW|TVA|VAT|BE)\s*:?[\s./-]*(BE)?([0-9]{3,4}[\s./-]?[0-9]{3}[\s./-]?[0-9]{3})\b/gi;
const NET_PATTERNS = [/(?:subtotaal(?:\s*excl\.?\s*btw)?|subtotal(?:\s*excl\.?\s*vat)?|hors\s*tva|net\s*(?:amount|total)|totaal\s*excl)/i];
const VAT_AMT_PATTERNS = [/^\s*(?:btw|tva|vat)\s+\d{1,2}\s*%/i];
const PAY_PATTERNS = [/(?:totaal\s*te\s*betalen|total\s*(?:due|payable|te\s*betalen)|montant\s*[aà]\s*payer|grand\s*total|te\s*betalen)/i];

function collectVats(text: string): string[] {
  const found: string[] = [];
  const re = new RegExp(VAT_PATTERN.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) found.push(normalizeBeVat((m[1] ?? "BE") + m[2]));
  return [...new Set(found)];
}

function splitParties(text: string): { supplier: string; customer: string } {
  const match = text.match(/(?:^|\n)\s*(?:klant|client|customer|factuur\s*aan|bill\s*to|facture\s*[aà]|destinataire)\s*[:\-]?\s*/i);
  if (!match || match.index === undefined) return { supplier: text, customer: "" };
  return { supplier: text.slice(0, match.index), customer: text.slice(match.index + match[0].length) };
}

function extractName(block: string): string {
  const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean).filter((l) =>
    !/^(factuur|facture|invoice|btw|tva|vat|belgi)/i.test(l) && !/^\d{4}\b/.test(l) && l.length > 2 && l.length < 100,
  );
  const company = lines.find((l) => /\b(BV|NV|SRL|SA|BVBA|VOF|CommV|CVBA|ASBL|VZW|LTD|LLC)\b/i.test(l));
  return (company ?? lines[0] ?? "").replace(/\s+/g, " ");
}
function extractStreet(block: string): string {
  const m = block.match(/([A-Za-zÀ-ÿ'’.,\- ]+\s+\d+[A-Za-z]?(?:\s*(?:bus|bte|box)\s*\d+)?)/);
  return m?.[1]?.trim() ?? "";
}
function extractCity(block: string) {
  const be = block.match(/\b(\d{4})\s+([A-Za-zÀ-ÿ'’\- ]{2,40})\b/);
  return { postal: be?.[1] ?? "", city: be?.[2]?.trim() ?? "", country: /belgi|belgium|belgique/i.test(block) ? "BE" : "BE" };
}
function extractAmountAfter(text: string, patterns: RegExp[]): string {
  for (const line of text.split(/\n/)) {
    if (!patterns.some((p) => p.test(line))) continue;
    const nums = [...line.matchAll(/(\d{1,3}(?:[.,\s]\d{3})*[.,]\d{2}|\d+[.,]\d{2})/g)];
    const last = nums.at(-1)?.[1];
    if (last) return moneyString(parseAmount(last) ?? 0);
  }
  return "";
}

function extractLines(text: string): InvoiceLine[] {
  const lines: InvoiceLine[] = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.trim();
    if (!line || line.length < 8) continue;
    if (/subtotaal|totaal te betalen|totaal excl|bedankt|thank|omschrijving|description/i.test(line)) continue;
    const m = line.match(/^(.{3,100}?)\s+(\d+(?:[.,]\d+)?)\s+([A-Za-z]{2,6})?\s*(\d+(?:[.,]\d{2}))\s+(\d{1,2})\s*%?\s+(\d+(?:[.,]\d{2}))$/);
    if (!m) continue;
    const qty = parseAmount(m[2]);
    const unitCode = (m[3] ?? "C62").toUpperCase();
    const unit = parseAmount(m[4]);
    const vatRate = String(Number(m[5]));
    const reported = parseAmount(m[6]);
    if (qty === null || unit === null || reported === null) continue;
    lines.push({
      description: m[1].replace(/\s+/g, " ").trim(),
      quantity: String(qty),
      unitCode,
      unitPrice: moneyString(unit),
      baseQuantity: "1",
      vatRate,
      lineTotal: moneyString(reported),
      allowanceAmount: "0.00",
      chargeAmount: "0.00",
    });
  }
  if (!lines.length) {
    const description = firstMatch(text, [/(?:description|omschrijving|d[ée]signation)\s*[:#]?\s*([^\n]+)/i]);
    const amount = firstMatch(text, [/(?:amount\s*excl\.?\s*vat|bedrag\s*excl\.?\s*btw|montant\s*hors\s*tva)\s*[:#]?\s*([0-9][0-9., ]*)/i]);
    const vat = text.match(/(?:vat|btw|tva)\s+(\d{1,2})\s*%/i);
    if (description?.value && amount?.value) {
      const unit = parseAmount(amount.value);
      if (unit !== null) {
        lines.push({
          description: description.value.replace(/\s+/g, " ").trim(),
          quantity: "1",
          unitCode: "C62",
          unitPrice: moneyString(unit),
          baseQuantity: "1",
          vatRate: vat?.[1] ?? "21",
          lineTotal: moneyString(unit),
          allowanceAmount: "0.00",
          chargeAmount: "0.00",
        });
      }
    }
  }
  return lines;
}

function guessCurrency(text: string): InvoiceField {
  if (/\bEUR\b|€/.test(text)) return field("EUR", "high");
  if (/\bUSD\b|\$/.test(text)) return field("USD", "medium");
  if (/\bGBP\b|£/.test(text)) return field("GBP", "medium");
  return field("EUR", "medium");
}

function collectIban(text: string): string {
  const m = new RegExp(IBAN_PATTERNS[0].source, "i").exec(text.replace(/\s+/g, ""));
  return m?.[1] ?? "";
}

export function extractInvoice(text: string): InvoiceData {
  const clean = text.replace(/\r/g, "").replace(/\u00a0/g, " ");
  const { supplier, customer } = splitParties(clean);
  const supplierVats = collectVats(supplier);
  const customerVats = collectVats(customer);
  const invNo = firstMatch(clean, INVOICE_NO_PATTERNS);
  const issue = firstMatch(clean, ISSUE_DATE_PATTERNS);
  const due = firstMatch(clean, DUE_DATE_PATTERNS);
  const buyerReference = firstMatch(clean, BUYER_REF_PATTERNS);
  const orderReference = firstMatch(clean, ORDER_REF_PATTERNS);
  const paymentReference = firstMatch(clean, PAYMENT_REF_PATTERNS);
  const supplierLoc = extractCity(supplier);
  const customerLoc = extractCity(customer);
  const net = extractAmountAfter(clean, NET_PATTERNS);
  const vatAmt = extractAmountAfter(clean, VAT_AMT_PATTERNS);
  const payable = extractAmountAfter(clean, PAY_PATTERNS);
  const lines = extractLines(clean);

  return {
    ...EMPTY_INVOICE,
    invoiceNumber: invNo ? field(invNo.value, invNo.confidence) : EMPTY_INVOICE.invoiceNumber,
    issueDate: issue ? field(toIsoDate(issue.value), issue.confidence) : EMPTY_INVOICE.issueDate,
    dueDate: due ? field(toIsoDate(due.value), due.confidence) : EMPTY_INVOICE.dueDate,
    currency: guessCurrency(clean),
    buyerReference: buyerReference ? field(buyerReference.value, buyerReference.confidence) : EMPTY_INVOICE.buyerReference,
    orderReference: orderReference ? field(orderReference.value, orderReference.confidence) : EMPTY_INVOICE.orderReference,
    supplierName: field(extractName(supplier), extractName(supplier) ? "high" : "low"),
    supplierVat: field(supplierVats[0] ?? "", supplierVats[0] ? "high" : "low"),
    supplierStreet: field(extractStreet(supplier), extractStreet(supplier) ? "medium" : "low"),
    supplierCity: field(supplierLoc.city, supplierLoc.city ? "high" : "low"),
    supplierPostal: field(supplierLoc.postal, supplierLoc.postal ? "high" : "low"),
    supplierCountry: field(supplierLoc.country, "medium"),
    customerName: field(extractName(customer), extractName(customer) ? "high" : "low"),
    customerVat: field(customerVats[0] ?? "", customerVats[0] ? "high" : "low"),
    customerStreet: field(extractStreet(customer), extractStreet(customer) ? "medium" : "low"),
    customerCity: field(customerLoc.city, customerLoc.city ? "high" : "low"),
    customerPostal: field(customerLoc.postal, customerLoc.postal ? "high" : "low"),
    customerCountry: field(customerLoc.country, "medium"),
    netAmount: field(net, net ? "high" : "low"),
    vatAmount: field(vatAmt, vatAmt ? "medium" : "low"),
    payableAmount: field(payable, payable ? "high" : "low"),
    paymentAccount: field(collectIban(clean), collectIban(clean) ? "high" : "low"),
    paymentReference: paymentReference ? field(paymentReference.value, paymentReference.confidence) : EMPTY_INVOICE.paymentReference,
    lines,
    notes: "",
  };
}

export function setField<K extends keyof InvoiceData>(data: InvoiceData, key: K, value: InvoiceData[K]): InvoiceData {
  return { ...data, [key]: value };
}
