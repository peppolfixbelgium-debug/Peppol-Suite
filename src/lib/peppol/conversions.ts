export type ConversionRow = {
  id: string;
  invoice_id: string;
  supplier: string;
  customer: string;
  total: string;
  currency: string;
  status: string;
  issue_count?: number;
  issues?: string;
  created_at: string;
};

export async function listConversions(): Promise<ConversionRow[]> {
  const response = await fetch("/api/conversions", { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load conversion history.");
  const data = await response.json() as { conversions: ConversionRow[] };
  return Array.isArray(data.conversions) ? data.conversions : [];
}

export async function saveConversion(_userId: string, data: Omit<ConversionRow, "id" | "created_at">): Promise<ConversionRow> {
  const response = await fetch("/api/conversions", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to save conversion.");
  return result.conversion as ConversionRow;
}
