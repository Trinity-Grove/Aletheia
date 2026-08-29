'use client';

import React from 'react';
import { Menu } from 'lucide-react';

export interface TopbarProps {
  onOpenNavigation: () => void;
  actions?: React.ReactNode;
  navigationOpen?: boolean;
  navigationControlsId?: string;
}

export function Topbar({
  onOpenNavigation,
  actions,
  navigationOpen = false,
  navigationControlsId,
}: TopbarProps) {
  return (
    <header className="ui-topbar ui-appshell-topbar" data-testid="appshell-topbar">
      <div className="ui-topbar-navigation-control ui-appshell-topbar-left">
        <button
          type="button"
          className="ui-topbar-menu-button ui-appshell-mobile-menu-btn"
          onClick={onOpenNavigation}
          aria-label="Abrir navegação"
          aria-haspopup="dialog"
          aria-expanded={navigationOpen}
          aria-controls={navigationControlsId}
          data-testid="appshell-mobile-menu-btn"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="ui-topbar-actions ui-appshell-topbar-right" data-testid="appshell-topbar-actions">
        {actions}
      </div>
    </header>
  );
}
