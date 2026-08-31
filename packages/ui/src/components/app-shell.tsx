'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
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

export type NavigationLinkRenderProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  href: string;
  'data-testid'?: string | undefined;
};

export type NavigationLinkRenderer = (props: NavigationLinkRenderProps) => React.ReactNode;

export type AppShellUserProfile = React.ReactNode | ((collapsed: boolean) => React.ReactNode);

export interface AppShellProps {
  children: React.ReactNode;
  brandTitle?: React.ReactNode;
  brandSubtitle?: React.ReactNode;
  brandLogo?: React.ReactNode;
  navigationItems: NavigationItem[];
  topbarActions?: React.ReactNode;
  userProfile?: AppShellUserProfile;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
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
  renderNavigationLink,
  className = '',
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileNavigationId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const isMobileMenuOpenRef = useRef(isMobileMenuOpen);
  const moveFocusToDesktopNavigationRef = useRef(false);
  isMobileMenuOpenRef.current = isMobileMenuOpen;
  const shellClassName = `ui-appshell ${isSidebarCollapsed ? 'ui-appshell--collapsed' : ''} ${className}`.trim();
  const renderUserProfile = (collapsed: boolean) =>
    typeof userProfile === 'function' ? userProfile(collapsed) : userProfile;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mobileViewport = window.matchMedia(MOBILE_NAVIGATION_MEDIA_QUERY);
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches && isMobileMenuOpenRef.current) {
        moveFocusToDesktopNavigationRef.current = true;
        setIsMobileMenuOpen(false);
      }
    };

    mobileViewport.addEventListener('change', handleViewportChange);
    return () => mobileViewport.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen || !moveFocusToDesktopNavigationRef.current) return;

    moveFocusToDesktopNavigationRef.current = false;
    const desktopNavigationTarget = shellRef.current?.querySelector<HTMLElement>(
      '.ui-sidebar-navigation-link[aria-current="page"], .ui-sidebar-navigation-link',
    );
    desktopNavigationTarget?.focus();
  }, [isMobileMenuOpen]);

  const openMobileNavigation = () => {
    moveFocusToDesktopNavigationRef.current = false;
    setIsMobileMenuOpen(true);
  };

  const closeMobileNavigation = () => {
    moveFocusToDesktopNavigationRef.current = false;
    setIsMobileMenuOpen(false);
  };

  return (
    <div ref={shellRef} className={shellClassName} data-testid="app-shell">
      <a href="#appshell-main-content" className="ui-skip-link">
        Pular para o conteúdo principal
      </a>

      <Sidebar
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        brandLogo={brandLogo}
        items={navigationItems}
        collapsed={isSidebarCollapsed}
        onCollapse={setIsSidebarCollapsed}
        footer={renderUserProfile(isSidebarCollapsed)}
        renderNavigationLink={renderNavigationLink}
      />

      <div className="ui-appshell-main-wrapper">
        <Topbar
          onOpenNavigation={openMobileNavigation}
          actions={topbarActions}
          navigationOpen={isMobileMenuOpen}
          navigationControlsId={mobileNavigationId}
        />

        <main
          id="appshell-main-content"
          className="ui-appshell-content"
          data-testid="appshell-main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <MobileNavigation
        id={mobileNavigationId}
        open={isMobileMenuOpen}
        onClose={closeMobileNavigation}
        items={navigationItems}
        label="Navegação móvel"
        userProfile={renderUserProfile(false)}
        renderNavigationLink={renderNavigationLink}
      />
    </div>
  );
}
