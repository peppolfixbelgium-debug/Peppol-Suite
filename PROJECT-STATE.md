# Peppol Suite — Project State

## Current execution checkpoint
- Current main is `4b58d85da48323e9e8241564e823e0109467a20a` after fixing the Stripe checkout regression guard to match the implemented optional-input syntax.
- CI run `35009483694` for the preceding checkpoint `3c9241a60e9510052e99b11f23cfcac5f8677dd1` completed FAILURE only in `test:freemium-product`; migrations, typecheck, lint, build, core regression, OAuth/security, auth, Vercel adapters, and bulk-history passed. The failure was a stale test regex expecting `input.plan` while the implementation correctly uses `input?.plan`.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Pricing regression explicitly guards the approved paid-tier amounts/discount and Stripe test-mode checkout controls.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering remains evidence-gated until production authenticated browser E2E can be independently evidenced.
- Production authenticated browser evidence remains an environment limitation documented in #34/#36; API/database checks must not be represented as authenticated UI PASS.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized.
- Production deployment still requires independent fresh verification against the latest verified SHA; no Vercel deployment GREEN claim is made without that evidence.

## Operating rule
Execute → verify → commit → record evidence → move to the next blocker. Never claim GREEN without verifiable evidence.
