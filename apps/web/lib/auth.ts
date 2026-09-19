// Auth session helpers. Owner: Anuj.
// Multi-tenant and role-based session management.

export type UserRole = "owner" | "admin" | "member" | "viewer";

export interface UserSession {
  userId: string;
  orgId: string;
  orgName: string;
  userName: string;
  userEmail: string;
  role: UserRole;
}

const SESSION_COOKIE = "sg_session";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return document.cookie.includes(`${SESSION_COOKIE}=`);
}

export function setSession(
  userId: string,
  orgId: string,
  orgName = "Acme Inc.",
  userEmail = "anuj@company.com",
  userName = "Anuj Shukla",
  role: UserRole = "owner"
): void {
  const session: UserSession = {
    userId,
    orgId,
    orgName,
    userEmail,
    userName,
    role,
  };
  const value = JSON.stringify(session);
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearSession(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return {
      userId: parsed.userId || "user-1",
      orgId: parsed.orgId || "org-demo",
      orgName: parsed.orgName || "Acme Inc.",
      userName: parsed.userName || "Anuj Shukla",
      userEmail: parsed.userEmail || "anuj@company.com",
      role: parsed.role || "owner",
    };
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string | null {
  return getSession()?.userId || null;
}

export function getCurrentOrgId(): string {
  return getSession()?.orgId || "org-demo";
}

export function getCurrentOrgName(): string {
  return getSession()?.orgName || "Acme Inc.";
}

export function getCurrentUserEmail(): string {
  return getSession()?.userEmail || "anuj@company.com";
}

export function getCurrentUserRole(): UserRole {
  return getSession()?.role || "owner";
}

export function isViewer(): boolean {
  return getCurrentUserRole() === "viewer";
}

export function canManage(): boolean {
  const role = getCurrentUserRole();
  return role === "owner" || role === "admin";
}

export function logout(): void {
  clearSession();
  window.location.href = "/login";
}
