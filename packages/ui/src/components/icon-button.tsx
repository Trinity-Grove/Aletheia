import React, { type ButtonHTMLAttributes, forwardRef } from 'react';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: IconButtonSize | undefined;
  icon?: React.ReactNode | undefined;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className = '',
      size = 'md',
      icon,
      children,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        data-testid="icon-button"
        data-size={size}
        disabled={disabled}
        className={`ui-icon-button ui-icon-button--${size} ${className}`.trim()}
        {...props}
      >
        {icon || children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
