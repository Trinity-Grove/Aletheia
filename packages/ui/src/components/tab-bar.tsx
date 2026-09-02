'use client';

import React from 'react';
import { AletheiaIcon } from './icon.js';
import type {
  NavigationItem,
  NavigationLinkRenderer,
  NavigationLinkRenderProps,
} from './app-shell.js';

export interface TabBarProps {
  items: NavigationItem[];
  moreActive: boolean;
  moreOpen: boolean;
  moreLabel?: string;
  onOpenMore: () => void;
  moreControlsId?: string;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
}

export function TabBar({
  items,
  moreActive,
  moreOpen,
  moreLabel = 'Mais',
  onOpenMore,
  moreControlsId,
  renderNavigationLink,
}: TabBarProps) {
  return (
    <nav
      className="ui-tab-bar ui-appshell-tab-bar"
      aria-label="Navegação principal"
      data-testid="appshell-tab-bar"
    >
      <ul className="ui-tab-bar-list">
        {items.map((item) => {
          const linkProps: NavigationLinkRenderProps = {
            href: item.href,
            className: `ui-tab-bar-link ${item.active ? 'ui-tab-bar-link--active' : ''}`,
            'aria-current': item.active ? 'page' : undefined,
            'data-testid': `appshell-tab-bar-${item.id}`,
            children: (
              <>
                <span className="ui-tab-bar-icon" aria-hidden="true">{item.icon}</span>
                <span className="ui-tab-bar-label">{item.label}</span>
              </>
            ),
          };

          return (
            <li key={item.id} className="ui-tab-bar-item">
              {renderNavigationLink ? renderNavigationLink(linkProps) : <a {...linkProps} />}
            </li>
          );
        })}
        <li className="ui-tab-bar-item">
          <button
            type="button"
            className={`ui-tab-bar-link ui-tab-bar-more-button ${moreActive ? 'ui-tab-bar-link--active' : ''}`}
            onClick={onOpenMore}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-controls={moreControlsId}
            data-testid="appshell-tab-bar-more"
          >
            <span className="ui-tab-bar-icon" aria-hidden="true">
              <AletheiaIcon name="more-horizontal" size={18} />
            </span>
            <span className="ui-tab-bar-label">{moreLabel}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
