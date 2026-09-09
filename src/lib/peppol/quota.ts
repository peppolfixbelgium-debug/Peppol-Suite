import { monthKey } from "@/lib/utils";

const KEY = "peppol.free.v1";
export const FREE_LIMIT = 5;

type QuotaState = { month: string; used: number };

function read(): QuotaState {
  if (typeof window === "undefined") return { month: monthKey(), used: 0 };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { month: monthKey(), used: 0 };
    const parsed = JSON.parse(raw) as QuotaState;
    if (parsed.month !== monthKey()) return { month: monthKey(), used: 0 };
    return { month: parsed.month, used: Number(parsed.used) || 0 };
  } catch {
    return { month: monthKey(), used: 0 };
  }
}

function write(state: QuotaState) {
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function getQuota() {
  const state = read();
  return { used: state.used, limit: FREE_LIMIT, remaining: Math.max(0, FREE_LIMIT - state.used) };
}

export function canConsume() {
  return getQuota().remaining > 0;
}

export function consumeQuota() {
  const state = read();
  if (state.used >= FREE_LIMIT) return getQuota();
  write({ month: state.month, used: state.used + 1 });
  return getQuota();
}
