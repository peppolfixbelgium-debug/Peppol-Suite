# Peppol Suite — Vercel Edition

A clean, Vercel-deployable rebuild of the Peppol Suite shown in the supplied Grok workspace and screenshots.

## Included

- PDF invoice parsing in the browser with PDF.js
- Editable invoice fields with confidence markers
- Peppol BIS 3.0 / UBL XML generation
- EN 16931-oriented validation checks
- XML upload/paste validator
- Bulk PDF conversion + ZIP download + CSV summary
- Five free conversions per calendar month
- Local sign-up/sign-in and per-user local conversion history
- English / French / Dutch UI
- Light / dark mode
- Pricing, Terms, Privacy and Security pages
- Vercel SPA routing configuration
- No Grok runtime, Grok auth broker, Grok middleware, Nitro, PGLite or special preview infrastructure

## Deploy to Vercel

1. Extract this project or push it to your GitHub repository.
2. In Vercel choose **Add New → Project** and import the repository.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. No environment variables are required for the included browser-first edition.
7. Deploy.

`vercel.json` rewrites application routes to `index.html`, so `/converter`, `/validate`, `/bulk`, etc. continue to work after refresh.

## Important production note

The included authentication is intentionally dependency-free so the app can deploy immediately without a database. Accounts, sessions, quota and history are stored in the visitor's browser. This is suitable for a functional MVP/demo, but it is **not equivalent to secure multi-device SaaS authentication**.

For production billing and shared accounts, the next step is to connect the existing UI to a managed auth/database provider (for example Supabase or Neon + an auth service) and move quota/history server-side.

## Peppol scope

This application prepares XML for the user's own Access Point. It does not operate a certified Peppol Access Point or transmit invoices over the Peppol network.
