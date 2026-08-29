'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  BookOpen,
  Library,
  CalendarDays,
  PenLine,
  FolderHeart,
  ClipboardCheck,
  BarChart3,
  Palette,
  Settings,
} from 'lucide-react';
import {
  AppShell,
  type NavigationItem,
  type NavigationLinkRenderer,
} from '@aletheia/ui';
import type { LearnerSummaryDto, NotificationItemResponseDto, FamilyRole } from '@aletheia/contracts';
import {
  AuthProvider,
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
  { id: 'home', label: 'Início', href: '/', icon: <Home size={18} /> },
  { id: 'learners', label: 'Educandos', href: '/learners', icon: <Users size={18} /> },
  { id: 'devotional', label: 'Devocional', href: '/devotional', icon: <BookOpen size={18} /> },
  { id: 'curriculum', label: 'Currículo', href: '/curriculum', icon: <Library size={18} /> },
  { id: 'schedule', label: 'Agenda & Rotina', href: '/schedule', icon: <CalendarDays size={18} /> },
  { id: 'records', label: 'Diário de Aprendizagem', href: '/records', icon: <PenLine size={18} /> },
  { id: 'portfolio', label: 'Portfólio', href: '/portfolio', icon: <FolderHeart size={18} /> },
  { id: 'attendance', label: 'Frequência', href: '/attendance', icon: <ClipboardCheck size={18} /> },
  { id: 'reports', label: 'Relatórios', href: '/reports', icon: <BarChart3 size={18} /> },
  { id: 'design-system', label: 'Design System', href: '/design-system', icon: <Palette size={18} /> },
  { id: 'settings', label: 'Configurações', href: '/settings', icon: <Settings size={18} /> },
];

const renderNextNavigationLink: NavigationLinkRenderer = (linkProps) => (
  <Link {...(linkProps as React.ComponentProps<typeof Link>)} href={linkProps.href} />
);

const NAV_ITEM_PERMISSIONS: Partial<Record<NavigationItem['id'], PermissionAction>> = {
  reports: 'generate_transcripts',
  settings: 'edit_settings',
};

export interface UserProfileSummary {
  id?: string;
  name?: string;
  email?: string;
  role?: FamilyRole | string;
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
  const existingAuth = useAuthRole();
  const activePath = currentPath ?? pathname;
  const contextUser = existingAuth?.user
    ? {
        id: existingAuth.user.id,
        name: existingAuth.user.fullName,
        email: existingAuth.user.email,
        ...(existingAuth.role !== null ? { role: existingAuth.role } : {}),
      }
    : undefined;
  const activeUser = user ?? contextUser ?? {
    id: 'user-1',
    name: 'Família Santos',
    email: 'familia@trinitygrove.org',
    role: existingAuth?.role ?? 'OWNER_GUARDIAN',
  };
  const profileUser = user ?? contextUser;
  const activeRole = (user?.role as FamilyRole | undefined) ?? existingAuth?.role ?? 'OWNER_GUARDIAN';
  const activeFamilyId = familyId !== undefined ? familyId : existingAuth?.familyId ?? null;
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
  const authUser = user === undefined && existingAuth?.user
    ? existingAuth.user
    : {
        id: activeUser.id ?? 'user-1',
        email: activeUser.email ?? 'familia@trinitygrove.org',
        fullName: activeUser.name ?? 'Família Santos',
        createdAt: new Date().toISOString(),
      };

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

  if (existingAuth && user === undefined && familyId === undefined) return shellContent;

  return (
    <AuthProvider role={activeRole} user={authUser} familyId={activeFamilyId}>
      {shellContent}
    </AuthProvider>
  );
}
