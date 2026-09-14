// Auth session helpers (Clerk/Auth0 client wrappers). Owner: Anuj.
// TODO: Wire to actual Clerk/Auth0 SDK once auth module is ready (Neerav's scope)

export function isAuthenticated(): boolean {
  // Placeholder — will be replaced by Clerk's useAuth() or Auth0's session check
  if (typeof window === "undefined") return false;
  return true; // Default to authenticated for development
}

export function getCurrentUserId(): string | null {
  // Placeholder
  return "user-1";
}

export function getCurrentOrgId(): string | null {
  // Placeholder
  return "org-1";
}

export function logout(): void {
  // TODO: wire to Clerk/Auth0 signOut
  window.location.href = "/login";
}
