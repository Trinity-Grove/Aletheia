'use client';

import React from 'react';

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  badge,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`ui-section-header ${className}`} data-testid="section-header">
      <div className="ui-section-header-content">
        <div className="ui-section-header-title-row">
          <h3 className="ui-section-header-title" data-testid="section-header-title">
            {title}
          </h3>
          {badge && <div className="ui-section-header-badge">{badge}</div>}
        </div>
        {description && (
          <p className="ui-section-header-description" data-testid="section-header-description">
            {description}
          </p>
        )}
      </div>
      {action && <div className="ui-section-header-action">{action}</div>}
    </div>
  );
}
