import { create } from "zustand";

type User = { id: string; name: string | null; email: string; role: "user" | "admin"; planId: string; emailVerified: boolean };

type AuthState = {
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

async function request(path: string, init?: RequestInit): Promise<{ user?: User | null }> {
  const response = await fetch(`/api/auth/${path}`, { credentials: "include", ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Authentication failed.");
  return data;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const data = await request("session", { headers: {} });
      set({ user: data.user ?? null, hydrated: true });
    } catch {
      set({ user: null, hydrated: true });
    }
  },
  signUp: async (name, email, password) => {
    const data = await request("signup", { method: "POST", body: JSON.stringify({ name, email, password }) });
    set({ user: data.user ?? null, hydrated: true });
  },
  signIn: async (email, password) => {
    const data = await request("signin", { method: "POST", body: JSON.stringify({ email, password }) });
    set({ user: data.user ?? null, hydrated: true });
  },
  signOut: async () => {
    await request("signout", { method: "POST", body: "{}" });
    set({ user: null, hydrated: true });
  },
}));
