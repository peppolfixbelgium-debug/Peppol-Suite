export const FREE_LIMIT = 5;

export type QuotaState = { used: number; limit: number; remaining: number };

export function getQuota(): QuotaState {
  return { used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT };
}

export async function fetchQuota(): Promise<QuotaState> {
  const response = await fetch("/api/usage", { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load usage quota.");
  const data = await response.json() as { conversions: { used: number; limit: number } };
  const used = Number(data.conversions.used) || 0;
  const limit = Number(data.conversions.limit) || 0;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export async function consumeQuota(): Promise<QuotaState> {
  const response = await fetch("/api/usage", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "conversion" }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Monthly conversion limit reached.");
  const used = Number(data.used) || 0;
  const limit = Number(data.limit) || 0;
  return { used, limit, remaining: Math.max(0, limit - used) };
}
