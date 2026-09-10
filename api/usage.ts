import { Readable } from "node:stream";
import { getDb } from "./_lib/db.js";
import { getSessionUser, requireSameOrigin } from "./_lib/auth.js";

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8"}});

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

function headerEntries(headers: VercelRequest["headers"]): [string, string][] {
  return Object.entries(headers).flatMap(([name, value]) => value == null ? [] : [[name, Array.isArray(value) ? value.join(", ") : value]]);
}

export async function nodeRequestToWebRequest(request: VercelRequest): Promise<Request> {
  const protocol = typeof request.headers["x-forwarded-proto"] === "string" ? request.headers["x-forwarded-proto"] : "https";
  const host = typeof request.headers.host === "string" ? request.headers.host : "localhost";
  const url = new URL(request.url ?? "/", `${protocol}://${host}`).toString();
  const method = (request.method ?? "GET").toUpperCase();
  const headers = new Headers(headerEntries(request.headers));
  if (method === "GET" || method === "HEAD") return new Request(url, { method, headers });
  let body: BodyInit | undefined;
  if (typeof request.body === "string") body = request.body;
  else if (request.body !== undefined) body = JSON.stringify(request.body);
  else {
    const stream = request as VercelRequest & { readable?: boolean };
    if (stream.readable) body = Readable.toWeb(stream as unknown as import("node:stream").Readable) as unknown as BodyInit;
  }
  return new Request(url, { method, headers, body, duplex: "half" } as RequestInit & { duplex: "half" });
}

async function sendWebResponse(response: Response, res: VercelResponse): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.end(await response.text());
}

export async function handleUsageRequest(request: Request): Promise<Response> {
  const user=await getSessionUser(request);if(!user)return json({error:"Authentication required."},401);const sql=getDb();if(request.method==="GET"){const [row]=await sql<any[]>`SELECT p.monthly_conversion_limit,p.monthly_bulk_limit,COALESCE(q.conversions_used,0) AS conversions_used,COALESCE(q.bulk_used,0) AS bulk_used FROM users u JOIN plans p ON p.id=u.plan_id LEFT JOIN usage_quota q ON q.user_id=u.id AND q.period_start=date_trunc('month',current_date)::date WHERE u.id=${user.id}`;return json({conversions:{used:Number(row?.conversions_used??0),limit:Number(row?.monthly_conversion_limit??0)},bulk:{used:Number(row?.bulk_used??0),limit:Number(row?.monthly_bulk_limit??0)}});}if(request.method!=="POST")return json({error:"Method not allowed."},405);requireSameOrigin(request);const input=await request.json().catch(()=>null) as {kind?:unknown}|null;if(input?.kind!=="bulk"&&input?.kind!=="conversion")return json({error:"Invalid usage kind."},400);if(input.kind==="bulk"){const [plan]=await sql<any[]>`SELECT p.monthly_bulk_limit AS limit FROM users u JOIN plans p ON p.id=u.plan_id WHERE u.id=${user.id}`;const limit=Number(plan?.limit??0);const rows=await sql<any[]>`INSERT INTO usage_quota (user_id,period_start,conversions_used,bulk_used) VALUES (${user.id},date_trunc('month',current_date)::date,0,1) ON CONFLICT (user_id,period_start) DO UPDATE SET bulk_used=usage_quota.bulk_used+1 WHERE usage_quota.bulk_used<${limit} RETURNING bulk_used`;if(!rows[0])return json({error:"Monthly bulk limit reached."},429);return json({kind:"bulk",used:Number(rows[0].bulk_used),limit});}const [plan]=await sql<any[]>`SELECT p.monthly_conversion_limit AS limit FROM users u JOIN plans p ON p.id=u.plan_id WHERE u.id=${user.id}`;const limit=Number(plan?.limit??0);const rows=await sql<any[]>`INSERT INTO usage_quota (user_id,period_start,conversions_used,bulk_used) VALUES (${user.id},date_trunc('month',current_date)::date,1,0) ON CONFLICT (user_id,period_start) DO UPDATE SET conversions_used=usage_quota.conversions_used+1 WHERE usage_quota.conversions_used<${limit} RETURNING conversions_used`;if(!rows[0])return json({error:"Monthly conversion limit reached."},429);return json({kind:"conversion",used:Number(rows[0].conversions_used),limit});}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await sendWebResponse(await handleUsageRequest(await nodeRequestToWebRequest(request)), response);
}
