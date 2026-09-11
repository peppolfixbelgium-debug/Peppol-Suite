import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quotaSource = readFileSync("src/lib/peppol/quota.ts", "utf8");
const converterSource = readFileSync("src/routes/converter.tsx", "utf8");
const bulkSource = readFileSync("src/routes/bulk.tsx", "utf8");
const conversionApi = readFileSync("api/conversions.ts", "utf8");
const pricingSource = readFileSync("src/lib/peppol/pricing.ts", "utf8");
const privacySource = readFileSync("src/routes/privacy.tsx", "utf8");

assert.match(quotaSource, /ANONYMOUS_TRIAL_LIMIT = 3/, "Anonymous trial target must be explicit and local-only");
assert.match(quotaSource, /localStorage/, "Anonymous quota must remain a soft browser-local mechanism");
assert.match(converterSource, /consumeAnonymousQuota\(\)/, "Anonymous successful downloads must consume the local trial quota");
assert.match(converterSource, /saveConversion\([^\n]+issue_count:result\.issues\.length/, "Authenticated conversion history must persist the actual validation issue count");
assert.match(converterSource, /if\(conversionSaved\)/, "Repeated downloads must not create duplicate conversion records");
assert.match(conversionApi, /WITH quota AS/, "Server conversion quota and history must be committed atomically in one SQL statement");
assert.match(conversionApi, /Invalid conversion kind/, "Unknown conversion kinds must not silently consume the single-conversion quota");
assert.match(conversionApi, /plan_id === \"free\"/, "Free accounts must not receive the Pro-only bulk entitlement");
assert.match(bulkSource, /MAX_ZIP_BYTES=50\*1024\*1024/, "Bulk ZIP size must be bounded");
assert.match(bulkSource, /MAX_ZIP_ENTRIES=100/, "Bulk ZIP entry count must be bounded");
assert.match(bulkSource, /MAX_EXTRACTED_BYTES=100\*1024\*1024/, "Bulk extracted size must be bounded");
assert.match(bulkSource, /unsafeOriginalName/, "ZIP traversal entries must be inspected explicitly");
assert.match(bulkSource, /uniqueFilename/, "Duplicate output filenames must not overwrite each other");
assert.match(pricingSource, /id: \"free\"/, "Free tier must remain present");
assert.match(pricingSource, /id: \"pro\"/, "Pro tier must be represented by the actual product tier");
assert.match(pricingSource, /id: \"business\"/, "Business tier must be represented by the actual product tier");
assert.doesNotMatch(pricingSource, /price: (19|49|99)/, "Unfinalized paid prices must not be published");
assert.match(privacySource, /Google or with email and password/, "Privacy page must describe current authentication accurately");
assert.match(privacySource, /Microsoft and itsme/, "Future sign-in providers must be clearly described as planned");
assert.match(privacySource, /browser.*PDF|PDF.*browser/i, "Privacy page must describe browser-side PDF processing");
assert.match(privacySource, /does not store the uploaded PDF or generated XML body/, "Privacy page must describe current storage behavior");
assert.match(privacySource, /Vercel/, "Privacy page must identify current hosting infrastructure");
assert.match(privacySource, /Neon PostgreSQL/, "Privacy page must identify current database infrastructure");
assert.doesNotMatch(privacySource, /Stripe/i, "Privacy page must not imply live Stripe/payment processing exists");

console.log("Freemium/product/privacy regression: PASS");
