'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { MobileMoreSheet } from './mobile-more-sheet.js';
import { Sidebar } from './sidebar.js';
import { TabBar } from './tab-bar.js';
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
  primaryNavigationItems: NavigationItem[];
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
  primaryNavigationItems,
  topbarActions,
  userProfile,
  renderNavigationLink,
  className = '',
}: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const moreSheetId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const isMoreSheetOpenRef = useRef(isMoreSheetOpen);
  const moveFocusToDesktopNavigationRef = useRef(false);
  isMoreSheetOpenRef.current = isMoreSheetOpen;
  const shellClassName = `ui-appshell ${isSidebarCollapsed ? 'ui-appshell--collapsed' : ''} ${className}`.trim();
  const renderUserProfile = (collapsed: boolean) =>
    typeof userProfile === 'function' ? userProfile(collapsed) : userProfile;

  const overflowItems = navigationItems.filter(
    (item) => !primaryNavigationItems.some((primary) => primary.id === item.id),
  );
  const moreActive = overflowItems.some((item) => item.active === true);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const mobileViewport = window.matchMedia(MOBILE_NAVIGATION_MEDIA_QUERY);
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (!event.matches && isMoreSheetOpenRef.current) {
        moveFocusToDesktopNavigationRef.current = true;
        setIsMoreSheetOpen(false);
      }
    };

    mobileViewport.addEventListener('change', handleViewportChange);
    return () => mobileViewport.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    if (isMoreSheetOpen || !moveFocusToDesktopNavigationRef.current) return;

    moveFocusToDesktopNavigationRef.current = false;
    const desktopNavigationTarget = shellRef.current?.querySelector<HTMLElement>(
      '.ui-sidebar-navigation-link[aria-current="page"], .ui-sidebar-navigation-link',
    );
    desktopNavigationTarget?.focus();
  }, [isMoreSheetOpen]);

  const openMoreSheet = () => {
    moveFocusToDesktopNavigationRef.current = false;
    setIsMoreSheetOpen(true);
  };

  const closeMoreSheet = () => {
    moveFocusToDesktopNavigationRef.current = false;
    setIsMoreSheetOpen(false);
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
        <Topbar brandLogo={brandLogo} brandTitle={brandTitle} actions={topbarActions} />

        <main
          id="appshell-main-content"
          className="ui-appshell-content"
          data-testid="appshell-main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <TabBar
        items={primaryNavigationItems}
        moreActive={moreActive}
        moreOpen={isMoreSheetOpen}
        onOpenMore={openMoreSheet}
        moreControlsId={moreSheetId}
        renderNavigationLink={renderNavigationLink}
      />

      <MobileMoreSheet
        id={moreSheetId}
        open={isMoreSheetOpen}
        onClose={closeMoreSheet}
        items={overflowItems}
        label="Mais opções"
        userProfile={renderUserProfile(false)}
        renderNavigationLink={renderNavigationLink}
      />
    </div>
  );
}
