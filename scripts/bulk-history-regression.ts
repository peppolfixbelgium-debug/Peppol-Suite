import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const bulkSource = readFileSync("src/routes/bulk.tsx", "utf8");
const apiSource = readFileSync("api/conversions.ts", "utf8");

assert.match(bulkSource, /saveConversion\(/, "Bulk conversion must persist conversion metadata");
assert.match(bulkSource, /saveConversion\([^\n]+\"bulk\"\)/, "Bulk conversion must use the bulk quota/history path");
assert.doesNotMatch(bulkSource, /fetch\(\"\/api\/usage\",\{method:\"POST\"/, "Bulk UI must not increment quota separately from history persistence");
assert.match(apiSource, /input\.kind === \"bulk\"/, "Conversion API must distinguish bulk records");
assert.match(apiSource, /bulk_used = usage_quota\.bulk_used \+ 1/, "Bulk records must consume the bulk quota atomically");
assert.match(apiSource, /INSERT INTO conversions/, "Bulk records must be persisted in conversion history");
console.log("Bulk history/quota regression: PASS");
