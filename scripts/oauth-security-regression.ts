import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { decideOAuthLink } from "../api/_lib/oauth-policy";

// Policy cases: existing OAuth identity, new OAuth user, same-email collision, takeover attempt, explicit linking.
assert.equal(decideOAuthLink("u1", "u1", null), "signin_existing");
assert.equal(decideOAuthLink(null, null, null), "create");
assert.equal(decideOAuthLink(null, "u1", null), "reject_existing_email");
assert.equal(decideOAuthLink("u2", "u1", "u1"), "reject_already_linked");
assert.equal(decideOAuthLink(null, "u2", "u1"), "link");
assert.equal(decideOAuthLink("u1", "u1", "u1"), "link");

// Implementation-level regression guards for state replay/expiry, provider identity, CSRF-bound linking and unlink safety.
const auth = readFileSync("api/auth/[...path].ts", "utf8");
const migration = readFileSync("migrations/001_auth_database.sql", "utf8");
assert.match(auth, /DELETE FROM oauth_states WHERE state_hash = \$\{stateHash\} AND provider = \$\{provider\} AND expires_at > now\(\)/);
assert.match(auth, /url\.searchParams\.set\("nonce", state\)/);
assert.match(auth, /providerAccountId\(provider, claims\)/);
assert.match(auth, /claims\.email_verified !== true/);
assert.match(auth, /states\[0\]\.user_id/);
assert.match(auth, /path === "oauth\/google\/link\/start" && request\.method === "POST"/);
assert.match(auth, /path === "oauth\/microsoft\/link\/start" && request\.method === "POST"/);
assert.match(auth, /Add a password or another OAuth provider before unlinking this provider/);
assert.match(auth, /if \(byEmail\[0\]\) return redirect\("\/login\?error=account_exists"/);
assert.match(migration, /user_id UUID REFERENCES users\(id\) ON DELETE CASCADE/);

console.log("OAuth security regression tests passed");
