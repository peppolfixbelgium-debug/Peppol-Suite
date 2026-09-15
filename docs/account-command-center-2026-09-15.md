# Account Command Center — 2026-09-15

## Implemented
- Customer-facing Account dashboard upgraded from a basic profile/history page to a command-center surface.
- Added customer greeting and prominent Convert invoice / Bulk convert actions.
- Added first-use onboarding CTA for unused Free accounts.
- Subscription card now reads plan details from the canonical pricing configuration instead of duplicating entitlement copy.
- Added pricing-backed monthly plan display and plan-options CTA.
- Usage cards retain separate conversion and bulk-document counters and show remaining units.
- Added monthly reset countdown indicator based on the next calendar month.
- Added Security status card and Quick actions for validation and plan comparison.
- Admin test mode remains explicitly visible.

## Verification
- Account 2.0 implementation commit: `3b6928f2f3c3ae93b494acd0da8234f3d23d8200`.
- GitHub CI run #228 was observed running against that exact commit; typecheck was in progress at the time of evidence capture.
- No CI GREEN claim is made until the run completes.
- Production deployment must still be independently verified against the resulting latest main SHA before production GREEN is claimed.
