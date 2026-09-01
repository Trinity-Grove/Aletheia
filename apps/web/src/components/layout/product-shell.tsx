'use client';

import React, { type ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AletheiaIcon,
  AppShell,
  type NavigationItem,
  type NavigationLinkRenderer,
} from '@aletheia/ui';
import type {
  LearnerSummaryDto,
  NotificationItemResponseDto,
  FamilyRole,
  UserSummaryDto,
} from '@aletheia/contracts';
import { useOptionalAuth } from '../../lib/auth/auth-context';
import {
  AuthProvider as AuthRoleProvider,
  getPermissions,
  useAuthRole,
  type PermissionAction,
} from '../../lib/auth/rbac-context';
import { NotificationBell } from './notification-bell';
import { LearnerFocusSwitcher } from './learner-focus-switcher';
import { RoleBadge } from '../auth/role-badge';

export { LearnerFocusSwitcher } from './learner-focus-switcher';
export { NotificationBell } from './notification-bell';

export type NavItem = NavigationItem;

export const MAIN_NAV_ITEMS: NavigationItem[] = [
  { id: 'home', label: 'Início', href: '/', icon: <AletheiaIcon name="home" size={18} /> },
  { id: 'learners', label: 'Educandos', href: '/learners', icon: <AletheiaIcon name="users" size={18} /> },
  { id: 'devotional', label: 'Devocional', href: '/devotional', icon: <AletheiaIcon name="book-open" size={18} /> },
  { id: 'curriculum', label: 'Currículo', href: '/curriculum', icon: <AletheiaIcon name="library" size={18} /> },
  { id: 'schedule', label: 'Agenda & Rotina', href: '/schedule', icon: <AletheiaIcon name="calendar-days" size={18} /> },
  { id: 'records', label: 'Diário de Aprendizagem', href: '/records', icon: <AletheiaIcon name="pen-line" size={18} /> },
  { id: 'portfolio', label: 'Portfólio', href: '/portfolio', icon: <AletheiaIcon name="folder-heart" size={18} /> },
  { id: 'attendance', label: 'Frequência', href: '/attendance', icon: <AletheiaIcon name="clipboard-check" size={18} /> },
  { id: 'reports', label: 'Relatórios', href: '/reports', icon: <AletheiaIcon name="bar-chart-3" size={18} /> },
  { id: 'design-system', label: 'Design System', href: '/design-system', icon: <AletheiaIcon name="palette" size={18} /> },
  { id: 'settings', label: 'Configurações', href: '/settings', icon: <AletheiaIcon name="settings" size={18} /> },
];

const renderNextNavigationLink: NavigationLinkRenderer = (linkProps) => (
  <Link {...(linkProps as React.ComponentProps<typeof Link>)} href={linkProps.href} />
);

const NAV_ITEM_PERMISSIONS: Partial<Record<NavigationItem['id'], PermissionAction>> = {
  reports: 'generate_transcripts',
  settings: 'edit_settings',
};

export interface UserProfileSummary {
  id?: string | undefined;
  name?: string | undefined;
  email?: string | undefined;
  role?: FamilyRole | string | undefined;
}

export interface ProductShellProps {
  children: ReactNode;
  learners?: LearnerSummaryDto[] | undefined;
  activeLearnerId?: string | null | undefined;
  onSelectLearner?: ((learnerId: string | null) => void) | undefined;
  notifications?: NotificationItemResponseDto[] | undefined;
  unreadCount?: number | undefined;
  onMarkNotificationAsRead?: ((id: string) => Promise<void>) | undefined;
  onMarkAllNotificationsAsRead?: (() => Promise<void>) | undefined;
  user?: UserProfileSummary | undefined;
  familyId?: string | null | undefined;
  currentPath?: string | undefined;
}

export function ProductShell({
  children,
  learners,
  activeLearnerId = null,
  onSelectLearner,
  notifications,
  unreadCount = 0,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  user,
  familyId,
  currentPath,
}: ProductShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const authContext = useOptionalAuth();
  const existingRbac = useAuthRole();
  const activePath = currentPath ?? pathname;

  // Only redirect when this shell is actually driven by the real session
  // (no explicit `user` prop and no outer RBAC override) — same escape
  // hatch the loading branch below uses, so storybook/tests that inject a
  // user directly are unaffected. `/` is exempt: it deliberately doubles as
  // a public, no-data landing shell for anonymous visitors (see
  // e2e/foundation.spec.ts) rather than a page that requires a session.
  const shouldRedirectAnonymous =
    authContext?.status === 'unauthenticated' &&
    user === undefined &&
    !existingRbac?.user &&
    activePath !== '/';

  useEffect(() => {
    if (shouldRedirectAnonymous) {
      router.replace(`/login?redirect=${encodeURIComponent(activePath)}`);
    }
  }, [shouldRedirectAnonymous, router, activePath]);

  const topbarActions = (
    <div className="product-shell-topbar-actions">
      {learners !== undefined && onSelectLearner !== undefined && (
        <LearnerFocusSwitcher
          learners={learners}
          activeLearnerId={activeLearnerId}
          onSelectLearner={onSelectLearner}
        />
      )}

      {notifications !== undefined && onMarkNotificationAsRead !== undefined && (
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkNotificationAsRead}
          {...(onMarkAllNotificationsAsRead !== undefined
            ? { onMarkAllAsRead: onMarkAllNotificationsAsRead }
            : {})}
        />
      )}
    </div>
  );

  // If auth is loading and no explicit user prop or outer rbac user is provided, show loading shell with aria-busy
  if (authContext?.status === 'loading' && user === undefined && !existingRbac?.user) {
    return (
      <div className="product-shell-loading" aria-busy="true" data-testid="product-shell-loading">
        <AppShell
          className="product-shell"
          brandTitle="Aletheia"
          brandSubtitle="Trinity Grove"
          brandLogo={<span className="product-shell-brand-logo">ἀ</span>}
          navigationItems={[]}
          renderNavigationLink={renderNextNavigationLink}
          topbarActions={topbarActions}
        >
          {children}
        </AppShell>
      </div>
    );
  }

  // No session: redirect (above, in the effect) instead of ever rendering
  // this page's real content or data for an anonymous visitor.
  if (shouldRedirectAnonymous) {
    return <div className="product-shell-loading" aria-busy="true" data-testid="product-shell-redirecting" />;
  }

  // Derive active role truthfully (no hardcoded fallback)
  const activeRole: FamilyRole | null =
    (user?.role as FamilyRole | undefined) ??
    authContext?.activeRole ??
    existingRbac?.role ??
    null;

  // Derive active family id
  const activeFamilyId: string | null =
    familyId !== undefined
      ? familyId
      : (authContext?.activeFamilyId ?? existingRbac?.familyId ?? null);

  // Derive truthful profile user
  const profileUser: UserProfileSummary | undefined = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role ?? (activeRole !== null ? activeRole : undefined),
      }
    : authContext?.user
      ? {
          id: authContext.user.id,
          name: authContext.user.fullName,
          email: authContext.user.email,
          role: activeRole !== null ? activeRole : undefined,
        }
      : existingRbac?.user
        ? {
            id: existingRbac.user.id,
            name: existingRbac.user.fullName,
            email: existingRbac.user.email,
            role: activeRole !== null ? activeRole : undefined,
          }
        : undefined;

  const permissions = getPermissions(activeRole);
  const navigationItems = MAIN_NAV_ITEMS
    .filter((item) => {
      const requiredPermission = NAV_ITEM_PERMISSIONS[item.id];
      return requiredPermission === undefined || permissions.can(requiredPermission);
    })
    .map<NavigationItem>((item) => ({
      ...item,
      active: activePath === item.href,
    }));

  const authUser: UserSummaryDto | null = profileUser
    ? {
        id: profileUser.id ?? 'user',
        email: profileUser.email ?? '',
        fullName: profileUser.name ?? profileUser.email ?? 'Usuário',
        // This is a structural adapter for the RBAC provider, not a
        // real verification-status carrier — email verification is read
        // from authContext.user directly wherever it actually matters.
        emailVerified: true,
        createdAt: new Date().toISOString(),
      }
    : null;

  const userProfile = profileUser
    ? (collapsed: boolean) => (
        <div className="product-shell-user-profile">
          <div className="product-shell-user-avatar" aria-hidden="true">
            {(profileUser.name ?? profileUser.email ?? 'U').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="product-shell-user-details">
              <div className="product-shell-user-name">{profileUser.name ?? profileUser.email}</div>
              {profileUser.role && (
                <div className="product-shell-user-role">
                  <RoleBadge role={profileUser.role} size="sm" />
                </div>
              )}
            </div>
          )}
        </div>
      )
    : undefined;

  const shellContent = (
    <AppShell
      className="product-shell"
      brandTitle="Aletheia"
      brandSubtitle="Trinity Grove"
      brandLogo={<span className="product-shell-brand-logo">ἀ</span>}
      navigationItems={navigationItems}
      renderNavigationLink={renderNextNavigationLink}
      topbarActions={topbarActions}
      {...(userProfile !== undefined ? { userProfile } : {})}
    >
      {children}
    </AppShell>
  );

  return (
    <AuthRoleProvider role={activeRole} user={authUser} familyId={activeFamilyId}>
      {shellContent}
    </AuthRoleProvider>
  );
}
