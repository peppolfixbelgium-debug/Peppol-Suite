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
          Access Point, and for meeting the Belgian and EU invoicing rules that apply to your transactions.
        </p>
        <p>
          The anonymous trial currently allows three document units per month in the browser. Signed-in
          accounts use server-enforced plan allowances. The current Free allowance is five document units per
          month. Pro is €14.90/month or €149/year with 100 document units and 500 bulk units. Business is
          €44.90/month or €449/year with 1,000 document units and 10,000 bulk units. Bulk processing has
          separate plan entitlements. Live payment processing remains disabled until the applicable launch
          gates are satisfied.
        </p>
        <p>
          The service is provided as-is. We do not warrant that generated XML will be accepted by every
          Access Point or tax authority. Validation performed by Peppol Suite is a product check, not a legal,
          tax, accounting, or acceptance guarantee. Review the result before sending.
        </p>
        <p>
          These terms are an operational product draft pending final company identity, commercial terms,
          payment activation terms and professional legal review. Belgian law is intended to apply, subject to
          any mandatory rights that cannot lawfully be excluded or limited.
        </p>
        <p>Product draft last updated 15 September 2026.</p>
      </div>
    </main>
  );
}
