'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type {
  NavigationItem,
  NavigationLinkRenderer,
  NavigationLinkRenderProps,
} from './app-shell.js';

export interface MobileNavigationProps {
  items: NavigationItem[];
  open: boolean;
  onClose: () => void;
  label?: string;
  id?: string;
  userProfile?: React.ReactNode;
  renderNavigationLink?: NavigationLinkRenderer | undefined;
}

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileNavigation({
  items,
  open,
  onClose,
  label = 'Navegação móvel',
  id,
  userProfile,
  renderNavigationLink,
}: MobileNavigationProps) {
  const generatedNavigationId = useId();
  const navigationId = id ?? generatedNavigationId;
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusableElements = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstFocusable || !panelRef.current?.contains(activeElement))) {
        event.preventDefault();
        lastFocusable?.focus();
      } else if (!event.shiftKey && (activeElement === lastFocusable || !panelRef.current?.contains(activeElement))) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    getFocusableElements()[0]?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElementRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="ui-mobile-navigation-layer" data-testid="appshell-mobile-navigation-layer">
      <button
        type="button"
        className="ui-mobile-navigation-backdrop ui-appshell-mobile-backdrop"
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
        data-testid="appshell-mobile-backdrop"
      />
      <aside
        ref={panelRef}
        id={navigationId}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="ui-mobile-navigation"
        data-testid="appshell-mobile-navigation"
      >
        <div className="ui-mobile-navigation-header">
          <span className="ui-mobile-navigation-title">{label}</span>
          <button
            type="button"
            className="ui-mobile-navigation-close"
            onClick={onClose}
            aria-label="Fechar navegação"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="ui-mobile-navigation-menu" aria-label={label}>
          <ul className="ui-mobile-navigation-list">
            {items.map((item) => {
              const linkProps: NavigationLinkRenderProps = {
                href: item.href,
                className: `ui-mobile-navigation-link ${
                  item.active ? 'ui-mobile-navigation-link--active' : ''
                }`,
                'aria-current': item.active ? 'page' : undefined,
                onClick: onClose,
                children: (
                  <>
                    <span className="ui-mobile-navigation-icon" aria-hidden="true">{item.icon}</span>
                    <span className="ui-mobile-navigation-label">{item.label}</span>
                    {item.badge && <span className="ui-mobile-navigation-badge">{item.badge}</span>}
                  </>
                ),
              };

              return (
                <li key={item.id} className="ui-mobile-navigation-item">
                  {renderNavigationLink ? renderNavigationLink(linkProps) : <a {...linkProps} />}
                </li>
              );
            })}
          </ul>
        </nav>
        {userProfile && (
          <div className="ui-mobile-navigation-profile" data-testid="appshell-mobile-user-profile">
            {userProfile}
          </div>
        )}
      </aside>
    </div>
  );
}
