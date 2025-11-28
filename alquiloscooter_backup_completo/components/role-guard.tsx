
'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { hasAnyRole, UserRole } from '@/lib/types';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession() || {};
  
  if (!session?.user?.role) {
    return <>{fallback}</>;
  }

  const userRole = session.user.role as UserRole;
  
  if (!hasAnyRole(userRole, allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface PermissionGuardProps {
  children: ReactNode;
  permission: keyof typeof import('@/lib/types').ROLE_PERMISSIONS.super_admin;
  fallback?: ReactNode;
}

export function PermissionGuard({ children, permission, fallback = null }: PermissionGuardProps) {
  const { data: session } = useSession() || {};
  
  if (!session?.user?.role) {
    return <>{fallback}</>;
  }

  const { hasPermission } = require('@/lib/types');
  const userRole = session.user.role as UserRole;
  
  if (!hasPermission(userRole, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
