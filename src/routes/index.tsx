import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FileCheck2, Lock, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/peppol/pricing";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const lang = usePrefs((s) => s.lang);
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:pt-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">{t(lang, "hero_kicker")}</p>
        <h1 className="mt-4 max-w-4xl font-display text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {t(lang, "hero_title")}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted sm:text-lg">{t(lang, "hero_sub")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/converter">
              {t(lang, "hero_cta")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/converter" search={{ sample: true }}>
              {t(lang, "hero_sample")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/validate">{t(lang, "hero_validate")}</Link>
          </Button>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1.5 text-xs text-muted">
          <Lock className="size-3.5" />
          {t(lang, "privacy_chip")}
        </p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl tracking-tight">{t(lang, "honest_title")}</h2>
            <p className="mt-4 text-muted">{t(lang, "honest_is")}</p>
            <p className="mt-4 flex items-start gap-2 text-muted">
              <ShieldOff className="mt-1 size-4 shrink-0 text-accent" />
              {t(lang, "honest_isnot")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { t: "how_1_t", d: "how_1" },
              { t: "how_2_t", d: "how_2" },
              { t: "how_3_t", d: "how_3" },
            ].map((item, i) => (
              <div key={item.t} className="rounded-xl border border-border bg-elevated p-4">
                <p className="text-xs text-subtle">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-1 font-medium">{t(lang, item.t as "how_1_t")}</h3>
                <p className="mt-1 text-sm text-muted">{t(lang, item.d as "how_1")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl tracking-tight">{t(lang, "mandate_title")}</h2>
        <p className="mt-4 max-w-3xl text-muted">{t(lang, "mandate_body")}</p>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl tracking-tight">{t(lang, "pricing_title")}</h2>
          <p className="mt-2 text-muted">{t(lang, "pricing_sub")}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PRICING.tiers.map((tier) => (
              <div
                key={tier.id}
                className={cn(
                  "flex flex-col rounded-2xl border bg-elevated p-5",
                  tier.popular ? "border-accent" : "border-border",
                )}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-medium">{tier.name}</h3>
                  {tier.popular ? <span className="text-xs text-accent">Popular</span> : null}
                </div>
                <p className="mt-3 font-display text-3xl">
                  {tier.price === 0 ? "€0" : `€${tier.price}`}
                  <span className="ml-1 text-sm font-sans text-muted">{t(lang, "pricing_mo")}</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {tier.invoices} {t(lang, "pricing_invoices")}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                  {tier.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Button asChild className="mt-5" variant={tier.id === "free" ? "default" : "outline"}>
                  <Link to={tier.id === "free" ? "/converter" : "/login"}>{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl tracking-tight">{t(lang, "faq_title")}</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(
            [
              ["faq_1_q", "faq_1_a"],
              ["faq_2_q", "faq_2_a"],
              ["faq_3_q", "faq_3_a"],
              ["faq_4_q", "faq_4_a"],
            ] as const
          ).map(([q, a]) => (
            <div key={q} className="rounded-xl border border-border bg-elevated p-5">
              <h3 className="flex items-start gap-2 font-medium">
                <FileCheck2 className="mt-0.5 size-4 text-accent" />
                {t(lang, q)}
              </h3>
              <p className="mt-2 text-sm text-muted">{t(lang, a)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
