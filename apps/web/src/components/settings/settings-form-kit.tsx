'use client';

import React from 'react';
import { AletheiaIcon } from '@aletheia/ui';

export const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-surface)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-light)',
  padding: '1.75rem',
  boxShadow: 'var(--shadow-sm)',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.375rem',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 0.875rem',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-medium)',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-surface)',
  boxSizing: 'border-box',
};

export function SuccessAlert({ testId, message }: { testId: string; message: string }) {
  return (
    <div
      data-testid={testId}
      role="status"
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-emerald-50)',
        border: '1px solid var(--color-emerald-100)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-emerald-700)',
        fontSize: '0.875rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <AletheiaIcon name="check" size={16} />
      <span>{message}</span>
    </div>
  );
}

export function ErrorAlert({ testId, message }: { testId: string; message: string }) {
  return (
    <div
      data-testid={testId}
      role="alert"
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-rose-50)',
        border: '1px solid var(--color-rose-100)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-rose-700)',
        fontSize: '0.875rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <AletheiaIcon name="alert-circle" size={16} />
      <span>{message}</span>
    </div>
  );
}
