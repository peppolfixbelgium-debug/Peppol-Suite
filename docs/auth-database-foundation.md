# Authentication and database foundation

## Current architecture

Peppol Suite is a Vite/React browser application. The current authentication adapter is intentionally local-browser authentication, and conversion history is stored in browser localStorage. The compliance build does not yet have a server-side database or trusted authentication boundary.

## Foundation contract

`src/lib/auth/provider.ts` defines the application-facing authentication contract. UI code should depend on `AuthProvider`, not on a vendor SDK. A production adapter can therefore be introduced without changing invoice conversion code.

`src/lib/db/schema.ts` defines the first persistence boundary for users and conversion metadata. Conversion records deliberately contain metadata only; PDFs and generated XML are not part of this persistence contract.

## Production requirements before switching the provider

- Use a managed identity provider or server-side authentication implementation.
- Store password verifiers only on the server using a password-hashing algorithm designed for passwords (for example Argon2id or bcrypt), never client-side hashes as the security boundary.
- Issue and validate server-side sessions with secure, HttpOnly, SameSite cookies or an equivalent vetted mechanism.
- Enforce authorization on every server-side user/conversion operation; never trust a client-supplied `userId`.
- Persist conversion metadata with a foreign key from `conversions.userId` to `users.id` and appropriate indexes.
- Keep invoice PDFs out of the database unless a separate, explicitly secured document-storage design is approved.
- Add rate limiting, email/account lifecycle controls, audit logging, secret management, and CSRF protection where applicable.

This foundation is deliberately provider-neutral and does not claim that the current local adapter is production authentication.
