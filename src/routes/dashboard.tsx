import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Download, ShieldCheck, Trash2, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/local";
import { deleteConversionHistory, listConversions, type ConversionRow } from "@/lib/peppol/conversions";
import { PRICING } from "@/lib/peppol/pricing";
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
  const body = rows.map((row) => [row.invoice_id,row.supplier,row.customer,row.total,row.currency,row.status,String(row.issue_count),row.created_at].map(escapeCsv).join(","));
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

function planDetails(planId: string) {
  return PRICING.tiers.find((tier) => tier.id === planId) ?? PRICING.tiers[0];
}

function UsageCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{label}</p><p className="text-sm text-muted">{used.toLocaleString()} / {limit.toLocaleString()}</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-border" aria-hidden="true"><div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs text-muted">{remaining.toLocaleString()} remaining this month</p></div>;
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
    void fetch("/api/usage", { credentials: "include" }).then(async (response) => { if (!response.ok) throw new Error("Unable to load usage."); return response.json() as Promise<Usage>; }).then(setUsage).catch(() => setUsage(null));
  }, [user]);

  async function handleDeleteHistory() {
    if (!window.confirm("Delete your conversion history? This removes the saved history metadata for your account and cannot be undone.")) return;
    setDeleting(true);
    try { await deleteConversionHistory(); setRows([]); } catch (error) { window.alert(error instanceof Error ? error.message : "Unable to delete conversion history."); } finally { setDeleting(false); }
  }

  const displayPlan = useMemo(() => user ? planName(user.planId) : "Free", [user]);
  const tier = useMemo(() => user ? planDetails(user.planId) : PRICING.tiers[0], [user]);
  const daysUntilReset = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() - Date.now()) / 86400000));
  const hasUsedSomething = Boolean(usage && (usage.conversions.used > 0 || usage.bulk.used > 0));
  const isFree = displayPlan === "Free";

  if (!hydrated) return <main className="mx-auto max-w-5xl px-4 py-12"><div className="h-40 animate-pulse rounded-xl bg-surface" /></main>;
  if (!user) return <main className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="font-display text-3xl">{t(lang, "login_title")}</h1><p className="mt-2 text-muted">{t(lang, "login_sub")}</p><Button asChild className="mt-6"><Link to="/login">{t(lang, "nav_login")}</Link></Button></main>;

  return <main className="mx-auto max-w-5xl px-4 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Customer Command Center</p><h1 className="mt-1 font-display text-3xl tracking-tight">Welcome back{user.name ? `, ${user.name}` : ""}.</h1><p className="mt-2 text-muted">Your profile, subscription, usage and document activity in one place.</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link to="/converter">Convert invoice</Link></Button><Button asChild><Link to="/bulk">Bulk convert <ArrowRight className="size-4" /></Link></Button></div></div>

    {isFree && !hasUsedSomething ? <section className="mt-7 rounded-2xl border border-border bg-elevated p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-accent">You're ready to start</p><h2 className="mt-1 font-display text-2xl">Convert your first Peppol invoice</h2><p className="mt-1 max-w-2xl text-sm text-muted">Upload a PDF, validate the extracted invoice data, and download structured Peppol XML. Your free allowance is shown below.</p></div><Button asChild><Link to="/converter">Start converting <ArrowRight className="size-4" /></Link></Button></div></section> : null}

    <section className="mt-7 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-border bg-elevated p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl">Profile</h2><p className="mt-1 text-sm text-muted">Identity and account access.</p></div>{user.role === "admin" ? <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">Admin test mode</span> : null}</div><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs uppercase tracking-wide text-muted">Name</dt><dd className="mt-1 break-words">{user.name || "Not provided"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted">Email</dt><dd className="mt-1 break-words">{user.email}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted">Email verification</dt><dd className="mt-1 flex items-center gap-1.5">{user.emailVerified ? <CheckCircle2 className="size-4 text-accent" /> : null}{user.emailVerified ? "Verified" : "Not verified"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-muted">Account role</dt><dd className="mt-1 capitalize">{user.role}</dd></div></dl></div>
      <div className="rounded-2xl border border-border bg-elevated p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl">Subscription</h2><p className="mt-1 text-sm text-muted">Current plan and entitlement.</p></div><span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">{displayPlan}</span></div><div className="mt-5 rounded-xl border border-border bg-surface p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{tier.name} plan</p><p className="mt-1 text-xs text-muted">{tier.price === 0 ? "Free" : `€${tier.price.toFixed(2)}/month`}</p></div><span className="text-xs text-muted">{isFree ? "No billing" : "Billing prepared"}</span></div><ul className="mt-4 space-y-2 text-sm">{tier.features.slice(0, 4).map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />{feature}</li>)}</ul></div><Button asChild className="mt-4 w-full" variant={isFree ? "default" : "outline"}><Link to="/pricing">{isFree ? "Explore Pro & Business" : "View plan options"} <ArrowRight className="size-4" /></Link></Button></div>
    </section>

    <section className="mt-6 rounded-2xl border border-border bg-elevated p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-2xl">Usage</h2><p className="mt-1 text-sm text-muted">Your monthly document allowances and current consumption.</p></div><span className="rounded-full border border-border px-3 py-1 text-xs text-muted">Resets in ~{daysUntilReset} day{daysUntilReset === 1 ? "" : "s"}</span></div>{usage ? <div className="mt-5 grid gap-4 md:grid-cols-2"><UsageCard label="Conversions" used={usage.conversions.used} limit={usage.conversions.limit} /><UsageCard label="Bulk documents" used={usage.bulk.used} limit={usage.bulk.limit} /></div> : <p className="mt-5 text-sm text-muted">Usage is temporarily unavailable.</p>}<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><Zap className="size-3.5" />Each successful document uses one document unit.</span><span>Bulk documents have a separate allowance.</span></div></section>

    <section className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-elevated p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-accent" /><h2 className="font-display text-xl">Security</h2></div><p className="mt-2 text-sm text-muted">Your session is authenticated and your history is scoped to your account.</p><div className="mt-4 text-sm">Email: <span className="font-medium">{user.emailVerified ? "Verified" : "Verification pending"}</span></div></div><div className="rounded-2xl border border-border bg-elevated p-5"><h2 className="font-display text-xl">Quick actions</h2><div className="mt-4 grid gap-2"><Button asChild variant="outline" className="justify-between"><Link to="/validate">Validate XML <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" className="justify-between"><Link to="/pricing">Compare plans <ArrowRight className="size-4" /></Link></Button></div></div></section>

    <section className="mt-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-2xl tracking-tight">Conversion history</h2><p className="mt-1 text-sm text-muted">XML metadata only — PDF files are not stored.</p></div>{rows.length ? <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => exportConversions(rows)}><Download className="size-4" />Export history</Button><Button type="button" variant="outline" disabled={deleting} onClick={handleDeleteHistory}><Trash2 className="size-4" />{deleting ? "Deleting…" : "Delete history"}</Button></div> : null}</div>{!rows.length ? <div className="mt-6 rounded-2xl border border-border bg-elevated p-8"><p className="text-muted">{t(lang, "dash_empty")}</p><Button asChild className="mt-4"><Link to="/converter">{t(lang, "hero_cta")}</Link></Button></div> : <div className="mt-6 overflow-auto rounded-xl border border-border"><table className="w-full min-w-[640px] text-sm"><thead className="bg-surface text-left text-muted"><tr><th className="px-3 py-2">Invoice</th><th className="px-3 py-2">{t(lang, "supplier")}</th><th className="px-3 py-2">{t(lang, "customer")}</th><th className="px-3 py-2">{t(lang, "f_payable")}</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{rows.map(r => <tr key={r.id} className="border-t border-border"><td className="px-3 py-2 font-mono text-xs">{r.invoice_id}</td><td className="px-3 py-2">{r.supplier}</td><td className="px-3 py-2">{r.customer}</td><td className="px-3 py-2">{r.total} {r.currency}</td><td className="px-3 py-2">{r.status === "ok" ? t(lang, "status_ok") : t(lang, "status_issues")}</td></tr>)}</tbody></table></div>}</section>
  </main>;
}
