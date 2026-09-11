import { nodeRequestToWebRequest } from "./usage.js";
import { getDb } from "./_lib/db.js";
import { getSessionUser, requireSameOrigin, securityEvent } from "./_lib/auth.js";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

type VercelRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  [key: string]: unknown;
};
type VercelResponse = {
  statusCode?: number;
  setHeader(name: string, value: string | string[]): VercelResponse;
  end(body?: string): void;
};

async function sendWebResponse(response: Response, res: VercelResponse): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(await response.text());
}

async function handleConversionRequest(request: Request): Promise<Response> {
  try {
    const user = await getSessionUser(request);
    if (!user) return json({ error: "Authentication required." }, 401);
    const sql = getDb();
    if (request.method === "GET") {
      const rows = await sql<any[]>`SELECT id, invoice_id, supplier, customer, total::text, currency, status, issue_count, created_at FROM conversions WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT 100`;
      const [quota] = await sql<any[]>`
        SELECT q.conversions_used, q.bulk_used, p.monthly_conversion_limit, p.monthly_bulk_limit
        FROM users u JOIN plans p ON p.id = u.plan_id
        LEFT JOIN usage_quota q ON q.user_id = u.id AND q.period_start = date_trunc('month', current_date)::date
        WHERE u.id = ${user.id}
      `;
      return json({ conversions: rows, quota: { used: Number(quota?.conversions_used ?? 0), limit: Number(quota?.monthly_conversion_limit ?? 0), bulkUsed: Number(quota?.bulk_used ?? 0), bulkLimit: Number(quota?.monthly_bulk_limit ?? 0) } });
    }
    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    requireSameOrigin(request);
    const input = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!input || typeof input !== "object") return json({ error: "Invalid JSON body." }, 400);
    const kind = input.kind === "bulk" ? "bulk" : "conversion";
    const invoiceId = typeof input.invoice_id === "string" ? input.invoice_id.slice(0, 200) : "";
    const supplier = typeof input.supplier === "string" ? input.supplier.slice(0, 300) : "";
    const customer = typeof input.customer === "string" ? input.customer.slice(0, 300) : "";
    const total = typeof input.total === "string" ? input.total : "";
    const currency = typeof input.currency === "string" ? input.currency.toUpperCase() : "";
    const status = input.status === "ok" || input.status === "issues" ? input.status : "issues";
    const issueCount = Number.isInteger(input.issue_count) ? Number(input.issue_count) : 0;
    if (!invoiceId || !supplier || !customer || !/^\d+(\.\d{1,4})?$/.test(total) || !/^[A-Z]{3}$/.test(currency) || issueCount < 0 || issueCount > 1000) return json({ error: "Invalid conversion record." }, 400);
    if (kind === "bulk") {
      const [plan] = await sql<any[]>`SELECT p.monthly_bulk_limit AS limit FROM users u JOIN plans p ON p.id=u.plan_id WHERE u.id=${user.id}`;
      const limit = Number(plan?.limit ?? 0);
      const quotaRows = await sql<any[]>`INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used) VALUES (${user.id}, date_trunc('month', current_date)::date, 0, 1) ON CONFLICT (user_id, period_start) DO UPDATE SET bulk_used = usage_quota.bulk_used + 1 WHERE usage_quota.bulk_used < ${limit} RETURNING bulk_used`;
      if (!quotaRows[0]) return json({ error: "Monthly bulk limit reached." }, 429);
      const [row] = await sql<any[]>`INSERT INTO conversions (user_id, invoice_id, supplier, customer, total, currency, status, issue_count) VALUES (${user.id}, ${invoiceId}, ${supplier}, ${customer}, ${total}, ${currency}, ${status}, ${issueCount}) RETURNING id, invoice_id, supplier, customer, total::text, currency, status, issue_count, created_at`;
      await securityEvent(request, "conversion_created", user.id, { conversionId: row.id, kind });
      return json({ conversion: row, quota: { used: Number(quotaRows[0].bulk_used), limit, kind } }, 201);
    }
    const [plan] = await sql<any[]>`SELECT p.monthly_conversion_limit AS limit FROM users u JOIN plans p ON p.id=u.plan_id WHERE u.id=${user.id}`;
    const limit = Number(plan?.limit ?? 0);
    const quotaRows = await sql<any[]>`INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used) VALUES (${user.id}, date_trunc('month', current_date)::date, 1, 0) ON CONFLICT (user_id, period_start) DO UPDATE SET conversions_used = usage_quota.conversions_used + 1 WHERE usage_quota.conversions_used < ${limit} RETURNING conversions_used`;
    if (!quotaRows[0]) return json({ error: "Monthly conversion limit reached." }, 429);
    const [row] = await sql<any[]>`INSERT INTO conversions (user_id, invoice_id, supplier, customer, total, currency, status, issue_count) VALUES (${user.id}, ${invoiceId}, ${supplier}, ${customer}, ${total}, ${currency}, ${status}, ${issueCount}) RETURNING id, invoice_id, supplier, customer, total::text, currency, status, issue_count, created_at`;
    await securityEvent(request, "conversion_created", user.id, { conversionId: row.id, kind });
    return json({ conversion: row, quota: { used: Number(quotaRows[0].conversions_used), limit, kind } }, 201);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("conversion api error", error);
    return json({ error: "Conversion history service unavailable." }, 500);
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await sendWebResponse(await handleConversionRequest(await nodeRequestToWebRequest(request)), response);
}
