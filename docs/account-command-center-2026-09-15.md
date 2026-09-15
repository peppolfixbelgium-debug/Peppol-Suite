# Account Dashboard & Conversion Metering — 2026-09-15

## Implemented
- Customer-facing Account dashboard upgraded from a basic profile/history page to an account dashboard surface.
- Added customer greeting and prominent Convert invoice / Bulk convert actions.
- Added first-use onboarding CTA for unused Free accounts.
- Subscription card reads plan details from the canonical pricing configuration.
- Usage cards retain separate conversion and bulk-document counters and show remaining units.
- Added monthly reset countdown indicator based on the next calendar month.
- Added Security status card and Quick actions for validation and plan comparison.
- Admin test mode remains explicitly visible.
- Added an explicit Sign out action to the Account profile card.

## Conversion metering decision
- Uploading a PDF is **not** a billable conversion. Users can upload, inspect extracted fields, correct them, and run validation without unexpectedly consuming a document unit.
- A normal conversion is consumed exactly when the user explicitly selects **Convert & prepare XML** and the server successfully records the conversion.
- The conversion is therefore counted even if the user never downloads the XML.
- XML copy/download controls remain locked until the successful conversion is recorded, preventing copy/download from bypassing quota.
- Repeated explicit conversions are separate usage events; accidental duplicate clicks are protected by the in-flight/ready state in the converter UI.
- Bulk remains document-based: each successfully saved bulk document consumes one bulk-document unit.
- Anonymous trial usage follows the same explicit-conversion principle using the device-local trial counter.

## Verification
- Account 2.0 implementation commit: `3b6928f2f3c3ae93b494acd0da8234f3d23d8200`.
- Explicit conversion metering commit: `2062a04f18a0226579d829c304d2394945258822`.
- Account dashboard refinement/sign-out commit: `160e81bca8765146d4d9cf19c97c690e5288977d`.
- GitHub CI for the latest changes is being independently tracked before claiming GREEN.
- Vercel deployment is subject to the platform build-rate limit observed on the latest push; no production GREEN claim is made until the new application code is independently observed deployed.
