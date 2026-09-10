CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  monthly_conversion_limit INTEGER NOT NULL CHECK (monthly_conversion_limit >= 0),
  monthly_bulk_limit INTEGER NOT NULL CHECK (monthly_bulk_limit >= 0),
  api_access BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plans (id, name, monthly_conversion_limit, monthly_bulk_limit, api_access)
VALUES
  ('free', 'Free', 5, 1, FALSE),
  ('paid', 'Paid', 100, 20, FALSE),
  ('business', 'Business', 5000, 500, TRUE),
  ('admin', 'Admin', 1000000, 100000, TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan_id TEXT NOT NULL DEFAULT 'free' REFERENCES plans(id),
  email_verified_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_account_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_tokens_lookup_idx ON auth_tokens(type, user_id, expires_at);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  redirect_uri TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oauth_states_expiry_idx ON oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  provider TEXT,
  provider_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subscription_id)
);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

CREATE TABLE IF NOT EXISTS usage_quota (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  conversions_used INTEGER NOT NULL DEFAULT 0 CHECK (conversions_used >= 0),
  bulk_used INTEGER NOT NULL DEFAULT 0 CHECK (bulk_used >= 0),
  PRIMARY KEY (user_id, period_start)
);

CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  supplier TEXT NOT NULL,
  customer TEXT NOT NULL,
  total NUMERIC(18, 4) NOT NULL,
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'issues')),
  issue_count INTEGER NOT NULL DEFAULT 0 CHECK (issue_count >= 0),
  source_filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conversions_user_created_idx ON conversions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);

CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS security_events_user_created_idx ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_type_created_idx ON security_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0)
);

CREATE INDEX IF NOT EXISTS users_plan_idx ON users(plan_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
