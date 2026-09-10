import { getDb } from "./_lib/db";
import { getSessionUser, requireSameOrigin } from "./_lib/auth";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

export default async function handler(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return json({ error: "Authentication required." }, 401);
  const sql = getDb();
  if (request.method === "GET") {
    const [row] = await sql<any[]>`SELECT p.monthly_conversion_limit, p.monthly_bulk_limit, COALESCE(q.conversions_used,0) AS conversions_used, COALESCE(q.bulk_used,0) AS bulk_used FROM users u JOIN plans p ON p.id = u.plan_id LEFT JOIN usage_quota q ON q.user_id=u.id AND q.period_start=date_trunc('month',current_date)::date WHERE u.id=${user.id}`;
    return json({ conversions: { used: Number(row?.conversions_used ?? 0), limit: Number(row?.monthly_conversion_limit ?? 0) }, bulk: { used: Number(row?.bulk_used ?? 0), limit: Number(row?.monthly_bulk_limit ?? 0) } });
  }
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  requireSameOrigin(request);
  const input = await request.json().catch(() => null) as { kind?: unknown } | null;
  const kind = input?.kind === "bulk" ? "bulk" : input?.kind === "conversion" ? "conversion" : null;
  if (!kind) return json({ error: "Invalid usage kind." }, 400);
  const column = kind === "bulk" ? "bulk_used" : "conversions_used";
  const limitColumn = kind === "bulk" ? "monthly_bulk_limit" : "monthly_conversion_limit";
  const [plan] = await sql<any[]>`SELECT p.${sql(limitColumn)} AS limit FROM users u JOIN plans p ON p.id=u.plan_id WHERE u.id=${user.id}`;
  const limit = Number(plan?.limit ?? 0);
  const rows = kind === "bulk"
    ? await sql<any[]>`INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used) VALUES (${user.id}, date_trunc('month',current_date)::date, 0, 1) ON CONFLICT (user_id,period_start) DO UPDATE SET bulk_used=usage_quota.bulk_used+1 WHERE usage_quota.bulk_used < ${limit} RETURNING bulk_used`
    : await sql<any[]>`INSERT INTO usage_quota (user_id, period_start, conversions_used, bulk_used) VALUES (${user.id}, date_trunc('month',current_date)::date, 1, 0) ON CONFLICT (user_id,period_start) DO UPDATE SET conversions_used=usage_quota.conversions_used+1 WHERE usage_quota.conversions_used < ${limit} RETURNING conversions_used`;
  if (!rows[0]) return json({ error: `Monthly ${kind} limit reached.` }, 429);
  return json({ kind, used: Number(rows[0][column]), limit });
}
