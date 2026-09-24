'use client';

import React from 'react';
import { ProductShell } from '../../../../src/components/layout/product-shell';
import { PackModerationDashboard } from '../../../../src/components/admin/pack-moderation-dashboard';
import { useAuth } from '../../../../src/lib/auth/auth-context';
import { useLocale } from '../../../../src/lib/i18n/locale-context';

export default function AdminModerationPage() {
  const { status, user } = useAuth();
  const { t } = useLocale();

  const isPlatformAdmin = status === 'authenticated' && user?.isPlatformAdmin === true;

  return (
    <ProductShell currentPath={isPlatformAdmin ? undefined : '/moderation-access-restricted'}>
      {isPlatformAdmin ? (
        <PackModerationDashboard />
      ) : (
        <div
          data-testid="unauthorized-admin-view"
          style={{
            maxWidth: '600px',
            margin: '4rem auto',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            borderRadius: '8px',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
            {t('curriculum.moderation.admin.unauthorizedMessage')}
          </h2>
        </div>
      )}
    </ProductShell>
  );
}
