import React from 'react';
import type { NavigationLinkRenderer } from './app-shell.js';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  renderLink?: NavigationLinkRenderer;
  className?: string;
}

export function Breadcrumbs({ items, renderLink, className = '' }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`ui-breadcrumbs ${className}`.trim()} data-testid="breadcrumbs">
      <ol className="ui-breadcrumbs-list">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={item.id} className="ui-breadcrumbs-item">
              {!isCurrent && item.href ? (
                renderLink ? (
                  renderLink({ href: item.href, className: 'ui-breadcrumbs-link', children: item.label })
                ) : (
                  <a href={item.href} className="ui-breadcrumbs-link">
                    {item.label}
                  </a>
                )
              ) : (
                <span className="ui-breadcrumbs-current" aria-current={isCurrent ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isCurrent && (
                <span className="ui-breadcrumbs-separator" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
