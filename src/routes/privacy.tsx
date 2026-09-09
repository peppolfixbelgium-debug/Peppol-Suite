import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  const lang = usePrefs((s) => s.lang);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "privacy_title")}</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          Single conversions and bulk ZIP jobs run in your browser with pdf.js. The PDF is not uploaded to
          our servers for those flows. Quota is stored in localStorage on this device.
        </p>
        <p>
          If you sign in, we store account identity (email or social login) and conversion metadata: invoice
          number, party names, totals, currency, status and issue counts. We do not store the PDF or the XML
          body.
        </p>
        <p>
          Authentication uses Google, X, or email and password. We do not offer Microsoft, Apple, or itsme
          sign-in in this product.
        </p>
        <p>
          We do not sell invoice data. We do not use conversion contents for advertising. Signed-in history
          can be deleted by contacting us; local quota can be cleared by clearing site data.
        </p>
        <p>This notice was last updated in April 2026.</p>
      </div>
    </main>
  );
}
