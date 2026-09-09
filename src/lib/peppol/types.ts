export type Confidence = "high" | "medium" | "low";

export interface InvoiceField<T = string> {
  value: T;
  confidence: Confidence;
}

export interface InvoiceLine {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  lineTotal: string;
}

export interface InvoiceData {
  invoiceNumber: InvoiceField;
  issueDate: InvoiceField;
  dueDate: InvoiceField;
  currency: InvoiceField;
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

export const EMPTY_INVOICE: InvoiceData = {
  invoiceNumber: { value: "", confidence: "low" },
  issueDate: { value: "", confidence: "low" },
  dueDate: { value: "", confidence: "low" },
  currency: { value: "EUR", confidence: "high" },
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
  lines: [],
  notes: "",
};
