import React, { type HTMLAttributes, forwardRef } from 'react';
import { Sparkles } from 'lucide-react';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode | undefined;
  title: string;
  description?: string | undefined;
  action?: React.ReactNode | undefined;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className = '',
      icon = <Sparkles size={36} style={{ color: 'var(--color-brand-sage)' }} />,
      title,
      description,
      action,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-testid="empty-state"
        className={`ui-empty-state ${className}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '3rem 1.5rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px dashed var(--border-light)',
        }}
        {...props}
      >
        <div data-testid="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: 1 }}>
          {icon}
        </div>
        <h3 data-testid="empty-state-title" className="ui-card-title" style={{ marginBottom: '0.375rem' }}>
          {title}
        </h3>
        {description && (
          <p
            data-testid="empty-state-description"
            className="ui-card-description"
            style={{ maxWidth: '28rem', marginBottom: action ? '1.5rem' : 0 }}
          >
            {description}
          </p>
        )}
        {action && <div data-testid="empty-state-action">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
