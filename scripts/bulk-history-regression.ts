import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bulkSource = readFileSync("src/routes/bulk.tsx", "utf8");
const apiSource = readFileSync("api/conversions.ts", "utf8");
const usageSource = readFileSync("api/usage.ts", "utf8");

assert.match(bulkSource, /consumeBulkQuota\(\)/, "Bulk conversion must reserve one bulk job entitlement");
assert.match(bulkSource, /saveConversion\(/, "Bulk conversion must persist each successful PDF in history");
assert.doesNotMatch(bulkSource, /saveConversion\([^\n]+\"bulk\"\)/, "PDF conversion records must not consume the bulk-job quota");
assert.match(bulkSource, /let bulkReserved=false/, "A batch must reserve the bulk entitlement once");
assert.match(bulkSource, /let conversionRemaining=quota\.remaining/, "Bulk processing must track the authenticated conversion allowance");
assert.match(bulkSource, /conversionRemaining-=1/, "Each successfully persisted PDF must consume one conversion allowance");
assert.match(apiSource, /input\.kind !== \"conversion\"/, "Conversion history API must reject the obsolete bulk kind");
assert.doesNotMatch(apiSource, /kind === \"bulk\"/, "Conversion history API must not provide a quota-bypassing bulk record path");
assert.match(apiSource, /WITH quota AS/, "Conversion quota and history must be committed atomically");
assert.match(usageSource, /plan\?\.plan_id===\"free\"/, "The bulk usage endpoint must enforce the Free-plan entitlement server-side");
assert.match(usageSource, /bulk_used=usage_quota\.bulk_used\+1/, "A bulk job must increment bulk usage atomically");
console.log("Bulk history/quota regression: PASS");
