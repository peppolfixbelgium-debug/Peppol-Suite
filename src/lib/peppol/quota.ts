export const FREE_LIMIT = 5;
export const ANONYMOUS_TRIAL_LIMIT = 3;
const ANONYMOUS_QUOTA_KEY = "peppol-suite-anonymous-quota";

type StoredAnonymousQuota = { period: string; used: number };
export type QuotaState = { used: number; limit: number; remaining: number };

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function readAnonymousUsage(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(ANONYMOUS_QUOTA_KEY);
    if (!raw) return 0;
    const stored = JSON.parse(raw) as Partial<StoredAnonymousQuota>;
    if (stored.period !== currentPeriod()) return 0;
    return Math.max(0, Math.min(ANONYMOUS_TRIAL_LIMIT, Number(stored.used) || 0));
  } catch {
    return 0;
  }
}

export function getAnonymousQuota(): QuotaState {
  const used = readAnonymousUsage();
  return { used, limit: ANONYMOUS_TRIAL_LIMIT, remaining: Math.max(0, ANONYMOUS_TRIAL_LIMIT - used) };
}

export function consumeAnonymousQuota(): QuotaState {
  const current = getAnonymousQuota();
  if (current.remaining <= 0 || typeof window === "undefined") return current;
  const next = { period: currentPeriod(), used: current.used + 1 } satisfies StoredAnonymousQuota;
  try {
    window.localStorage.setItem(ANONYMOUS_QUOTA_KEY, JSON.stringify(next));
  } catch {
    // Anonymous quota is intentionally a soft, device-local trial mechanism.
  }
  return { used: next.used, limit: ANONYMOUS_TRIAL_LIMIT, remaining: Math.max(0, ANONYMOUS_TRIAL_LIMIT - next.used) };
}

export async function fetchQuota(): Promise<QuotaState> {
  const response = await fetch("/api/usage", { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load usage quota.");
  const data = await response.json() as { conversions: { used: number; limit: number } };
  const used = Number(data.conversions.used) || 0;
  const limit = Number(data.conversions.limit) || 0;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export async function consumeBulkQuota(): Promise<{ used: number; limit: number; remaining: number }> {
  const response = await fetch("/api/usage", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "bulk" }) });
  const data = await response.json().catch(() => ({})) as { used?: unknown; limit?: unknown; error?: unknown };
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Monthly bulk limit reached.");
  const used = Number(data.used) || 0;
  const limit = Number(data.limit) || 0;
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
