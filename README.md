# Peppol Suite

A browser-first PDF invoice conversion and validation tool for Belgian/EU Peppol workflows.

## Current product

- PDF invoice parsing in the browser with PDF.js
- Editable invoice fields with confidence markers
- Peppol BIS 3.0 / UBL 2.1 XML generation
- EN 16931-oriented validation checks
- XML upload/paste validator
- Bulk PDF conversion + ZIP download + CSV summary
- Anonymous trial: 3 document units per month
- Signed-in Free plan: 5 document units per month, enforced server-side
- Signed-in conversion history stores metadata rather than uploaded PDF/XML bodies
- Google OAuth and email/password sign-in
- English / French / Dutch UI
- Light / dark mode
- Pricing, Terms, Privacy and Security pages
- Vercel deployment with Neon PostgreSQL for authenticated account, quota and history data

## Production architecture

The production application is deployed on Vercel and uses Neon PostgreSQL for authenticated account, quota and conversion-history state. Single-file and bulk PDF parsing are browser-side; the current conversion flows do not upload PDFs to the server for parsing.

Authenticated quota and history are server-enforced. Anonymous trial usage is intentionally a soft, browser-local mechanism and should not be treated as a security boundary.

Production credentials and database configuration belong in the deployment provider's secret/environment configuration. Do not commit credentials or secrets to Git.

## Local development

Install dependencies and run the Vite development server:

```bash
npm install
npm run dev
```

Useful verification commands:

```bash
npm run build
npm run typecheck
npm run lint
npm run test:regression
npm run test:oauth-security
npm run test:quota
npm run test:auth-regression
```

Some database-backed regression commands require the appropriate test database configuration. Never use production customer data for regression testing.

## Deploy to Vercel

1. Import the repository into Vercel.
2. Use the Vite framework/build configuration already present in the repository.
3. Configure the production environment variables and OAuth/database settings required by the application.
4. Deploy.
5. Verify the exact deployed commit and relevant application flows before calling production READY.

## Peppol scope

Peppol Suite prepares structured UBL/Peppol-ready invoice output for use with the customer's own Access Point. It does **not** operate a certified Peppol Access Point and does **not** transmit invoices over the Peppol network.

Generated XML and validation results are product outputs, not a blanket legal, tax, accounting, or network-acceptance guarantee. Customers remain responsible for invoice data, applicable requirements and delivery through their chosen Access Point.

## Launch status

GitHub `PROJECT-STATE.md` and master Issue #23 are the source of truth for production QA, legal/company gates, pricing, payments and launch readiness.

Live Stripe payments are intentionally OFF until the required company, VAT/tax, pricing, legal and accounting approvals are complete.
