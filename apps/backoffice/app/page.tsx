'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '../src/components/layout/admin-shell';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/operations');
  }, [router]);

  return (
    <AdminShell>
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
          Painel Administrativo da Plataforma
        </h2>
        <p style={{ color: 'var(--text-muted, #64748b)', marginTop: '0.5rem' }}>
          Redirecionando para o módulo de Operações & Infraestrutura...
        </p>
      </div>
    </AdminShell>
  );
}
