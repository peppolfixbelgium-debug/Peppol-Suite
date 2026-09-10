# Production authentication and database foundation

## Architecture decision

Peppol Suite remains a Vite/React client application, with a small server-side API under `api/`. The API is deployed as Vercel Functions and is the trust boundary for authentication, authorization, quota, and persistence. The PDF → UBL conversion/compliance engine remains in the browser and is not rewritten.

PostgreSQL is provided by **Neon** through the Vercel Marketplace. This was selected after comparing practical Vercel-compatible options:

- **Neon:** native Vercel Marketplace integration, serverless PostgreSQL driver, database branching, and direct support for `@neondatabase/serverless`; this fits a Vite + Vercel Functions backend without introducing a framework migration.
- **Supabase:** also provides managed PostgreSQL and a Vercel integration, and includes a broader managed backend/auth platform. It is a good alternative, but adopting it would couple this foundation to Supabase Auth/client APIs when the application already has a provider-neutral auth contract.
- **Vercel Postgres:** the former product was powered by Neon and new Postgres provisioning has moved to the Neon Marketplace integration, so Neon is the clearer current choice for a new foundation.

Neon documentation recommends its serverless driver for Vercel/serverless workloads. The application uses the driver only in server-side `api/` code; database credentials are never imported into client code.

## Server trust boundary

The browser calls `/api/auth/*`, `/api/conversions`, and `/api/usage`. The server derives the authenticated user from an HttpOnly session cookie and looks up role/plan/limits from PostgreSQL. Client-supplied user IDs, plan values, roles, and usage counters are not used for authorization.

## Authentication flows implemented

- Email/password signup.
- Server-side PBKDF2-HMAC-SHA256 password hashing with 600,000 iterations and a unique random salt. The encoded verifier stores algorithm/work-factor/salt/hash, never the plaintext password.
- Email verification with single-use, expiring random tokens.
- Password-reset request with a generic response to reduce account enumeration, single-use expiring tokens, and revocation of existing sessions after reset.
- Server-side sessions stored as SHA-256 token hashes. The raw session token is only placed in an `HttpOnly; SameSite=Lax` cookie; production responses also set `Secure`.
- Logout invalidates the current session server-side.
- Google OAuth and Microsoft OAuth using authorization-code flows. OAuth state is random, stored hashed in PostgreSQL, expires, and is single-use.
- User/admin role field with server-side role enforcement available to API handlers.
- Security-event logging and database-backed rate-limit counters.

## Database schema

Migration: `migrations/001_auth_database.sql`

Tables:

- `users` — identity, password verifier, role, plan, email verification and disabled state.
- `accounts` — Google/Microsoft OAuth identities linked to users.
- `sessions` — hashed session tokens, expiry and revocation.
- `auth_tokens` — email-verification and password-reset tokens.
- `oauth_states` — short-lived OAuth state values.
- `plans` — Free, Paid, Business and Admin plan limits/API access flags.
- `subscriptions` — future billing-provider subscription mapping and period state.
- `usage_quota` — monthly conversion and bulk counters, keyed by user and period.
- `conversions` — server-owned conversion history metadata.
- `api_keys` — hashed API credentials, prefix, expiry/revocation and last-use tracking.
- `security_events` — authentication and security audit events.
- `rate_limits` — server-side request-window counters.

The migration uses foreign keys, unique constraints, check constraints and indexes for identity, sessions, OAuth identities, tokens, history, plans and security events.

PDF files and generated XML are not stored in PostgreSQL by this foundation.

## Environment variables

Required for the production API:

```text
DATABASE_URL=postgres://...                 # Neon PostgreSQL connection string
APP_URL=https://your-production-domain.example
RESEND_API_KEY=...                          # email delivery
EMAIL_FROM=Peppol Suite <no-reply@example.com>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

Do not commit these values. Configure them in Vercel Environment Variables and in a local `.env`/secret store when developing the API.

OAuth redirect URIs must be registered with the providers as:

```text
https://your-production-domain.example/api/auth/oauth/google/callback
https://your-production-domain.example/api/auth/oauth/microsoft/callback
```

The exact provider-console configuration, verified domains, consent-screen settings and email-sending domain remain deployment-specific and must be configured by the project owner.

## Local setup

1. Install dependencies with `npm install`. The current GitHub connector cannot run npm, so the lockfile must be regenerated/verified in a real Node 24 environment after the dependency change.
2. Provision a Neon PostgreSQL database through Vercel Marketplace or Neon.
3. Run `migrations/001_auth_database.sql` against that database.
4. Configure the environment variables above.
5. Register Google and Microsoft OAuth redirect URIs.
6. Configure Resend and verify the sending domain/address.
7. Run the application with `npm run dev` and exercise the auth flows.

## Security notes

This implementation intentionally avoids claims such as “bank-level security”. It establishes concrete controls instead. Password hashing is server-side; sessions are server-side and cookie-based; OAuth secrets and database credentials stay server-side; authorization and quota are checked against PostgreSQL; and security events are recorded.

PBKDF2 is used because it is available in the Node/Web Crypto runtime without a native password-hashing dependency. OWASP currently recommends Argon2id first and documents PBKDF2-HMAC-SHA256 at 600,000 iterations for environments requiring PBKDF2. If production requirements permit adding a vetted Argon2id implementation, that is the preferred future upgrade path.

Rate limiting here is application/database backed and should be complemented with platform/WAF controls for higher-risk or high-volume deployments. Email delivery, OAuth providers, billing, API-key lifecycle, and operational monitoring require real provider configuration and runtime verification.

## What remains before production

- Regenerate and validate `package-lock.json` with Node 24/npm in a real build environment.
- Run TypeScript, ESLint, Vite build and regression tests.
- Run database migration against a real Neon database.
- Exercise signup, verification, login, logout, password reset, Google OAuth and Microsoft OAuth in a browser.
- Verify cookie flags and session revocation over HTTPS.
- Test quota race conditions and admin authorization against a real database.
- Add billing-provider webhooks and subscription reconciliation before charging users.
- Add API-key management endpoints and API authentication before exposing public API access.
- Add operational monitoring/alerting and scheduled cleanup for expired sessions/tokens/rate-limit rows.
