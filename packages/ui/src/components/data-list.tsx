'use client';

import React from 'react';

export interface DataListItem {
  id?: string;
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  helperText?: React.ReactNode;
}

export interface DataListProps {
  items: DataListItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}

export function DataList({ items, columns = 1, className = '' }: DataListProps) {
  return (
    <dl className={`ui-data-list ui-data-list--cols-${columns} ${className}`} data-testid="data-list">
      {items.map((item, idx) => (
        <div key={item.id ?? idx} className="ui-data-list-item" data-testid={`data-list-item-${item.id ?? idx}`}>
          <dt className="ui-data-list-term">
            {item.icon && <span className="ui-data-list-icon">{item.icon}</span>}
            <span className="ui-data-list-label">{item.label}</span>
          </dt>
          <dd className="ui-data-list-detail">
            <span className="ui-data-list-value">{item.value}</span>
            {item.helperText && <span className="ui-data-list-helper">{item.helperText}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
