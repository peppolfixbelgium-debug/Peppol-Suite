export type Confidence = "high" | "medium" | "low";

export interface InvoiceField<T = string> {
  value: T;
  confidence: Confidence;
}

export interface InvoiceLine {
  description: string;
  quantity: string;
  unitCode: string;
  unitPrice: string;
  baseQuantity: string;
  vatRate: string;
  lineTotal: string;
  allowanceAmount: string;
  chargeAmount: string;
}

export interface InvoiceData {
  invoiceNumber: InvoiceField;
  issueDate: InvoiceField;
  dueDate: InvoiceField;
  invoiceTypeCode: InvoiceField;
  currency: InvoiceField;
  buyerReference: InvoiceField;
  orderReference: InvoiceField;
  supplierName: InvoiceField;
  supplierVat: InvoiceField;
  supplierStreet: InvoiceField;
  supplierCity: InvoiceField;
  supplierPostal: InvoiceField;
  supplierCountry: InvoiceField;
  customerName: InvoiceField;
  customerVat: InvoiceField;
  customerStreet: InvoiceField;
  customerCity: InvoiceField;
  customerPostal: InvoiceField;
  customerCountry: InvoiceField;
  netAmount: InvoiceField;
  vatAmount: InvoiceField;
  payableAmount: InvoiceField;
  prepaidAmount: InvoiceField;
  roundingAmount: InvoiceField;
  documentAllowanceAmount: InvoiceField;
  documentAllowanceVatRate: InvoiceField;
  documentChargeAmount: InvoiceField;
  documentChargeVatRate: InvoiceField;
  paymentMeansCode: InvoiceField;
  paymentAccount: InvoiceField;
  paymentReference: InvoiceField;
  taxAccountingCurrency: InvoiceField;
  lines: InvoiceLine[];
  notes: string;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  hint: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface PdfExtractionResult {
  success: boolean;
  fullText: string;
  pages: { pageNumber: number; text: string }[];
  pageCount: number;
  error?: {
    code: "NO_TEXT" | "PASSWORD" | "CORRUPT" | "TOO_LARGE" | "WORKER" | "UNKNOWN";
    userMessage: string;
  };
}

export const EMPTY_LINE: InvoiceLine = {
  description: "",
  quantity: "1",
  unitCode: "C62",
  unitPrice: "0.00",
  baseQuantity: "1",
  vatRate: "21",
  lineTotal: "0.00",
  allowanceAmount: "0.00",
  chargeAmount: "0.00",
};

export const EMPTY_INVOICE: InvoiceData = {
  invoiceNumber: { value: "", confidence: "low" },
  issueDate: { value: "", confidence: "low" },
  dueDate: { value: "", confidence: "low" },
  invoiceTypeCode: { value: "380", confidence: "high" },
  currency: { value: "EUR", confidence: "high" },
  buyerReference: { value: "", confidence: "low" },
  orderReference: { value: "", confidence: "low" },
  supplierName: { value: "", confidence: "low" },
  supplierVat: { value: "", confidence: "low" },
  supplierStreet: { value: "", confidence: "low" },
  supplierCity: { value: "", confidence: "low" },
  supplierPostal: { value: "", confidence: "low" },
  supplierCountry: { value: "BE", confidence: "medium" },
  customerName: { value: "", confidence: "low" },
  customerVat: { value: "", confidence: "low" },
  customerStreet: { value: "", confidence: "low" },
  customerCity: { value: "", confidence: "low" },
  customerPostal: { value: "", confidence: "low" },
  customerCountry: { value: "BE", confidence: "medium" },
  netAmount: { value: "", confidence: "low" },
  vatAmount: { value: "", confidence: "low" },
  payableAmount: { value: "", confidence: "low" },
  prepaidAmount: { value: "0.00", confidence: "medium" },
  roundingAmount: { value: "0.00", confidence: "medium" },
  documentAllowanceAmount: { value: "0.00", confidence: "medium" },
  documentAllowanceVatRate: { value: "", confidence: "low" },
  documentChargeAmount: { value: "0.00", confidence: "medium" },
  documentChargeVatRate: { value: "", confidence: "low" },
  paymentMeansCode: { value: "", confidence: "low" },
  paymentAccount: { value: "", confidence: "low" },
  paymentReference: { value: "", confidence: "low" },
  taxAccountingCurrency: { value: "", confidence: "low" },
  lines: [],
  notes: "",
};
