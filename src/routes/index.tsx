import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, Lock, ShieldOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/peppol/pricing";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });
type BillingInterval = "month" | "year";

function Home() {
  const lang = usePrefs((s) => s.lang);
  const [interval, setInterval] = useState<BillingInterval>("year");
  const copy = {
    en: { monthly: "Monthly", annual: "Annual", save: "Save 16.7%", saveYear: "Save", effective: "effective / month", year: "year", month: "month", billingPeriod: "Billing period" },
    fr: { monthly: "Mensuel", annual: "Annuel", save: "Économisez 16,7 %", saveYear: "Économisez", effective: "effectif / mois", year: "an", month: "mois", billingPeriod: "Période de facturation" },
    nl: { monthly: "Maandelijks", annual: "Jaarlijks", save: "Bespaar 16,7%", saveYear: "Bespaar", effective: "effectief / maand", year: "jaar", month: "maand", billingPeriod: "Facturatieperiode" },
  } as const;
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:pt-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">{t(lang, "hero_kicker")}</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{t(lang, "hero_title")}</h1>
        <p className="mt-6 max-w-2xl text-base text-muted sm:text-lg">{t(lang, "hero_sub")}</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/converter">{t(lang, "hero_cta")}<ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" size="lg"><Link to="/converter" search={{ sample: true }}>{t(lang, "hero_sample")}</Link></Button><Button asChild variant="ghost" size="lg"><Link to="/validate">{t(lang, "hero_validate")}</Link></Button></div>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1.5 text-xs text-muted"><Lock className="size-3.5" />{t(lang, "privacy_chip")}</p>
      </section>
      <section className="border-y border-border bg-surface"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-2"><div><h2 className="font-display text-3xl tracking-tight">{t(lang, "honest_title")}</h2><p className="mt-4 text-muted">{t(lang, "honest_is")}</p><p className="mt-4 flex items-start gap-2 text-muted"><ShieldOff className="mt-1 size-4 shrink-0 text-accent" />{t(lang, "honest_isnot")}</p></div><div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">{[{ t: "how_1_t", d: "how_1" },{ t: "how_2_t", d: "how_2" },{ t: "how_3_t", d: "how_3" }].map((item, i) => <div key={item.t} className="rounded-xl border border-border bg-elevated p-4"><p className="text-xs text-subtle">{String(i + 1).padStart(2, "0")}</p><h3 className="mt-1 font-medium">{t(lang, item.t as "how_1_t")}</h3><p className="mt-1 text-sm text-muted">{t(lang, item.d as "how_1")}</p></div>)}</div></div></section>
      <section className="mx-auto max-w-6xl px-4 py-16"><h2 className="font-display text-3xl tracking-tight">{t(lang, "mandate_title")}</h2><p className="mt-4 max-w-3xl text-muted">{t(lang, "mandate_body")}</p></section>
      <section className="border-t border-border bg-surface"><div className="mx-auto max-w-6xl px-4 py-16"><h2 className="font-display text-3xl tracking-tight">{t(lang, "pricing_title")}</h2><p className="mt-2 text-muted">{t(lang, "pricing_sub")}</p>
        <div className="mx-auto mt-6 flex w-fit rounded-full border border-border bg-elevated p-1" aria-label={copy[lang].billingPeriod}>{(["month", "year"] as const).map((value) => <button key={value} type="button" aria-pressed={interval === value} onClick={() => setInterval(value)} className={cn("rounded-full px-5 py-2 text-sm font-medium transition", interval === value ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground")}>{value === "month" ? copy[lang].monthly : copy[lang].annual}{value === "year" && <span className="ml-2 text-xs">{copy[lang].save}</span>}</button>)}</div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{PRICING.tiers.map((tier) => { const localized = tier.localized[lang]; const annualSaving = (tier.price * 12 - tier.annualPrice).toFixed(2); const annualEffective = (tier.annualPrice / 12).toFixed(2); const displayPrice = tier.price === 0 ? null : interval === "year" ? tier.annualPrice : tier.price; const loginPath = tier.id === "free" ? "/converter" : `/login?plan=${tier.id}&interval=${interval}`; return <div key={tier.id} className={cn("flex flex-col rounded-2xl border bg-elevated p-5", tier.popular ? "border-accent" : "border-border")}><div className="flex items-baseline justify-between"><h3 className="font-medium">{localized.name}</h3>{tier.popular ? <span className="text-xs text-accent">Popular</span> : null}</div><p className="mt-3 font-display text-3xl">{tier.price === 0 ? "€0" : <>€{displayPrice}<span className="text-base font-normal"> / {interval === "year" ? copy[lang].year : copy[lang].month}</span></>}</p><p className="mt-1 text-sm text-muted">{tier.invoices} {t(lang, "pricing_invoices")}</p>{tier.price > 0 && interval === "year" && <div className="mt-2 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2"><p className="font-medium">{copy[lang].save} · {copy[lang].saveYear} €{annualSaving}/{copy[lang].year}</p><p className="text-sm text-muted">€{annualEffective} {copy[lang].effective}</p></div>}{tier.price > 0 && interval === "month" && <p className="mt-2 text-sm text-muted">€{tier.annualPrice} / {copy[lang].year} — {copy[lang].save}</p>}<ul className="mt-4 flex-1 space-y-2 text-sm text-muted">{localized.features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Button asChild className="mt-5" variant={tier.id === "free" ? "default" : "outline"}><a href={loginPath}>{localized.cta}</a></Button></div>; })}</div>
      </div></section>
      <section className="mx-auto max-w-6xl px-4 py-16"><h2 className="font-display text-3xl tracking-tight">{t(lang, "faq_title")}</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{([["faq_1_q", "faq_1_a"],["faq_2_q", "faq_2_a"],["faq_3_q", "faq_3_a"],["faq_4_q", "faq_4_a"]] as const).map(([q, a]) => <div key={q} className="rounded-xl border border-border bg-elevated p-5"><h3 className="flex items-start gap-2 font-medium"><FileCheck2 className="mt-0.5 size-4 text-accent" />{t(lang, q)}</h3><p className="mt-2 text-sm text-muted">{t(lang, a)}</p></div>)}</div></section>
    </main>
  );
}
