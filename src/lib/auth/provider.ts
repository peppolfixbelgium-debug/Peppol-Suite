export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: string;
};

export type SignUpInput = {
  email: string;
  password: string;
  name?: string;
};

export interface AuthProvider {
  signUp(input: SignUpInput): Promise<AuthSession>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
}

export type AuthProviderConfig = {
  provider: "local" | "database";
};

export const AUTH_PROVIDER: AuthProviderConfig = {
  provider: "local",
};
