'use client';

import React, { type ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AletheiaIcon,
  AppShell,
  Breadcrumbs,
  BrandMark,
  EmptyState,
  IconButton,
  type BreadcrumbItem,
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
import { useLocale } from '../../lib/i18n/locale-context';
import {
  AuthProvider as AuthRoleProvider,
  getPermissions,
  useAuthRole,
  type PermissionAction,
} from '../../lib/auth/rbac-context';
import { NotificationBell } from './notification-bell';
import { useNotifications } from './use-notifications';
import { LearnerFocusSwitcher } from './learner-focus-switcher';
import { RoleBadge } from '../auth/role-badge';

export { LearnerFocusSwitcher } from './learner-focus-switcher';
export { NotificationBell } from './notification-bell';

export type NavItem = NavigationItem;

// `label` holds an i18n dictionary key, not display text -- translated at
// render time inside ProductShell (module-level constants can't call the
// useLocale() hook).
export const MAIN_NAV_ITEMS: NavigationItem[] = [
  { id: 'admin-catalog', label: 'nav.adminCatalog', href: '/admin/catalog', icon: <AletheiaIcon name="library" size={18} /> },
  { id: 'home', label: 'nav.home', href: '/', icon: <AletheiaIcon name="home" size={18} /> },
  { id: 'learners', label: 'nav.learners', href: '/learners', icon: <AletheiaIcon name="users" size={18} /> },
  { id: 'devotional', label: 'nav.devotional', href: '/devotional', icon: <AletheiaIcon name="book-open" size={18} /> },
  { id: 'curriculum', label: 'nav.curriculum', href: '/curriculum', icon: <AletheiaIcon name="library" size={18} /> },
  { id: 'schedule', label: 'nav.schedule', href: '/schedule', icon: <AletheiaIcon name="calendar-days" size={18} /> },
  { id: 'records', label: 'nav.records', href: '/records', icon: <AletheiaIcon name="pen-line" size={18} /> },
  { id: 'portfolio', label: 'nav.portfolio', href: '/portfolio', icon: <AletheiaIcon name="folder-heart" size={18} /> },
  { id: 'attendance', label: 'nav.attendance', href: '/attendance', icon: <AletheiaIcon name="clipboard-check" size={18} /> },
  { id: 'reports', label: 'nav.reports', href: '/reports', icon: <AletheiaIcon name="bar-chart-3" size={18} /> },
  { id: 'support', label: 'nav.support', href: '/support', icon: <AletheiaIcon name="heart" size={18} /> },
  { id: 'settings', label: 'nav.settings', href: '/settings', icon: <AletheiaIcon name="settings" size={18} /> },
];

const PRIMARY_NAV_ITEM_IDS: ReadonlyArray<NavigationItem['id']> = [
  'home',
  'devotional',
  'schedule',
  'learners',
];

const renderNextNavigationLink: NavigationLinkRenderer = (linkProps) => (
  <Link {...(linkProps as React.ComponentProps<typeof Link>)} href={linkProps.href} />
);

const NAV_ITEM_PERMISSIONS: Partial<Record<NavigationItem['id'], PermissionAction>> = {
  reports: 'generate_transcripts',
  settings: 'edit_settings',
};

// Same permission map as NAV_ITEM_PERMISSIONS, keyed by href instead of nav
// id — lets a directly-visited URL (not just the nav link) be gated, since
// hiding a nav item alone doesn't stop someone from typing the path in.
const PATH_PERMISSIONS: Partial<Record<string, PermissionAction>> = Object.fromEntries(
  MAIN_NAV_ITEMS
    .filter((item) => NAV_ITEM_PERMISSIONS[item.id] !== undefined)
    .map((item) => [item.href, NAV_ITEM_PERMISSIONS[item.id] as PermissionAction]),
);

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
  const { t } = useLocale();
  const activePath = currentPath ?? pathname;

  // Derive active family id up front (moved ahead of the early returns
  // below) so it's available to the notifications fallback hook, which
  // like every other hook here must run unconditionally on every render.
  const activeFamilyId: string | null =
    familyId !== undefined
      ? familyId
      : (authContext?.activeFamilyId ?? existingRbac?.familyId ?? null);

  // Self-fetches only when the caller hasn't already supplied notification
  // props — most pages never wire these up themselves, which used to mean
  // the bell only ever appeared on the Settings page.
  const notificationsFallback = useNotifications(
    notifications === undefined ? activeFamilyId : null,
  );

  // Only redirect when this shell is actually driven by the real session
  // (no explicit `user` prop and no outer RBAC override) — same escape
  // hatch the loading branch below uses, so storybook/tests that inject a
  // user directly are unaffected. Every route, including `/`, requires a
  // session — there is no public, unauthenticated landing shell.
  const shouldRedirectAnonymous =
    authContext?.status === 'unauthenticated' &&
    user === undefined &&
    !existingRbac?.user;

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

      {(notifications !== undefined || activeFamilyId !== null) && (
        <NotificationBell
          notifications={notifications ?? notificationsFallback.notifications}
          unreadCount={notifications !== undefined ? unreadCount : notificationsFallback.unreadCount}
          onMarkAsRead={onMarkNotificationAsRead ?? notificationsFallback.markAsRead}
          onMarkAllAsRead={onMarkAllNotificationsAsRead ?? notificationsFallback.markAllAsRead}
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
          brandLogo={<BrandMark size={28} />}
          navigationItems={[]}
          primaryNavigationItems={[]}
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
  const isPlatformAdmin = authContext?.status === 'authenticated' && authContext.user?.isPlatformAdmin === true;

  // A hidden nav item only stops navigation via the menu — it doesn't stop
  // someone from typing the URL directly. Gate the page content itself too,
  // with an accessible state that says nothing about what the page holds.
  const requiredPermission = PATH_PERMISSIONS[activePath];
  const accessDenied =
    (activePath === '/admin/catalog' && !isPlatformAdmin) ||
    (requiredPermission !== undefined &&
      profileUser !== undefined &&
      !permissions.can(requiredPermission));

  const navigationItems = MAIN_NAV_ITEMS
    .filter((item) => {
      if (item.id === 'admin-catalog') return isPlatformAdmin;
      const requiredPermission = NAV_ITEM_PERMISSIONS[item.id];
      return requiredPermission === undefined || permissions.can(requiredPermission);
    })
    .map<NavigationItem>((item) => ({
      ...item,
      label: t(item.label),
      active: activePath === item.href,
    }));

  const primaryNavigationItems = PRIMARY_NAV_ITEM_IDS
    .map((id) => navigationItems.find((item) => item.id === id))
    .filter((item): item is NavigationItem => item !== undefined);

  const activeNavItem = MAIN_NAV_ITEMS.find((item) => item.href === activePath);
  const breadcrumbItems: BreadcrumbItem[] =
    activeNavItem && activeNavItem.id !== 'home'
      ? [
          { id: 'home', label: t('common.home'), href: '/' },
          { id: activeNavItem.id, label: t(activeNavItem.label) },
        ]
      : [];

  const authUser: UserSummaryDto | null = profileUser
    ? {
        id: profileUser.id ?? 'user',
        email: profileUser.email ?? '',
        fullName: profileUser.name ?? profileUser.email ?? 'Usuário',
        // This is a structural adapter for the RBAC provider, not a
        // real verification-status carrier — email verification is read
        // from authContext.user directly wherever it actually matters.
        emailVerified: true,
        mfaEnabled: true,
        isPlatformAdmin,
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
          {authContext?.logout && (
            <IconButton
              aria-label={t('common.logout')}
              size="sm"
              className="product-shell-logout-button"
              onClick={() => authContext.logout()}
              icon={<AletheiaIcon name="log-out" size={16} />}
            />
          )}
        </div>
      )
    : undefined;

  const shellContent = (
    <AppShell
      className="product-shell"
      brandTitle="Aletheia"
      brandSubtitle="Trinity Grove"
      brandLogo={<BrandMark size={28} />}
      navigationItems={navigationItems}
      primaryNavigationItems={primaryNavigationItems}
      renderNavigationLink={renderNextNavigationLink}
      topbarActions={topbarActions}
      {...(userProfile !== undefined ? { userProfile } : {})}
    >
      {breadcrumbItems.length > 0 && (
        <Breadcrumbs items={breadcrumbItems} renderLink={renderNextNavigationLink} />
      )}
      {accessDenied ? (
        <div data-testid="access-denied-state">
          <EmptyState
            title={t('common.accessDeniedTitle')}
            description={t('common.accessDeniedDescription')}
          />
        </div>
      ) : (
        children
      )}
    </AppShell>
  );

  return (
    <AuthRoleProvider role={activeRole} user={authUser} familyId={activeFamilyId}>
      {shellContent}
    </AuthRoleProvider>
  );
}
