import React, { type HTMLAttributes, forwardRef } from 'react';

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string | undefined;
  title: string;
  titleAdornment?: React.ReactNode | undefined;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className = '',
      eyebrow,
      title,
      titleAdornment,
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
        {...props}
      >
        <div className="ui-page-header__body">
          <div>
            {eyebrow && (
              <p data-testid="page-header-eyebrow" className="ui-eyebrow">
                <span className="ui-eyebrow__rule" />
                {eyebrow}
              </p>
            )}
            <div className="ui-page-header__title-row">
              <h1
                data-testid="page-header-title"
                className="ui-page-header__title"
              >
                {title}
              </h1>
              {titleAdornment && (
                <div data-testid="page-header-title-adornment" className="ui-page-header__adornment">
                  {titleAdornment}
                </div>
              )}
            </div>
            {description && (
              <p
                data-testid="page-header-description"
                className="ui-page-header__description"
              >
                {description}
              </p>
            )}
          </div>

          {action && (
            <div data-testid="page-header-action" className="ui-page-header__action">
              {action}
            </div>
          )}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = 'PageHeader';
