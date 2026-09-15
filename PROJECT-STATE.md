# Peppol Suite — Project State

## Current execution checkpoint
- Current main is `6962123e43c4d5f56987f574a359a650bdcdb64b` after adding regression guards for the Founder-approved pricing amounts, annual discount, and Stripe test-mode checkout controls.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Pricing regression now explicitly fails if those approved paid-tier amounts/discount drift, if Stripe checkout loses its test-mode guard, or if checkout accepts an unapproved plan/cadence.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage also protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering remains evidence-gated until production authenticated browser E2E can be independently evidenced.
- Production authenticated browser evidence remains an environment limitation documented in #34/#36; API/database checks must not be represented as authenticated UI PASS.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized.
- Production deployment still requires independent fresh verification against the latest verified SHA; no Vercel deployment GREEN claim is made without that evidence.

## Operating rule
Execute → verify → commit → record evidence → move to the next blocker. Never claim GREEN without verifiable evidence.
