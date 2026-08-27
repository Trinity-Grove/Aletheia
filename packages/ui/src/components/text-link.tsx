import React, { type AnchorHTMLAttributes, forwardRef } from 'react';

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const TextLink = forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        data-testid="text-link"
        className={`ui-text-link ${className}`.trim()}
        {...props}
      >
        {children}
      </a>
    );
  }
);

TextLink.displayName = 'TextLink';
