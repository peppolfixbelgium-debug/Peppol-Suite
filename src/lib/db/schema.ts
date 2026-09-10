export type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversionRecord = {
  id: string;
  userId: string;
  invoiceId: string;
  supplier: string;
  customer: string;
  total: string;
  currency: string;
  status: "ok" | "issues";
  issueCount: number;
  createdAt: string;
};

export type DatabaseSchema = {
  users: UserRecord;
  conversions: ConversionRecord;
};

export const DATABASE_SCHEMA_VERSION = 1;
