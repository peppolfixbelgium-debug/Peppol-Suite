import { create } from "zustand";

type User = { id: string; name: string; email: string };
type StoredAccount = User & { password: string };

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
  try { return JSON.parse(localStorage.getItem(ACCOUNTS) || "[]"); } catch { return []; }
}
function writeAccounts(accounts: StoredAccount[]) { localStorage.setItem(ACCOUNTS, JSON.stringify(accounts)); }

export const useAuth = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION) || "null") as User | null;
      set({ user: session, hydrated: true });
    } catch { set({ user: null, hydrated: true }); }
  },
  signUp: async (name, email, password) => {
    const normalized = email.trim().toLowerCase();
    const accounts = readAccounts();
    if (accounts.some((a) => a.email === normalized)) throw new Error("An account with this email already exists.");
    const user = { id: crypto.randomUUID(), name: name.trim() || normalized, email: normalized };
    accounts.push({ ...user, password });
    writeAccounts(accounts);
    localStorage.setItem(SESSION, JSON.stringify(user));
    set({ user, hydrated: true });
  },
  signIn: async (email, password) => {
    const normalized = email.trim().toLowerCase();
    const account = readAccounts().find((a) => a.email === normalized && a.password === password);
    if (!account) throw new Error("Invalid email or password.");
    const { password: _password, ...user } = account;
    localStorage.setItem(SESSION, JSON.stringify(user));
    set({ user, hydrated: true });
  },
  signOut: () => { localStorage.removeItem(SESSION); set({ user: null, hydrated: true }); },
}));
