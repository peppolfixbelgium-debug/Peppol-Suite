export type OAuthLinkDecision = "signin_existing" | "link" | "create" | "reject_existing_email" | "reject_already_linked";

export function decideOAuthLink(
  existingIdentityUserId: string | null,
  sameEmailUserId: string | null,
  authenticatedUserId: string | null,
): OAuthLinkDecision {
  if (authenticatedUserId) {
    if (existingIdentityUserId && existingIdentityUserId !== authenticatedUserId) return "reject_already_linked";
    return "link";
  }
  if (existingIdentityUserId) return "signin_existing";
  if (sameEmailUserId) return "reject_existing_email";
  return "create";
}
