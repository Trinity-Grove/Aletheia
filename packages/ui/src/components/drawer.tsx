'use client';

import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string | undefined;
}

const SIZE_CLASSES = {
  sm: 'ui-drawer--sm',
  md: 'ui-drawer--md',
  lg: 'ui-drawer--lg',
} as const;

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'right',
  size = 'md',
  ariaLabel = 'Gaveta lateral',
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  const hasTitle = Boolean(title);
  const accessibleLabel = ariaLabel.trim() || 'Gaveta lateral';

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusableElements = () =>
      Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

    const focusInitialElement = () => {
      const [firstFocusable] = getFocusableElements();
      (firstFocusable ?? drawerRef.current)?.focus();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        drawerRef.current?.focus();
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstFocusable || !drawerRef.current?.contains(activeElement))) {
        event.preventDefault();
        lastFocusable?.focus();
      } else if (!event.shiftKey && (activeElement === lastFocusable || !drawerRef.current?.contains(activeElement))) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    focusInitialElement();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="ui-drawer-backdrop"
      data-testid="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-label={hasTitle ? undefined : accessibleLabel}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`ui-drawer ui-drawer--${position} ${SIZE_CLASSES[size]}`}
        data-testid="drawer-container"
      >
        <div className="ui-drawer-header">
          <div>
            {hasTitle && (
              <h3 id={titleId} className="ui-drawer-title" data-testid="drawer-title">
                {title}
              </h3>
            )}
            {description && (
              <p id={descriptionId} className="ui-drawer-description" data-testid="drawer-description">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="ui-drawer-close"
            onClick={onClose}
            aria-label="Fechar gaveta lateral"
            data-testid="drawer-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ui-drawer-body" data-testid="drawer-body">
          {children}
        </div>

        {footer && (
          <div className="ui-drawer-footer" data-testid="drawer-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
