import { neon } from "@neondatabase/serverless";

export function getDb(): any {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export async function getDefaultFreePlanId(sql: any): Promise<string> {
  const rows = await sql<{ id: string }[]>`SELECT id FROM plans WHERE name = 'Free' LIMIT 1`;
  if (!rows[0]?.id) throw new Error("Free plan is not configured.");
  return rows[0].id;
}
