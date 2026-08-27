'use client';

import React, { type ReactNode, useState } from 'react';
import type { LearnerSummaryDto, NotificationItemResponseDto, FamilyRole } from '@aletheia/contracts';
import { NotificationBell } from './notification-bell';
import { LearnerFocusSwitcher } from './learner-focus-switcher';
import { RoleBadge } from '../auth/role-badge';

export { LearnerFocusSwitcher } from './learner-focus-switcher';
export { NotificationBell } from './notification-bell';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: 'Início', href: '/', icon: '🏠' },
  { label: 'Educandos', href: '/learners', icon: '👶' },
  { label: 'Devocional', href: '/devotional', icon: '📖' },
  { label: 'Currículo', href: '/curriculum', icon: '📚' },
  { label: 'Agenda & Rotina', href: '/schedule', icon: '📅' },
  { label: 'Diário de Aprendizagem', href: '/records', icon: '✍️' },
  { label: 'Portfólio', href: '/portfolio', icon: '🎨' },
  { label: 'Frequência', href: '/attendance', icon: '📋' },
  { label: 'Relatórios', href: '/reports', icon: '📊' },
  { label: 'Configurações', href: '/settings', icon: '⚙️' },
];

export interface UserProfileSummary {
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
  currentPath,
}: ProductShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className="product-shell-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas, #F1F5F9)',
      }}
    >
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          data-testid="sidebar-backdrop"
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className="glass-sidebar"
        style={{
          width: isCollapsed ? 'var(--sidebar-collapsed-width, 4.5rem)' : 'var(--sidebar-width, 17rem)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isSidebarOpen ? 'translateX(0)' : undefined,
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid var(--border-light, #E2E8F0)',
        }}
      >
        {/* Brand / Logo */}
        <div
          style={{
            height: 'var(--header-height, 4.25rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0 0.5rem' : '0 1.25rem',
            borderBottom: '1px solid var(--border-light, #E2E8F0)',
          }}
        >
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--color-indigo-700, #4338CA)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  boxShadow: '0 2px 4px 0 rgba(67, 56, 202, 0.25)',
                }}
              >
                Α
              </div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.025em',
                  color: 'var(--color-slate-900, #0F172A)',
                }}
              >
                Aletheia
              </span>
            </div>
          )}

          <button
            type="button"
            data-testid="sidebar-collapse-toggle"
            aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            onClick={() => setIsCollapsed((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-slate-500, #64748B)',
              cursor: 'pointer',
              padding: '0.375rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Navigation links */}
        <nav
          data-testid="sidebar-nav"
          className="main-navigation"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = currentPath ? currentPath === item.href : false;
            return (
              <a
                key={item.href}
                href={item.href}
                data-testid={`nav-item-${item.href.replace('/', '') || 'home'}`}
                data-active={isActive ? 'true' : 'false'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.875rem',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--color-indigo-700, #4338CA)' : 'var(--color-slate-700, #334155)',
                  backgroundColor: isActive ? 'var(--color-indigo-50, #EEF2FF)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Footer profile summary */}
        {user && (
          <div
            data-testid="user-profile-summary"
            style={{
              padding: '1rem',
              borderTop: '1px solid var(--border-light, #E2E8F0)',
              backgroundColor: 'var(--color-slate-50, #F8FAFC)',
              display: 'flex',
              flexDirection: isCollapsed ? 'column' : 'row',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              data-testid="user-avatar"
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-slate-200, #E2E8F0)',
                color: 'var(--color-slate-700, #334155)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                flexShrink: 0,
              }}
            >
              {(user.name || user.email || 'U').charAt(0).toUpperCase()}
            </div>

            {!isCollapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: 'var(--color-slate-900, #0F172A)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name || user.email}
                </div>
                {user.role && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <RoleBadge role={user.role} size="sm" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          marginLeft: isCollapsed ? 'var(--sidebar-collapsed-width, 4.5rem)' : 'var(--sidebar-width, 17rem)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Floating Top Header */}
        <header
          role="banner"
          className="glass-header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            height: 'var(--header-height, 4.25rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              data-testid="mobile-sidebar-toggle"
              aria-label="Abrir menu lateral"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              style={{
                display: 'none',
                background: 'none',
                border: '1px solid var(--border-light, #E2E8F0)',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              ☰
            </button>

            <strong
              data-testid="brand-title"
              style={{
                fontSize: '1.25rem',
                color: 'var(--color-slate-900, #0F172A)',
                letterSpacing: '-0.025em',
              }}
            >
              Aletheia
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {learners && onSelectLearner && (
              <LearnerFocusSwitcher
                learners={learners}
                activeLearnerId={activeLearnerId}
                onSelectLearner={onSelectLearner}
              />
            )}

            {notifications !== undefined && onMarkNotificationAsRead && (
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={onMarkNotificationAsRead}
                {...(onMarkAllNotificationsAsRead !== undefined ? { onMarkAllAsRead: onMarkAllNotificationsAsRead } : {})}
              />
            )}

            {user && (
              <div
                data-testid="header-user-badge"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingLeft: '0.5rem',
                  borderLeft: '1px solid var(--border-light, #E2E8F0)',
                }}
              >
                {user.role && <RoleBadge role={user.role} size="sm" />}
              </div>
            )}
          </div>
        </header>

        {/* Main View Container */}
        <main
          role="main"
          style={{
            flex: 1,
            padding: '2rem',
            maxWidth: '80rem',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
