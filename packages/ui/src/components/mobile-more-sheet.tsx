'use client';

import React from 'react';
import { Drawer } from './drawer.js';
import type {
  NavigationItem,
  NavigationLinkRenderer,
  NavigationLinkRenderProps,
} from './app-shell.js';

export interface MobileMoreSheetProps {
  id?: string;
  items: NavigationItem[];
  open: boolean;
  onClose: () => void;
  label?: string;
  userProfile?: React.ReactNode;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
}

export function MobileMoreSheet({
  id,
  items,
  open,
  onClose,
  label = 'Mais opções',
  userProfile,
  renderNavigationLink,
}: MobileMoreSheetProps) {
  return (
    <Drawer isOpen={open} onClose={onClose} position="bottom" ariaLabel={label} id={id}>
      <nav className="ui-more-sheet-menu" aria-label={label}>
        <ul className="ui-more-sheet-list">
          {items.map((item) => {
            const linkProps: NavigationLinkRenderProps = {
              href: item.href,
              className: `ui-more-sheet-link ${item.active ? 'ui-more-sheet-link--active' : ''}`,
              'aria-current': item.active ? 'page' : undefined,
              onClick: onClose,
              children: (
                <>
                  <span className="ui-more-sheet-icon" aria-hidden="true">{item.icon}</span>
                  <span className="ui-more-sheet-label">{item.label}</span>
                  {item.badge && <span className="ui-more-sheet-badge">{item.badge}</span>}
                </>
              ),
            };

            return (
              <li key={item.id} className="ui-more-sheet-item">
                {renderNavigationLink ? renderNavigationLink(linkProps) : <a {...linkProps} />}
              </li>
            );
          })}
        </ul>
      </nav>
      {userProfile && (
        <div className="ui-more-sheet-profile" data-testid="appshell-mobile-user-profile">
          {userProfile}
        </div>
      )}
    </Drawer>
  );
}
