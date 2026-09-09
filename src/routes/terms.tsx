import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";

export const Route = createFileRoute("/terms")({ component: Terms });

function Terms() {
  const lang = usePrefs((s) => s.lang);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "terms_title")}</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          Peppol Suite generates UBL 2.1 / Peppol BIS 3.0 XML from invoice data that you provide or that we
          extract in your browser. It is a software tool, not a Peppol Access Point, certified sending
          service, accountant, or legal advisor.
        </p>
        <p>
          You remain responsible for the completeness and accuracy of every invoice, for choosing a certified
          Access Point, and for meeting Belgian and EU invoicing rules (including the 2026 B2B mandate).
        </p>
        <p>
          The free tier allows five conversions per calendar month, counted in this browser. Paid volume, if
          enabled on your account, is described on the pricing page. We may suspend abuse.
        </p>
        <p>
          The service is provided as-is. We do not warrant that generated XML will be accepted by every
          Access Point or tax authority. Validate before sending.
        </p>
        <p>Belgian law applies. These terms were last updated in April 2026.</p>
      </div>
    </main>
  );
}
