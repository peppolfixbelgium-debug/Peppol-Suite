# Peppol Suite — Project State

## Current execution checkpoint
- Current main includes the latest engineering/pricing/legal/company preparation plus a new Belgian prospect evidence pack at `9525b82ebbd36367de73ac571ab94784e03abc80`.
- The prospect evidence pack documents 10 additional Belgian accounting/Peppol fit signals from public websites and founder-led discovery hypotheses; it records no customer contact, pain validation, or willingness-to-pay claim.
- CI verification must be treated separately from the evidence-pack commit; no CI GREEN claim is made for the current docs checkpoint until a workflow is independently observed.
- Pricing baseline remains unchanged: Pro €14.90/month or €149/year; Business €44.90/month or €449/year; 16.7% annual discount; no live billing activation.
- Authenticated conversion-history deletion remains implemented with same-origin protection, strict user ownership, audit event emission, confirmation-gated dashboard control, and matching Privacy disclosure.
- Product/privacy regression coverage protects the implemented CSV history export and deletion behavior.

## Current launch posture
- Product/Engineering remains evidence-gated until production authenticated browser E2E can be independently evidenced.
- Production authenticated browser evidence remains an environment limitation documented in #34/#36; API/database checks must not be represented as authenticated UI PASS.
- Legal/GDPR remains an external professional-review gate; technical copy has been hardened to avoid unsupported claims.
- Company/ownership remains a professional confirmation gate; the working direction must not be treated as incorporated/legal fact.
- Live Stripe/payment processing remains OFF; checkout code is explicitly test-mode guarded.
- Growth outbound remains OFF pending Founder approval; no paid prospecting credits are authorized. Current public-web research now provides a 10-prospect additional evidence cohort for founder-led discovery preparation.
- Production deployment still requires independent fresh verification against the latest verified SHA; no Vercel deployment GREEN claim is made without that evidence.

## Operating rule
Execute → verify → commit → record evidence → move to the next blocker. Never claim GREEN without verifiable evidence.
