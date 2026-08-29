'use client';

import React, { useEffect, useId, useState } from 'react';
import { MobileNavigation } from './mobile-navigation.js';
import { Sidebar } from './sidebar.js';
import { Topbar } from './topbar.js';

const MOBILE_NAVIGATION_MEDIA_QUERY = '(max-width: 1024px)';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
}

export type AppShellUserProfile = React.ReactNode | ((collapsed: boolean) => React.ReactNode);

export interface AppShellProps {
  children: React.ReactNode;
  brandTitle?: React.ReactNode;
  brandSubtitle?: React.ReactNode;
  brandLogo?: React.ReactNode;
  navigationItems: NavigationItem[];
  topbarActions?: React.ReactNode;
  userProfile?: AppShellUserProfile;
  className?: string;
}

export function AppShell({
  children,
  brandTitle = 'Aletheia',
  brandSubtitle = 'Educação Domiciliar',
  brandLogo,
  navigationItems,
  topbarActions,
  userProfile,
  className = '',
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileNavigationId = useId();
  const shellClassName = `ui-appshell ${isSidebarCollapsed ? 'ui-appshell--collapsed' : ''} ${className}`.trim();
  const renderUserProfile = (collapsed: boolean) =>
    typeof userProfile === 'function' ? userProfile(collapsed) : userProfile;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mobileViewport = window.matchMedia(MOBILE_NAVIGATION_MEDIA_QUERY);
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches) setIsMobileMenuOpen(false);
    };

    mobileViewport.addEventListener('change', handleViewportChange);
    return () => mobileViewport.removeEventListener('change', handleViewportChange);
  }, []);

  return (
    <div className={shellClassName} data-testid="app-shell">
      <Sidebar
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        brandLogo={brandLogo}
        items={navigationItems}
        collapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
        footer={renderUserProfile(isSidebarCollapsed)}
      />

      <div className="ui-appshell-main-wrapper">
        <Topbar
          onOpenNavigation={() => setIsMobileMenuOpen(true)}
          actions={topbarActions}
          navigationOpen={isMobileMenuOpen}
          navigationControlsId={mobileNavigationId}
        />

        <main className="ui-appshell-content" data-testid="appshell-main-content">
          {children}
        </main>
      </div>

      <MobileNavigation
        id={mobileNavigationId}
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        items={navigationItems}
        label="Navegação móvel"
        userProfile={renderUserProfile(false)}
      />
    </div>
  );
}
