import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/peppol/pricing";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  const lang = usePrefs((s) => s.lang);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "pricing_title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t(lang, "pricing_sub")}</p>
      <p className="mt-4 max-w-2xl text-sm text-muted">Pricing and final entitlement limits are still being finalized; no live payments are enabled.</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PRICING.tiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "flex flex-col rounded-2xl border bg-elevated p-5",
              tier.popular ? "border-accent" : "border-border",
            )}
          >
            <h2 className="font-medium">{tier.name}</h2>
            <p className="mt-3 font-display text-2xl">{tier.price === null ? "Pricing coming soon" : `€${tier.price}`}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Button asChild className="mt-6" variant={tier.popular ? "default" : "outline"}>
              <Link to={tier.id === "free" ? "/converter" : "/login"}>{tier.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
