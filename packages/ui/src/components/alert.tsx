import React, { type HTMLAttributes, forwardRef } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: AlertVariant | undefined;
  title?: React.ReactNode | undefined;
  icon?: React.ReactNode | undefined;
}

const DEFAULT_ICONS: Record<AlertVariant, React.ReactNode> = {
  info: <Info size={18} />,
  success: <CheckCircle2 size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <XCircle size={18} />,
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className = '',
      variant = 'info',
      title,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const renderedIcon = icon !== undefined ? icon : DEFAULT_ICONS[variant];

    return (
      <div
        ref={ref}
        role="alert"
        data-testid="alert"
        data-variant={variant}
        className={`ui-alert ui-alert--${variant} ${className}`.trim()}
        {...props}
      >
        {renderedIcon && (
          <span data-testid="alert-icon" className="ui-alert__icon" aria-hidden="true">
            {renderedIcon}
          </span>
        )}
        <div className="ui-alert__content">
          {title && (
            <h4 data-testid="alert-title" className="ui-alert__title">
              {title}
            </h4>
          )}
          <div data-testid="alert-message" className="ui-alert__message">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
