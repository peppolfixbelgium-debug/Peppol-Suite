import { create } from "zustand";

type User = { id: string; name: string; email: string };
type StoredAccount = User & { passwordHash?: string; password?: string };

type AuthState = {
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const ACCOUNTS = "peppol-suite.accounts";
const SESSION = "peppol-suite.session";

function readAccounts(): StoredAccount[] {
  try {
    const value = JSON.parse(localStorage.getItem(ACCOUNTS) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
}

async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function normalizeStoredAccounts(accounts: StoredAccount[]): Promise<StoredAccount[]> {
  let changed = false;
  const normalized = await Promise.all(
    accounts.map(async (account) => {
      if (account.passwordHash) return account;
      if (typeof account.password !== "string") return account;
      changed = true;
      const { password: _password, ...withoutPassword } = account;
      return { ...withoutPassword, passwordHash: await hashPassword(account.password) };
    }),
  );
  if (changed) writeAccounts(normalized);
  return normalized;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION) || "null") as User | null;
      set({ user: session, hydrated: true });
    } catch {
      set({ user: null, hydrated: true });
    }
  },
  signUp: async (name, email, password) => {
    const normalized = email.trim().toLowerCase();
    const accounts = await normalizeStoredAccounts(readAccounts());
    if (accounts.some((a) => a.email === normalized)) throw new Error("An account with this email already exists.");
    const user = { id: crypto.randomUUID(), name: name.trim() || normalized, email: normalized };
    accounts.push({ ...user, passwordHash: await hashPassword(password) });
    writeAccounts(accounts);
    localStorage.setItem(SESSION, JSON.stringify(user));
    set({ user, hydrated: true });
  },
  signIn: async (email, password) => {
    const normalized = email.trim().toLowerCase();
    const accounts = await normalizeStoredAccounts(readAccounts());
    const passwordHash = await hashPassword(password);
    const account = accounts.find((a) => a.email === normalized && a.passwordHash === passwordHash);
    if (!account) throw new Error("Invalid email or password.");
    const { password: _password, passwordHash: _passwordHash, ...user } = account;
    localStorage.setItem(SESSION, JSON.stringify(user));
    set({ user, hydrated: true });
  },
  signOut: () => {
    localStorage.removeItem(SESSION);
    set({ user: null, hydrated: true });
  },
}));
