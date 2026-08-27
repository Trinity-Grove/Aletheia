import React, { type HTMLAttributes, forwardRef } from 'react';

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className = '',
      eyebrow,
      title,
      description,
      action,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        data-testid="page-header"
        className={`ui-page-header ${className}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '2rem',
        }}
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            {eyebrow && (
              <p data-testid="page-header-eyebrow" className="ui-eyebrow" style={{ marginBottom: '0.375rem' }}>
                <span className="ui-eyebrow__rule" />
                {eyebrow}
              </p>
            )}
            <h1
              data-testid="page-header-title"
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                color: 'var(--color-brand-forest)',
                fontWeight: 400,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                data-testid="page-header-description"
                style={{
                  margin: '0.375rem 0 0 0',
                  fontSize: '0.9375rem',
                  color: 'var(--text-secondary)',
                  maxWidth: '48rem',
                  lineHeight: 1.5,
                }}
              >
                {description}
              </p>
            )}
          </div>

          {action && <div data-testid="page-header-action">{action}</div>}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = 'PageHeader';
