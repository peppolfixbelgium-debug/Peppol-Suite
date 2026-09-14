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
          <h2 className="mb-2 text-base font-semibold text-foreground">What the product processes</h2>
          <p>
            PDF files are processed in your browser with PDF.js. The current single-file and bulk conversion
            flows do not upload the PDF to our servers for parsing. Anonymous trial usage is tracked locally
            in your browser using localStorage; this is intentionally a soft device-local quota.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">What is stored for signed-in accounts</h2>
          <p>
            When you sign in, the service stores account information such as your email, name and authentication
            provider/account identifier, plus hashed session and authentication tokens. Session cookies are
            HttpOnly, SameSite=Lax and Secure in production.
          </p>
          <p className="mt-3">
            Signed-in conversion history and quota use metadata such as invoice number, supplier and customer
            names, total, currency, status, issue count and creation time. The current implementation does not
            store the uploaded PDF or generated XML body in the database.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Sign-in and infrastructure</h2>
          <p>
            You can currently sign in with Google or with email and password. Additional sign-in options,
            including Microsoft and itsme®, are planned as the product evolves. Availability may vary by region
            and rollout stage.
          </p>
          <p className="mt-3">
            The production application is hosted on Vercel and uses Neon PostgreSQL for signed-in account,
            quota and conversion-history data. Google is a current sign-in provider. Live payment processing
            is not currently enabled.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Current product limitations</h2>
          <p>
            There is currently no self-service account or conversion-history deletion control in the product.
            Local anonymous quota can be cleared by clearing site data. Account retention and deletion procedures
            require the product operator to define the applicable process.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Legal notice status</h2>
          <p>
            This page describes the current technical implementation and is not a substitute for the final legal
            privacy notice. Retention periods, data-controller details, processor terms and any legal rights or
            obligations should be confirmed before production launch.
          </p>
        </section>
      </div>
    </main>
  );
}
