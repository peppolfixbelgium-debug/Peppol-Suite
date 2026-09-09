export type ConversionRow = {
  id: string;
  invoice_id: string;
  supplier: string;
  customer: string;
  total: string;
  currency: string;
  status: string;
  issues: string;
  created_at: string;
};

function key(userId: string) { return `peppol.history.v1.${userId}`; }

export function listConversions(userId: string): ConversionRow[] {
  try {
    const rows = JSON.parse(localStorage.getItem(key(userId)) ?? "[]");
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

export function saveConversion(userId: string, data: Omit<ConversionRow, "id" | "created_at">) {
  const row: ConversionRow = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  const rows = [row, ...listConversions(userId)].slice(0, 100);
  localStorage.setItem(key(userId), JSON.stringify(rows));
  return row;
}
