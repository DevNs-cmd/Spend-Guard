// New file — packages/shared-types/src/dto/current-org-context.dto.ts in the
// real repo. Additive only; nothing existing in shared-types is changed.
// Needed by every module's controllers once @CurrentOrg() (Neerav's module)
// returns real request context instead of today's placeholder.
export interface CurrentOrgContext {
  organizationId: string;
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
}
