export type UserRole = "user" | "admin";
export type PlanId = "free" | "paid" | "business" | "admin";

export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  planId: PlanId;
  emailVerifiedAt: string | null;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountRecord = {
  id: string;
  userId: string;
  provider: "google" | "microsoft";
  providerAccountId: string;
  email: string | null;
  createdAt: string;
};

export type SessionRecord = { tokenHash: string; userId: string; expiresAt: string; revokedAt: string | null; createdAt: string };
export type AuthTokenRecord = { id: string; userId: string; type: "email_verification" | "password_reset"; tokenHash: string; expiresAt: string; usedAt: string | null; createdAt: string };
export type SubscriptionRecord = { id: string; userId: string; planId: PlanId; provider: string | null; providerSubscriptionId: string | null; status: string; currentPeriodStart: string | null; currentPeriodEnd: string | null };
export type UsageQuotaRecord = { userId: string; periodStart: string; conversionsUsed: number; bulkUsed: number };
export type ConversionRecord = { id: string; userId: string; invoiceId: string; supplier: string; customer: string; total: string; currency: string; status: "ok" | "issues"; issueCount: number; createdAt: string };
export type ApiKeyRecord = { id: string; userId: string; name: string; keyPrefix: string; keyHash: string; lastUsedAt: string | null; expiresAt: string | null; revokedAt: string | null; createdAt: string };
export type SecurityEventRecord = { id: number; userId: string | null; eventType: string; ipAddress: string | null; userAgent: string | null; metadata: Record<string, unknown>; createdAt: string };

export type DatabaseSchema = {
  users: UserRecord;
  accounts: AccountRecord;
  sessions: SessionRecord;
  authTokens: AuthTokenRecord;
  subscriptions: SubscriptionRecord;
  usageQuota: UsageQuotaRecord;
  conversions: ConversionRecord;
  apiKeys: ApiKeyRecord;
  securityEvents: SecurityEventRecord;
};

export const DATABASE_SCHEMA_VERSION = 1;
