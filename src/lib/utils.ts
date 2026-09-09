import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&" + "amp;")
    .replaceAll("<", "&" + "lt;")
    .replaceAll(">", "&" + "gt;")
    .replaceAll('"', "&" + "quot;")
    .replaceAll("'", "&" + "apos;");
}

export function formatMoney(value: string | number, currency = "EUR") {
  const n = typeof value === "number" ? value : parseAmount(value);
  if (n === null) return value ? String(value) : "";
  try {
    return new Intl.NumberFormat("nl-BE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

export function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "").replace(/[€$£]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized = s;
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const decimals = s.length - lastComma - 1;
    normalized = decimals === 3 ? s.replace(",", "") : s.replace(",", ".");
  } else if (lastDot >= 0) {
    const decimals = s.length - lastDot - 1;
    if (decimals === 3) normalized = s.replace(/\./g, "");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function moneyString(n: number): string {
  return n.toFixed(2);
}

export function toIsoDate(raw: string): string {
  const s = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return s;
  const dmy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${m}-${d}`;
  }
  const mdy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;
  void mdy;
  return s;
}

export function normalizeBeVat(raw: string): string {
  const upper = raw.toUpperCase().replace(/[\s./-]/g, "");
  const withBe = upper.startsWith("BE") ? upper : `BE${upper}`;
  const digits = withBe.slice(2).replace(/\D/g, "");
  if (digits.length === 9) return `BE0${digits}`;
  if (digits.length === 10) return `BE${digits}`;
  return withBe;
}

export function isValidBeVat(vat: string): boolean {
  const n = normalizeBeVat(vat);
  const m = /^BE(\d{10})$/.exec(n);
  if (!m) return false;
  const digits = m[1];
  const first8 = Number(digits.slice(0, 8));
  const check = Number(digits.slice(8));
  if (!Number.isFinite(first8) || !Number.isFinite(check)) return false;
  return 97 - (first8 % 97) === check;
}

export function enterpriseNumber(vat: string): string {
  return normalizeBeVat(vat).replace(/^BE/, "");
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
