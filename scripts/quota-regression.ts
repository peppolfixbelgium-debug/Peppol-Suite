import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import { consumeAnonymousQuota, getAnonymousQuota } from "../src/lib/peppol/quota";

const execFileAsync = promisify(execFile);

const storage = new Map<string, string>();
globalThis.window = { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); } } } as unknown as Window & typeof globalThis;

assert.deepEqual(getAnonymousQuota(), { used: 0, limit: 3, remaining: 3 });
assert.deepEqual(consumeAnonymousQuota(), { used: 1, limit: 3, remaining: 2 });
assert.deepEqual(consumeAnonymousQuota(), { used: 2, limit: 3, remaining: 1 });
assert.deepEqual(consumeAnonymousQuota(), { used: 3, limit: 3, remaining: 0 });
assert.deepEqual(consumeAnonymousQuota(), { used: 3, limit: 3, remaining: 0 });

const source = readFileSync("api/conversions.ts", "utf8");
assert.match(source, /WITH quota AS/, "Authenticated conversion quota must be atomic with history persistence");
assert.match(source, /WHERE usage_quota\.conversions_used < \$\{limit\}/, "Authenticated conversion quota must stop at the plan limit");
assert.match(source, /INSERT INTO conversions/, "Successful conversions must be recorded in history");
assert.match(source, /input\.kind === "bulk"/, "Bulk records must use a distinct quota path");
assert.match(source, /SET bulk_used = usage_quota\.bulk_used \+ 1/, "Each successful bulk document must consume one bulk document unit");
assert.match(source, /WHERE usage_quota\.bulk_used < \$\{limit\}/, "Bulk document quota must stop at the plan limit");
assert.match(source, /Monthly bulk document limit reached/, "Bulk quota exhaustion must return an explicit document-limit error");

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required for quota regression");
const sql = `
BEGIN;
INSERT INTO users (email, password_hash) VALUES ('quota-regression@example.test', 'synthetic-hash');
DO $$
DECLARE uid uuid; first_count integer; second_count integer;
BEGIN
  SELECT id INTO uid FROM users WHERE email = 'quota-regression@example.test';
  INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used) VALUES (uid, date_trunc('month', current_date)::date, 4, 0);
  WITH quota AS (
    INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used)
    VALUES (uid, date_trunc('month', current_date)::date, 1, 0)
    ON CONFLICT (user_id, period_start) DO UPDATE
      SET conversions_used = usage_quota.conversions_used + 1
      WHERE usage_quota.conversions_used < 5
    RETURNING conversions_used
  ), inserted AS (
    INSERT INTO conversions (user_id, invoice_id, supplier, customer, total, currency, status, issue_count)
    SELECT uid, 'QUOTA-OK', 'Seller', 'Buyer', 10.00, 'EUR', 'ok', 0 FROM quota
    RETURNING id
  ) SELECT count(*) INTO first_count FROM inserted;
  IF first_count <> 1 THEN RAISE EXCEPTION 'conversion at remaining quota should succeed'; END IF;

  WITH quota AS (
    INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used)
    VALUES (uid, date_trunc('month', current_date)::date, 1, 0)
    ON CONFLICT (user_id, period_start) DO UPDATE
      SET conversions_used = usage_quota.conversions_used + 1
      WHERE usage_quota.conversions_used < 5
    RETURNING conversions_used
  ), inserted AS (
    INSERT INTO conversions (user_id, invoice_id, supplier, customer, total, currency, status, issue_count)
    SELECT uid, 'QUOTA-BLOCKED', 'Seller', 'Buyer', 11.00, 'EUR', 'ok', 0 FROM quota
    RETURNING id
  ) SELECT count(*) INTO second_count FROM inserted;
  IF second_count <> 0 THEN RAISE EXCEPTION 'conversion at quota limit must be blocked'; END IF;
END $$;

DO $$
DECLARE used integer; rows_count integer;
BEGIN
  SELECT conversions_used INTO used FROM usage_quota WHERE user_id=(SELECT id FROM users WHERE email='quota-regression@example.test') AND period_start=date_trunc('month', current_date)::date;
  SELECT count(*)::int INTO rows_count FROM conversions WHERE user_id=(SELECT id FROM users WHERE email='quota-regression@example.test');
  IF used <> 5 OR rows_count <> 1 THEN RAISE EXCEPTION 'quota/history atomic semantics failed: used=%, rows=%', used, rows_count; END IF;
END $$;

DO $$
DECLARE uid uuid; first_count integer; second_count integer; observed_bulk_used integer;
BEGIN
  SELECT id INTO uid FROM users WHERE email = 'quota-regression@example.test';
  UPDATE usage_quota SET conversions_used = 5, bulk_used = 4 WHERE user_id = uid AND period_start = date_trunc('month', current_date)::date;

  WITH quota AS (
    INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used)
    VALUES (uid, date_trunc('month', current_date)::date, 0, 1)
    ON CONFLICT (user_id, period_start) DO UPDATE
      SET bulk_used = usage_quota.bulk_used + 1
      WHERE usage_quota.bulk_used < 5
    RETURNING bulk_used
  ), inserted AS (
    INSERT INTO conversions (user_id, invoice_id, supplier, customer, total, currency, status, issue_count)
    SELECT uid, 'BULK-OK', 'Seller', 'Buyer', 12.00, 'EUR', 'ok', 0 FROM quota
    RETURNING id
  ) SELECT count(*) INTO first_count FROM inserted;
  IF first_count <> 1 THEN RAISE EXCEPTION 'bulk document at remaining quota should succeed'; END IF;

  WITH quota AS (
    INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used)
    VALUES (uid, date_trunc('month', current_date)::date, 0, 1)
    ON CONFLICT (user_id, period_start) DO UPDATE
      SET bulk_used = usage_quota.bulk_used + 1
      WHERE usage_quota.bulk_used < 5
    RETURNING bulk_used
  ), inserted AS (
    INSERT INTO conversions (user_id, invoice_id, supplier, customer, total, currency, status, issue_count)
    SELECT uid, 'BULK-BLOCKED', 'Seller', 'Buyer', 13.00, 'EUR', 'ok', 0 FROM quota
    RETURNING id
  ) SELECT count(*) INTO second_count FROM inserted;
  IF second_count <> 0 THEN RAISE EXCEPTION 'bulk document at quota limit must be blocked'; END IF;

  SELECT usage_quota.bulk_used INTO observed_bulk_used FROM usage_quota WHERE user_id=uid AND period_start=date_trunc('month', current_date)::date;
  IF observed_bulk_used <> 5 THEN RAISE EXCEPTION 'bulk quota must count documents, got %', observed_bulk_used; END IF;
END $$;

ROLLBACK;
`;
execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-X", "--no-psqlrc", "--dbname", databaseUrl], { input: sql, stdio: ["pipe", "inherit", "inherit"] });

async function testConcurrentQuota() {
  const setup = `
    INSERT INTO users (email, password_hash) VALUES ('quota-concurrency@example.test', 'synthetic-hash');
    INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used)
    SELECT id, date_trunc('month', current_date)::date, 0, 0 FROM users WHERE email='quota-concurrency@example.test';
  `;
  execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-X", "--no-psqlrc", "--dbname", databaseUrl, "-c", setup], { stdio: "inherit" });

  const attempt = `
    WITH quota AS (
      INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used)
      SELECT id, date_trunc('month', current_date)::date, 1, 0 FROM users WHERE email='quota-concurrency@example.test'
      ON CONFLICT (user_id, period_start) DO UPDATE
        SET conversions_used = usage_quota.conversions_used + 1
        WHERE usage_quota.conversions_used < 5
      RETURNING user_id
    ), inserted AS (
      INSERT INTO conversions (user_id, invoice_id, supplier, customer, total, currency, status, issue_count)
      SELECT user_id, 'CONCURRENT-OK-' || substr(md5(random()::text), 1, 8), 'Seller', 'Buyer', 10.00, 'EUR', 'ok', 0 FROM quota
      RETURNING id
    ) SELECT count(*) FROM inserted;
  `;
  const results = await Promise.all(Array.from({ length: 10 }, () => execFileAsync("psql", ["-t", "-A", "-v", "ON_ERROR_STOP=1", "-X", "--no-psqlrc", "--dbname", databaseUrl, "-c", attempt])));
  const successes = results.filter(({ stdout }) => stdout.trim() === "1").length;
  assert.equal(successes, 5, `exactly five of ten concurrent conversion reservations must succeed; got ${successes}`);

  const verification = execFileSync("psql", ["-t", "-A", "-v", "ON_ERROR_STOP=1", "-X", "--no-psqlrc", "--dbname", databaseUrl, "-c", `SELECT (SELECT conversions_used FROM usage_quota WHERE user_id=(SELECT id FROM users WHERE email='quota-concurrency@example.test')) || ':' || (SELECT count(*) FROM conversions WHERE user_id=(SELECT id FROM users WHERE email='quota-concurrency@example.test'));`], { encoding: "utf8" }).trim();
  assert.equal(verification, "5:5", `concurrent quota/history state must be 5:5, got ${verification}`);

  execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-X", "--no-psqlrc", "--dbname", databaseUrl, "-c", "DELETE FROM users WHERE email='quota-concurrency@example.test';"], { stdio: "inherit" });
}

await testConcurrentQuota();
console.log("Quota regression suite: PASS");