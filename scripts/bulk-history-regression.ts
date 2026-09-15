import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bulkSource = readFileSync("src/routes/bulk.tsx", "utf8");
const apiSource = readFileSync("api/conversions.ts", "utf8");
const usageSource = readFileSync("api/usage.ts", "utf8");

assert.match(bulkSource, /saveBulkConversion\(/, "Bulk conversion must persist each successful PDF as a bulk document");
assert.doesNotMatch(bulkSource, /saveConversion\(/, "Bulk conversion must not use the normal conversion persistence path");
assert.match(bulkSource, /let bulkRemaining=quota\.bulkRemaining/, "Bulk processing must track the authenticated bulk allowance");
assert.match(bulkSource, /bulkRemaining-=1/, "Each successfully persisted PDF must consume one bulk document allowance");
assert.match(apiSource, /input\.kind !== \"conversion\" && input\.kind !== \"bulk\"/, "Conversion history API must accept only explicit conversion or bulk record kinds");
assert.match(apiSource, /input\.kind === \"bulk\"/, "Conversion history API must provide the separate bulk record path");
assert.match(apiSource, /SET bulk_used = usage_quota\.bulk_used \+ 1/, "Bulk documents must increment bulk usage atomically");
assert.match(apiSource, /WITH quota AS/, "Conversion quota and history must be committed atomically");
assert.match(usageSource, /bulk_used/, "The usage endpoint must expose bulk usage");
console.log("Bulk history/quota regression: PASS");
