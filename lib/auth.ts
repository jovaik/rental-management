import { getServerSession as getNextAuthServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UserRole } from "@/types";

/**
 * Wrapper around getServerSession for use in server components
 */
export async function getServerSession() {
  return await getNextAuthServerSession(authOptions);
}

/**
 * Get tenant_id from the current session
 */
export async function getTenantFromSession() {
  const session = await getServerSession();
  return session?.user?.tenant_id || null;
}

/**
 * Require authentication, redirect to login if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  return session;
}

/**
 * Require specific role(s), redirect to unauthorized page if not authorized
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const session = await requireAuth();
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!roles.includes(session.user.role)) {
    redirect("/unauthorized");
  }
  
  return session;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const session = await getServerSession();
  return session?.user?.role === role;
}

/**
 * Check if user is admin or owner
 */
export async function isAdminOrOwner(): Promise<boolean> {
  const session = await getServerSession();
  return session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
}
