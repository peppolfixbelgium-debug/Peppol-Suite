import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  const lang = usePrefs((s) => s.lang);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "privacy_title")}</h1>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">At a glance</h2>
          <p>
            Peppol Suite currently processes PDF documents in the browser for the single-file and bulk conversion
            flows described below. The current implementation does not store uploaded PDFs or generated XML bodies
            in the account database. This page records the technical state of the product; the final legal privacy
            notice must be completed and professionally reviewed before launch.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Documents and trial usage</h2>
          <p>
            PDF files are processed in your browser with PDF.js. The current single-file and bulk conversion flows
            do not upload the PDF to our servers for parsing. Anonymous trial usage is tracked locally in your
            browser using localStorage and is a soft, device-local quota rather than an account record.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Signed-in account data</h2>
          <p>
            When you sign in, the service stores account information such as your email, name and authentication
            provider/account identifier, plus hashed session and authentication tokens. Session cookies are
            HttpOnly, SameSite=Lax and Secure in production.
          </p>
          <p className="mt-3">
            Signed-in conversion history and quota use metadata can include invoice number, supplier and customer
            names, total, currency, status, issue count and creation time. The current implementation does not store the uploaded PDF or generated XML body in the database.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Providers and infrastructure</h2>
          <p>
            You can currently sign in with Google or with email and password. The production application is hosted
            on Vercel and uses Neon PostgreSQL for signed-in account, quota and conversion-history data. Google is
            a current sign-in provider. Live payment processing is not currently enabled.
          </p>
          <p className="mt-3">
            Additional sign-in options, including Microsoft and itsme®, are planned as the product evolves and are
            not described as active processing partners by this page.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Cookies and local browser storage</h2>
          <p>
            Signed-in sessions use authentication cookies configured as HttpOnly, SameSite=Lax and Secure in
            production. Anonymous trial usage uses localStorage. The exact cookie inventory, consent requirements
            and any non-essential storage behavior must be confirmed as part of the final legal/privacy review.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Deletion, export and retention</h2>
          <p>
            There is currently no self-service account or conversion-history deletion or export control in the
            product. Local anonymous quota can be cleared by clearing site data. Account retention periods,
            deletion procedures, export handling and the operational process for responding to data-rights requests
            still need to be defined and implemented where required.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Legal completion required before launch</h2>
          <p>
            The final privacy notice still requires confirmation of the data controller and contact details,
            purposes and legal bases, applicable retention periods, data-subject rights and request process,
            international-transfer details, processor/subprocessor terms, cookie/consent requirements and other
            obligations applicable to the service. These items must not be inferred from this technical page and
            require appropriate Belgian/EU legal review before launch.
          </p>
        </section>
      </div>
    </main>
  );
}
