import { Link, createFileRoute } from "@tanstack/react-router";
import { Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/local";
import { deleteConversionHistory, listConversions, type ConversionRow } from "@/lib/peppol/conversions";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

type Usage = {
  conversions: { used: number; limit: number };
  bulk: { used: number; limit: number };
  adminTestMode?: boolean;
};

function escapeCsv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function exportConversions(rows: ConversionRow[]) {
  const header = ["invoice_id", "supplier", "customer", "total", "currency", "status", "issue_count", "created_at"];
  const body = rows.map((row) => [
    row.invoice_id,
    row.supplier,
    row.customer,
    row.total,
    row.currency,
    row.status,
    String(row.issue_count),
    row.created_at,
  ].map(escapeCsv).join(","));
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "peppol-suite-conversion-history.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function planName(planId: string): string {
  if (planId === "business") return "Business";
  if (planId === "pro" || planId === "paid") return "Pro";
  return "Free";
}

function UsageCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return <div className="rounded-xl border border-border bg-surface p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted">{used.toLocaleString()} / {limit.toLocaleString()}</p>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true"><div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} /></div>
    <p className="mt-2 text-xs text-muted">{remaining.toLocaleString()} remaining this month</p>
  </div>;
}

function Dashboard() {
  const lang = usePrefs((s) => s.lang);
  const { user, hydrated } = useAuth();
  const [rows, setRows] = useState<ConversionRow[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    void listConversions().then(setRows).catch(() => setRows([]));
    void fetch("/api/usage", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load usage.");
        return response.json() as Promise<Usage>;
      })
      .then(setUsage)
      .catch(() => setUsage(null));
  }, [user]);

  async function handleDeleteHistory() {
    if (!window.confirm("Delete your conversion history? This removes the saved history metadata for your account and cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteConversionHistory();
      setRows([]);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete conversion history.");
    } finally {
      setDeleting(false);
    }
  }

  if (!hydrated) return <main className="mx-auto max-w-5xl px-4 py-12"><div className="h-40 animate-pulse rounded-xl bg-surface" /></main>;
  if (!user) return <main className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="font-display text-3xl">{t(lang, "login_title")}</h1><p className="mt-2 text-muted">{t(lang, "login_sub")}</p><Button asChild className="mt-6"><Link to="/login">{t(lang, "nav_login")}</Link></Button></main>;

  const displayPlan = planName(user.planId);

  return <main className="mx-auto max-w-5xl px-4 py-10">
    <div>
      <h1 className="font-display text-3xl tracking-tight">Account</h1>
      <p className="mt-2 text-muted">Your profile, subscription, usage and conversion history.</p>
    </div>

    <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-border bg-elevated p-5">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="font-display text-2xl">Profile</h2><p className="mt-1 text-sm text-muted">Account details from your authenticated session.</p></div>
          {user.role === "admin" ? <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">Admin test mode</span> : null}
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs uppercase tracking-wide text-muted">Name</dt><dd className="mt-1 break-words">{user.name || "Not provided"}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Email</dt><dd className="mt-1 break-words">{user.email}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Email verification</dt><dd className="mt-1">{user.emailVerified ? "Verified" : "Not verified"}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Account role</dt><dd className="mt-1 capitalize">{user.role}</dd></div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-elevated p-5">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl">Plan</h2><p className="mt-1 text-sm text-muted">Current subscription and monthly allowance.</p></div><span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">{displayPlan}</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wide text-muted">Subscription</p><p className="mt-1 font-medium">{displayPlan} plan</p></div>
          <div className="rounded-xl border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wide text-muted">Billing</p><p className="mt-1 font-medium">Monthly allowance</p><p className="mt-1 text-xs text-muted">Live payments are not enabled.</p></div>
        </div>
      </div>
    </section>

    <section className="mt-6 rounded-2xl border border-border bg-elevated p-5">
      <div><h2 className="font-display text-2xl">Usage</h2><p className="mt-1 text-sm text-muted">Usage resets with the monthly quota period.</p></div>
      {usage ? <div className="mt-5 grid gap-4 md:grid-cols-2"><UsageCard label="Conversions" used={usage.conversions.used} limit={usage.conversions.limit} /><UsageCard label="Bulk runs" used={usage.bulk.used} limit={usage.bulk.limit} /></div> : <p className="mt-5 text-sm text-muted">Usage is temporarily unavailable.</p>}
    </section>

    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="font-display text-2xl tracking-tight">Conversion history</h2><p className="mt-1 text-sm text-muted">XML metadata only — PDF files are not stored.</p></div>
        {rows.length ? <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => exportConversions(rows)}><Download className="size-4" />Export history</Button><Button type="button" variant="outline" disabled={deleting} onClick={handleDeleteHistory}><Trash2 className="size-4" />{deleting ? "Deleting…" : "Delete history"}</Button></div> : null}
      </div>
      {!rows.length ? <div className="mt-6 rounded-2xl border border-border bg-elevated p-8"><p className="text-muted">{t(lang, "dash_empty")}</p><Button asChild className="mt-4"><Link to="/converter">{t(lang, "hero_cta")}</Link></Button></div> : <div className="mt-6 overflow-auto rounded-xl border border-border"><table className="w-full min-w-[640px] text-sm"><thead className="bg-surface text-left text-muted"><tr><th className="px-3 py-2">Invoice</th><th className="px-3 py-2">{t(lang, "supplier")}</th><th className="px-3 py-2">{t(lang, "customer")}</th><th className="px-3 py-2">{t(lang, "f_payable")}</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t border-border"><td className="px-3 py-2 font-mono text-xs">{r.invoice_id}</td><td className="px-3 py-2">{r.supplier}</td><td className="px-3 py-2">{r.customer}</td><td className="px-3 py-2">{r.total} {r.currency}</td><td className="px-3 py-2">{r.status === "ok" ? t(lang, "status_ok") : t(lang, "status_issues")}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
