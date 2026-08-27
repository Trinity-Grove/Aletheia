import React from 'react';
import type { FamilyRole } from '@aletheia/contracts';

export interface RoleBadgeProps {
  role: FamilyRole | string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const ROLE_LABELS: Record<FamilyRole, string> = {
  OWNER_GUARDIAN: 'Guardião Principal',
  GUARDIAN: 'Guardião',
  CO_GUARDIAN: 'Co-guardião',
  EDUCATOR: 'Educador',
};

const ROLE_STYLES: Record<
  FamilyRole,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  OWNER_GUARDIAN: {
    backgroundColor: '#EDE9FE',
    color: '#5B21B6',
    borderColor: '#DDD6FE',
  },
  GUARDIAN: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    borderColor: '#BFDBFE',
  },
  CO_GUARDIAN: {
    backgroundColor: '#CCFBF1',
    color: '#115E59',
    borderColor: '#99F6E4',
  },
  EDUCATOR: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    borderColor: '#FDE68A',
  },
};

const SIZE_STYLES: Record<
  'sm' | 'md' | 'lg',
  { padding: string; fontSize: string }
> = {
  sm: { padding: '0.125rem 0.5rem', fontSize: '0.75rem' },
  md: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
  lg: { padding: '0.375rem 1rem', fontSize: '1rem' },
};

export function RoleBadge({
  role,
  size = 'md',
  className = '',
  style = {},
}: RoleBadgeProps) {
  if (!role) {
    return null;
  }

  const roleKey = role as FamilyRole;
  const label = ROLE_LABELS[roleKey] || role;
  const theme = ROLE_STYLES[roleKey] || {
    backgroundColor: '#F3F4F6',
    color: '#374151',
    borderColor: '#E5E7EB',
  };
  const sizeStyle = SIZE_STYLES[size];

  return (
    <span
      data-testid="role-badge"
      data-role={role}
      className={`role-badge ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 600,
        borderRadius: '9999px',
        borderWidth: '1px',
        borderStyle: 'solid',
        lineHeight: 1.25,
        ...theme,
        ...sizeStyle,
        ...style,
      }}
    >
      {label}
    </span>
  );
}
