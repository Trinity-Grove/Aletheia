'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NavigationItem } from './app-shell.js';

export interface SidebarProps {
  brandTitle?: React.ReactNode;
  brandSubtitle?: React.ReactNode;
  brandLogo?: React.ReactNode;
  items: NavigationItem[];
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  footer?: React.ReactNode;
  label?: string;
}

export function Sidebar({
  brandTitle = 'Aletheia',
  brandSubtitle = 'Educação Domiciliar',
  brandLogo,
  items,
  collapsed,
  onCollapse,
  footer,
  label = 'Navegação principal',
}: SidebarProps) {
  return (
    <aside
      className={`ui-sidebar ui-appshell-sidebar ${collapsed ? 'ui-sidebar--collapsed' : ''}`}
      data-testid="appshell-sidebar"
      aria-label={label}
    >
      <div className="ui-sidebar-header ui-appshell-sidebar-header">
        <div className="ui-sidebar-brand ui-appshell-brand">
          {brandLogo && (
            <div className="ui-sidebar-brand-logo ui-appshell-brand-logo">{brandLogo}</div>
          )}
          {!collapsed && (
            <div className="ui-sidebar-brand-text ui-appshell-brand-text">
              <span className="ui-sidebar-brand-title ui-appshell-brand-title">{brandTitle}</span>
              {brandSubtitle && (
                <span className="ui-sidebar-brand-subtitle ui-appshell-brand-subtitle">
                  {brandSubtitle}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="ui-sidebar-collapse-toggle ui-appshell-collapse-toggle"
          onClick={() => onCollapse(!collapsed)}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          data-testid="appshell-collapse-btn"
        >
          {collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
        </button>
      </div>

      <nav className="ui-sidebar-navigation ui-appshell-nav" aria-label={label} data-testid="appshell-nav">
        <ul className="ui-sidebar-navigation-list ui-appshell-nav-list">
          {items.map((item) => (
            <li key={item.id} className="ui-sidebar-navigation-item ui-appshell-nav-item">
              <a
                href={item.href}
                className={`ui-sidebar-navigation-link ui-appshell-nav-link ${
                  item.active ? 'ui-sidebar-navigation-link--active ui-appshell-nav-link--active' : ''
                }`}
                aria-current={item.active ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
                data-testid={`appshell-nav-${item.id}`}
              >
                <span className="ui-sidebar-navigation-icon ui-appshell-nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="ui-sidebar-navigation-label ui-appshell-nav-label">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ui-sidebar-navigation-badge ui-appshell-nav-badge">{item.badge}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {footer && (
        <div className="ui-sidebar-footer ui-appshell-sidebar-footer" data-testid="appshell-user-profile">
          {footer}
        </div>
      )}
    </aside>
  );
}
