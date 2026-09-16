// Auth session helpers. Owner: Anuj.
// Cookie-based session for development. Will be replaced by Clerk/Auth0 once Neerav's auth module is ready.

const SESSION_COOKIE = "sg_session";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return document.cookie.includes(`${SESSION_COOKIE}=`);
}

export function setSession(userId: string, orgId: string): void {
  // Set a session cookie (no httpOnly since this is client-side for dev)
  // In production, Clerk/Auth0 handles this server-side
  const value = JSON.stringify({ userId, orgId });
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearSession(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export function getSession(): { userId: string; orgId: string } | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string | null {
  return getSession()?.userId || null;
}

export function getCurrentOrgId(): string | null {
  return getSession()?.orgId || null;
}

export function logout(): void {
  clearSession();
  window.location.href = "/login";
}
