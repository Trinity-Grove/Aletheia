'use client';

import React, { type ReactNode } from 'react';
import type { FamilyRole } from '@aletheia/contracts';
import { useAuthRole } from '../../lib/auth/rbac-context';
import {
  hasPermission,
  type PermissionAction,
} from '../../lib/auth/use-permissions';
import { useLocale } from '../../lib/i18n/locale-context';

export function UnauthorizedFallback() {
  const { t } = useLocale();
  return (
    <div data-testid="unauthorized-message" role="alert" className="alert alert-error">
      <strong>{t('auth.roleGuard.unauthorizedTitle')}</strong>: {t('auth.roleGuard.unauthorizedMessage')}
    </div>
  );
}

export interface RequireRoleProps {
  roles: FamilyRole | FamilyRole[];
  children: ReactNode;
  fallback?: ReactNode;
  currentRole?: FamilyRole | null;
}

export function RequireRole({
  roles,
  children,
  fallback = null,
  currentRole,
}: RequireRoleProps) {
  const authContext = useAuthRole();
  const effectiveRole =
    currentRole !== undefined ? currentRole : authContext?.role ?? null;

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const isAuthorized = effectiveRole !== null && allowedRoles.includes(effectiveRole);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export interface CanProps {
  action: PermissionAction | string;
  children: ReactNode;
  fallback?: ReactNode;
  role?: FamilyRole | null;
}

export function Can({ action, children, fallback = null, role }: CanProps) {
  const authContext = useAuthRole();
  const effectiveRole = role !== undefined ? role : authContext?.role ?? null;

  const isAuthorized = hasPermission(effectiveRole, action);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export const RequirePermission = Can;
