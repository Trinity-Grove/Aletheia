import React, { type HTMLAttributes, forwardRef } from 'react';

export type BadgeVariant = 'indigo' | 'amber' | 'emerald' | 'slate' | 'rose';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant | undefined;
  size?: BadgeSize | undefined;
  dot?: boolean | undefined;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className = '',
      variant = 'slate',
      size = 'md',
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        data-testid="badge"
        data-variant={variant}
        data-size={size}
        className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`.trim()}
        {...props}
      >
        {dot && <span data-testid="badge-dot" className="ui-badge__dot" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
