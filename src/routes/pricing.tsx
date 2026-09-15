import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/peppol/pricing";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({ component: PricingPage });
type BillingInterval = "month" | "year";

function PricingPage() {
  const lang = usePrefs((s) => s.lang);
  const [interval, setInterval] = useState<BillingInterval>("year");
  const notice = {
    en: "Founder-approved launch pricing. Payments are not enabled yet.",
    fr: "Tarifs de lancement approuvés par le fondateur. Les paiements ne sont pas encore activés.",
    nl: "Door de oprichter goedgekeurde lanceringstarieven. Betalingen zijn nog niet ingeschakeld.",
  } as const;
  const copy = {
    en: { monthly: "Monthly", annual: "Annual", save: "Save 16.7%", saveYear: "Save", effective: "effective / month", year: "year", month: "month", billingPeriod: "Billing period" },
    fr: { monthly: "Mensuel", annual: "Annuel", save: "Économisez 16,7 %", saveYear: "Économisez", effective: "effectif / mois", year: "an", month: "mois", billingPeriod: "Période de facturation" },
    nl: { monthly: "Maandelijks", annual: "Jaarlijks", save: "Bespaar 16,7%", saveYear: "Bespaar", effective: "effectief / maand", year: "jaar", month: "maand", billingPeriod: "Facturatieperiode" },
  } as const;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "pricing_title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t(lang, "pricing_sub")}</p>
      <p className="mt-4 max-w-2xl text-sm text-muted">{notice[lang]}</p>

      <div className="mx-auto mt-8 flex w-fit rounded-full border border-border bg-elevated p-1" aria-label={copy[lang].billingPeriod}>
        {(["month", "year"] as const).map((value) => {
          const active = interval === value;
          return <button key={value} type="button" aria-pressed={active} onClick={() => setInterval(value)} className={cn("rounded-full px-5 py-2 text-sm font-medium transition", active ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground")}>
            {value === "month" ? t(lang, "pricing_mo") : copy[lang].annual}{value === "year" && <span className="ml-2 text-xs">{copy[lang].save}</span>}
          </button>;
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PRICING.tiers.map((tier) => {
          const localized = tier.localized[lang];
          const annualSaving = (tier.price * 12 - tier.annualPrice).toFixed(2);
          const annualEffective = (tier.annualPrice / 12).toFixed(2);
          const displayPrice = tier.price === 0 ? null : interval === "year" ? tier.annualPrice : tier.price;
          const loginPath = tier.id === "free" ? "/converter" : `/login?plan=${tier.id}&interval=${interval}`;
          return <div key={tier.id} className={cn("flex flex-col rounded-2xl border bg-elevated p-5", tier.popular ? "border-accent" : "border-border")}>
            <h2 className="font-medium">{localized.name}</h2>
            <p className="mt-3 font-display text-2xl">{tier.price === 0 ? localized.name : <>€{displayPrice}<span className="text-base font-normal"> / {interval === "year" ? copy[lang].year : t(lang, "pricing_mo").replace(/^\s*\/\s*/, "")}</span></>}</p>
            {tier.price > 0 && interval === "year" && <div className="mt-2 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2"><p className="font-medium">{copy[lang].save} · {copy[lang].saveYear} €{annualSaving}/{copy[lang].year}</p><p className="text-sm text-muted">€{annualEffective} {copy[lang].effective}</p></div>}
            {tier.price > 0 && interval === "month" && <p className="mt-2 text-sm text-muted">€{tier.annualPrice} / {copy[lang].year} — {copy[lang].save}</p>}
            <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">{localized.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <Button asChild className="mt-6" variant={tier.popular ? "default" : "outline"}><a href={loginPath}>{localized.cta}</a></Button>
          </div>;
        })}
      </div>
    </main>
  );
}
