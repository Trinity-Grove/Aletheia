'use client';

import React, { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './icon-button.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode | undefined;
  description?: ReactNode | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | undefined;
  closeOnEscape?: boolean | undefined;
  closeOnBackdropClick?: boolean | undefined;
  initialFocusRef?: React.RefObject<HTMLElement | null> | undefined;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  closeOnEscape = true,
  closeOnBackdropClick = true,
  initialFocusRef,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;
  const descId = `modal-desc-${generatedId}`;

  // Focus Trapping and Key Listener
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore upon close
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus Initial Element or Modal Panel
    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable && focusable.length > 0) {
          focusable[0]?.focus();
        } else if (panelRef.current) {
          panelRef.current.focus();
        }
      }
    }, 20);

    function handleKeyDown(e: KeyboardEvent) {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus to opener element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEscape, onClose, initialFocusRef]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      data-testid="modal-backdrop"
      className="ui-modal__backdrop"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        data-testid="modal-panel"
        data-max-width={maxWidth}
        className={`ui-modal__panel ui-modal__panel--${maxWidth}`}
      >
        {(title || description) && (
          <div className="ui-modal__header" data-testid="modal-header">
            <div>
              {title && (
                <h2 id={titleId} data-testid="modal-title" className="ui-modal__title">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} data-testid="modal-description" className="ui-modal__description">
                  {description}
                </p>
              )}
            </div>

            <IconButton
              aria-label="Fechar diálogo"
              data-testid="modal-close-button"
              size="sm"
              onClick={onClose}
            >
              <X size={16} />
            </IconButton>
          </div>
        )}

        <div data-testid="modal-body" className="ui-modal__body">
          {children}
        </div>

        {footer && (
          <div data-testid="modal-footer" className="ui-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
