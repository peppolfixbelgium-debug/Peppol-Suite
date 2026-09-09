import { EMPTY_INVOICE, type Confidence, type InvoiceData, type InvoiceField, type InvoiceLine } from "./types";
import { moneyString, normalizeBeVat, parseAmount, toIsoDate } from "@/lib/utils";

function field(value: string, confidence: Confidence): InvoiceField {
  return { value, confidence };
}

function firstMatch(text: string, patterns: RegExp[]): { value: string; confidence: Confidence } | null {
  for (const p of patterns) {
    const m = p.exec(text);
    if (m?.[1]) {
      return { value: m[1].trim(), confidence: "high" };
    }
  }
  return null;
}

const INVOICE_NO_PATTERNS = [
  /\b(INV[-/]\d{2,4}[-/]?\d{2,})\b/i,
  /(?:factuurnummer|factuurnr\.?|invoice\s*(?:number|no\.?|#)|n[°oº]\s*(?:de\s*)?facture|num[eé]ro\s*(?:de\s*)?facture)\s*[:#.]?\s*([A-Z0-9][A-Z0-9/_-]{2,})/i,
];

const ISSUE_DATE_PATTERNS = [
  /(?:factuurdatum|invoice\s*date|issue\s*date|date\s*(?:de\s*)?facture)\s*[:.]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})/i,
];

const DUE_DATE_PATTERNS = [
  /(?:vervaldatum|due\s*date|date\s*[eé]ch[eé]ance|[eé]ch[eé]ance|betaaldatum|payment\s*due)\s*[:.]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})/i,
];

const VAT_PATTERN = /\b(?:BTW|TVA|VAT|BE)\s*:?\s*(BE)?[\s./-]*([0-9]{3,4}[\s./-]?[0-9]{3}[\s./-]?[0-9]{3})\b/gi;

const NET_PATTERNS = [
  /(?:subtotaal(?:\s*excl\.?\s*btw)?|subtotal(?:\s*excl\.?\s*vat)?|hors\s*tva|net\s*(?:amount|total)|totaal\s*excl)/i,
];
const VAT_AMT_PATTERNS = [/^\s*(?:btw|tva|vat)\s+\d{1,2}\s*%/i];
const PAY_PATTERNS = [
  /(?:totaal\s*te\s*betalen|total\s*(?:due|payable|te\s*betalen)|montant\s*[aà]\s*payer|grand\s*total|te\s*betalen)/i,
];

function collectVats(text: string): string[] {
  const found: string[] = [];
  const re = new RegExp(VAT_PATTERN.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    found.push(normalizeBeVat((m[1] ?? "BE") + m[2]));
  }
  return [...new Set(found)];
}

function splitParties(text: string): { supplier: string; customer: string } {
  const split = text.split(
    /(?:^|\n)\s*(?:klant|client|customer|factuur\s*aan|bill\s*to|facture\s*[aà]|destinataire)\b/i,
  );
  if (split.length >= 2) {
    return { supplier: split[0], customer: split.slice(1).join("\n") };
  }
  const mid = Math.floor(text.length / 2);
  return { supplier: text.slice(0, mid), customer: text.slice(mid) };
}

function extractName(block: string): string {
  const lines = block
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^(factuur|facture|invoice|btw|tva|vat|belgi)/i.test(l) &&
        !/^\d{4}\b/.test(l) &&
        l.length > 2 &&
        l.length < 80,
    );
  const company = lines.find((l) => /\b(BV|NV|SRL|SA|BVBA|VOF|CommV|CVBA|ASBL|VZW)\b/i.test(l));
  return (company ?? lines[0] ?? "").replace(/\s+/g, " ");
}

function extractStreet(block: string): string {
  const m = block.match(
    /([A-Za-zÀ-ÿ'’.\- ]+\s+\d+[A-Za-z]?(?:\s*(?:bus|bte|box)\s*\d+)?)/,
  );
  return m?.[1]?.trim() ?? "";
}

function extractCity(block: string): { postal: string; city: string; country: string } {
  const be = block.match(/\b(\d{4})\s+([A-Za-zÀ-ÿ'’\- ]{2,40})\b/);
  const country = /belgi|belgium|belgique/i.test(block) ? "BE" : "BE";
  return {
    postal: be?.[1] ?? "",
    city: be?.[2]?.trim() ?? "",
    country,
  };
}

function extractAmountAfter(text: string, patterns: RegExp[]): string {
  const lines = text.split(/\n/);
  for (const line of lines) {
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
    if (/oms|desc|aantal|qty|prijs|price|totaal|total|btw|tva/i.test(line) && !/\d/.test(line.slice(-6))) {
      continue;
    }
    if (/subtotaal|totaal te betalen|totaal excl|bedankt|thank/i.test(line)) continue;
    const m = line.match(
      /^(.{8,80}?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d{2}))\s+(\d{1,2})\s*%?\s+(\d+(?:[.,]\d{2}))$/,
    );
    if (!m) continue;
    const qty = parseAmount(m[2]) ?? 0;
    const unit = parseAmount(m[3]) ?? 0;
    const vatRate = String(Number(m[4]));
    const reported = parseAmount(m[5]);
    const net = qty * unit;
    lines.push({
      description: m[1].replace(/\s+/g, " ").trim(),
      quantity: moneyString(qty).replace(/\.00$/, "") === String(qty) ? String(qty) : moneyString(qty),
      unitPrice: moneyString(unit),
      vatRate,
      lineTotal: moneyString(net),
    });
    void reported;
  }
  return lines;
}

function guessCurrency(text: string): InvoiceField {
  if (/\bEUR\b|€/.test(text)) return field("EUR", "high");
  if (/\bUSD\b|\$/.test(text)) return field("USD", "medium");
  if (/\bGBP\b|£/.test(text)) return field("GBP", "medium");
  return field("EUR", "medium");
}

export function extractInvoice(text: string): InvoiceData {
  const clean = text.replace(/\r/g, "").replace(/\u00a0/g, " ");
  const { supplier, customer } = splitParties(clean);
  const vats = collectVats(clean);
  const supplierVat = vats[0] ?? "";
  const customerVat = vats.find((v) => v !== supplierVat) ?? vats[1] ?? "";

  const invNo = firstMatch(clean, INVOICE_NO_PATTERNS);
  const issue = firstMatch(clean, ISSUE_DATE_PATTERNS);
  const due = firstMatch(clean, DUE_DATE_PATTERNS);

  const supplierLoc = extractCity(supplier);
  const customerLoc = extractCity(customer);

  const net = extractAmountAfter(clean, NET_PATTERNS);
  const vatAmt = extractAmountAfter(clean, VAT_AMT_PATTERNS);
  let payable = extractAmountAfter(clean, PAY_PATTERNS);

  const lines = extractLines(clean);
  if (!net && lines.length) {
    const sum = lines.reduce((a, l) => a + (parseAmount(l.lineTotal) ?? 0), 0);
    return fill(
      clean,
      invNo,
      issue,
      due,
      supplier,
      customer,
      supplierVat,
      customerVat,
      supplierLoc,
      customerLoc,
      moneyString(sum),
      vatAmt,
      payable,
      lines,
    );
  }

  if (!payable && net) {
    const n = parseAmount(net) ?? 0;
    const v = parseAmount(vatAmt) ?? 0;
    if (n + v > 0) payable = moneyString(n + v);
  }

  return fill(
    clean,
    invNo,
    issue,
    due,
    supplier,
    customer,
    supplierVat,
    customerVat,
    supplierLoc,
    customerLoc,
    net,
    vatAmt,
    payable,
    lines,
  );
}

function fill(
  clean: string,
  invNo: { value: string; confidence: Confidence } | null,
  issue: { value: string; confidence: Confidence } | null,
  due: { value: string; confidence: Confidence } | null,
  supplier: string,
  customer: string,
  supplierVat: string,
  customerVat: string,
  supplierLoc: { postal: string; city: string; country: string },
  customerLoc: { postal: string; city: string; country: string },
  net: string,
  vatAmt: string,
  payable: string,
  lines: InvoiceLine[],
): InvoiceData {
  return {
    ...EMPTY_INVOICE,
    invoiceNumber: invNo ? field(invNo.value, invNo.confidence) : EMPTY_INVOICE.invoiceNumber,
    issueDate: issue
      ? field(toIsoDate(issue.value), issue.confidence)
      : EMPTY_INVOICE.issueDate,
    dueDate: due ? field(toIsoDate(due.value), due.confidence) : EMPTY_INVOICE.dueDate,
    currency: guessCurrency(clean),
    supplierName: field(extractName(supplier), extractName(supplier) ? "high" : "low"),
    supplierVat: field(supplierVat, supplierVat ? "high" : "low"),
    supplierStreet: field(extractStreet(supplier), extractStreet(supplier) ? "medium" : "low"),
    supplierCity: field(supplierLoc.city, supplierLoc.city ? "high" : "low"),
    supplierPostal: field(supplierLoc.postal, supplierLoc.postal ? "high" : "low"),
    supplierCountry: field(supplierLoc.country || "BE", "medium"),
    customerName: field(extractName(customer), extractName(customer) ? "high" : "low"),
    customerVat: field(customerVat, customerVat ? "high" : "low"),
    customerStreet: field(extractStreet(customer), extractStreet(customer) ? "medium" : "low"),
    customerCity: field(customerLoc.city, customerLoc.city ? "high" : "low"),
    customerPostal: field(customerLoc.postal, customerLoc.postal ? "high" : "low"),
    customerCountry: field(customerLoc.country || "BE", "medium"),
    netAmount: field(net, net ? "high" : "low"),
    vatAmount: field(vatAmt, vatAmt ? "medium" : "low"),
    payableAmount: field(payable, payable ? "high" : "low"),
    lines,
    notes: "",
  };
}

export function setField<K extends keyof InvoiceData>(
  data: InvoiceData,
  key: K,
  value: InvoiceData[K],
): InvoiceData {
  return { ...data, [key]: value };
}
