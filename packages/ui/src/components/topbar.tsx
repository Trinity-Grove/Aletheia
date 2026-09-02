'use client';

import React from 'react';

export interface TopbarProps {
  brandLogo?: React.ReactNode;
  brandTitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function Topbar({ brandLogo, brandTitle, actions }: TopbarProps) {
  return (
    <header className="ui-topbar ui-appshell-topbar" data-testid="appshell-topbar">
      <div className="ui-topbar-brand ui-appshell-topbar-left" data-testid="appshell-topbar-brand">
        {brandLogo && (
          <span className="ui-topbar-brand-logo" aria-hidden="true">
            {brandLogo}
          </span>
        )}
        {brandTitle && <span className="ui-topbar-brand-title">{brandTitle}</span>}
      </div>

      <div className="ui-topbar-actions ui-appshell-topbar-right" data-testid="appshell-topbar-actions">
        {actions}
      </div>
    </header>
  );
}
