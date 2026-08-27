'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import type { FamilyRole, UserSummaryDto } from '@aletheia/contracts';
import {
  getPermissions,
  hasPermission,
  type PermissionAction,
  type RbacPermissions,
} from './use-permissions';

export interface AuthRoleContextValue {
  role: FamilyRole | null;
  setRole: (role: FamilyRole | null) => void;
  user: UserSummaryDto | null;
  familyId: string | null;
  isOwnerGuardian: boolean;
  isGuardian: boolean;
  isCoGuardian: boolean;
  isEducator: boolean;
  isAuthenticated: boolean;
}

export const AuthRoleContext = createContext<AuthRoleContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  role?: FamilyRole | null;
  initialRole?: FamilyRole | null;
  user?: UserSummaryDto | null;
  familyId?: string | null;
}

export function AuthProvider({
  children,
  role: controlledRole,
  initialRole = null,
  user = null,
  familyId = null,
}: AuthProviderProps) {
  const [internalRole, setInternalRole] = useState<FamilyRole | null>(
    controlledRole !== undefined ? controlledRole : initialRole,
  );

  const activeRole = controlledRole !== undefined ? controlledRole : internalRole;

  const contextValue = useMemo<AuthRoleContextValue>(() => {
    return {
      role: activeRole,
      setRole: setInternalRole,
      user,
      familyId,
      isOwnerGuardian: activeRole === 'OWNER_GUARDIAN',
      isGuardian:
        activeRole === 'GUARDIAN' ||
        activeRole === 'OWNER_GUARDIAN' ||
        activeRole === 'CO_GUARDIAN',
      isCoGuardian: activeRole === 'CO_GUARDIAN',
      isEducator: activeRole === 'EDUCATOR',
      isAuthenticated: activeRole !== null || user !== null,
    };
  }, [activeRole, user, familyId]);

  return (
    <AuthRoleContext.Provider value={contextValue}>
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole(): AuthRoleContextValue | null {
  return useContext(AuthRoleContext);
}

export { getPermissions, hasPermission, type PermissionAction, type RbacPermissions };
export { usePermissions } from './use-permissions';
