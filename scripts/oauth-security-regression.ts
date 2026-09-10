import { strict as assert } from "node:assert";
import { decideOAuthLink } from "../api/_lib/oauth-policy";

// Existing OAuth identity must always resolve to its already-linked account.
assert.equal(decideOAuthLink("u1", "u1", null), "signin_existing");

// A provider identity with no matching local account creates a new account.
assert.equal(decideOAuthLink(null, null, null), "create");

// Matching email alone is never enough to take over a local account.
assert.equal(decideOAuthLink(null, "u1", null), "reject_existing_email");

// An OAuth identity already linked to another account cannot be attached by a link flow.
assert.equal(decideOAuthLink("u2", "u1", "u1"), "reject_already_linked");

// Explicitly authenticated linking is allowed even when the provider email is not the local email.
assert.equal(decideOAuthLink(null, "u2", "u1"), "link");
assert.equal(decideOAuthLink("u1", "u1", "u1"), "link");

console.log("OAuth security policy regression tests passed");
