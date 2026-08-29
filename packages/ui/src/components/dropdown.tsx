'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';

export interface DropdownItemProps {
  id?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItemProps[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const triggerId = useId();
  const menuId = useId();

  const findEnabledItem = useCallback(
    (startIndex: number, direction: 1 | -1) => {
      for (let offset = 0; offset < items.length; offset += 1) {
        const index = (startIndex + direction * offset + items.length) % items.length;
        if (!items[index]?.disabled) return index;
      }
      return -1;
    },
    [items]
  );

  const closeDropdown = useCallback((restoreTriggerFocus = false) => {
    setIsOpen(false);
    setFocusedIndex(-1);
    if (restoreTriggerFocus) triggerRef.current?.focus();
  }, []);

  const openDropdown = useCallback(
    (direction: 1 | -1 = 1) => {
      setIsOpen(true);
      setFocusedIndex(findEnabledItem(direction === 1 ? 0 : items.length - 1, direction));
    },
    [findEnabledItem, items.length]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0) itemRefs.current[focusedIndex]?.focus();
  }, [isOpen, focusedIndex]);

  const moveFocus = (direction: 1 | -1) => {
    setFocusedIndex((currentIndex) => {
      const startIndex = currentIndex === -1 ? (direction === 1 ? 0 : items.length - 1) : currentIndex + direction;
      return findEnabledItem(startIndex, direction);
    });
  };

  const activateFocusedItem = () => {
    const item = items[focusedIndex];
    if (!item || item.disabled) return;
    item.onClick?.();
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus(-1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateFocusedItem();
    }
  };

  const triggerElement = React.isValidElement<
    React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>
  >(trigger) ? (
    React.cloneElement(trigger, {
      ref: triggerRef,
      id: triggerId,
      'aria-haspopup': 'menu',
      'aria-expanded': isOpen,
      'aria-controls': menuId,
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        trigger.props.onClick?.(event);
        if (!event.defaultPrevented) (isOpen ? closeDropdown() : openDropdown());
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        trigger.props.onKeyDown?.(event);
        if (!event.defaultPrevented) handleKeyDown(event);
      },
    })
  ) : (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      id={triggerId}
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-controls={menuId}
      onClick={() => (isOpen ? closeDropdown() : openDropdown())}
      onKeyDown={handleKeyDown}
    >
      {trigger}
    </button>
  );

  return (
    <div
      ref={dropdownRef}
      className={`ui-dropdown-container ${className}`}
      data-testid="dropdown-container"
    >
      <div className="ui-dropdown-trigger" data-testid="dropdown-trigger">
        {triggerElement}
      </div>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          className={`ui-dropdown-menu ui-dropdown-menu--${align}`}
          data-testid="dropdown-menu"
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <button
              key={item.id ?? index}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              role="menuitem"
              type="button"
              tabIndex={focusedIndex === index ? 0 : -1}
              disabled={item.disabled}
              className={`ui-dropdown-item ${item.danger ? 'ui-dropdown-item--danger' : ''} ${
                focusedIndex === index ? 'ui-dropdown-item--focused' : ''
              }`}
              data-testid={`dropdown-item-${item.id ?? index}`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick?.();
                  closeDropdown();
                }
              }}
            >
              {item.icon && <span className="ui-dropdown-item-icon">{item.icon}</span>}
              <span className="ui-dropdown-item-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
