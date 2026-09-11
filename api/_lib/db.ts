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

export async function createUserWithFreePlan(
  sql: any,
  input: { email: string; name?: string | null; passwordHash?: string | null; emailVerifiedAt?: string | null },
): Promise<{ id: string; email: string; name: string | null; role: string; plan_id: string; email_verified_at: string | null; disabled_at: string | null }> {
  const planId = await getDefaultFreePlanId(sql);
  const rows = await sql<any[]>`
    INSERT INTO users (email, name, password_hash, plan_id, email_verified_at)
    VALUES (${input.email}, ${input.name ?? null}, ${input.passwordHash ?? null}, ${planId}, ${input.emailVerifiedAt ?? null})
    RETURNING id, email, name, role, plan_id, email_verified_at, disabled_at
  `;
  if (!rows[0]) throw new Error("User creation failed.");
  return rows[0];
}
