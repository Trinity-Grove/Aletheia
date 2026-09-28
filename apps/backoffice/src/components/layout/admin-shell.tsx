'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@aletheia/ui';
import { AdminGuard, useAdminAuth } from '../../lib/auth/admin-auth-context';

export interface AdminShellProps {
  children?: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps): React.ReactElement {
  const { user, logout } = useAdminAuth();

  let pathname = '';
  try {
    pathname = usePathname() || '';
  } catch {
    // Graceful fallback for non-Next router test environments
  }

  const navItems = [
    { href: '/operations', label: 'Operações & Infraestrutura' },
    { href: '/catalog', label: 'Catálogo & Definições' },
    { href: '/moderation', label: 'Moderação Comunitária' },
    { href: '/users', label: 'Usuários' },
  ];

  return (
    <div className="admin-shell-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        className="admin-shell-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1.5rem',
          borderBottom: '1px solid var(--line, #e2e8f0)',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/operations"
            style={{
              textDecoration: 'none',
              color: 'var(--text-primary, #0f172a)',
              fontWeight: 700,
              fontSize: '1.125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Aletheia Backoffice</span>
          </Link>
          <Badge variant="indigo" size="sm">
            Administração da Plataforma
          </Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {user && (
            <>
              <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                  {user.fullName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                  {user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                data-testid="admin-header-logout"
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--line, #cbd5e1)',
                  backgroundColor: '#f8fafc',
                  color: 'var(--text-primary, #334155)',
                  cursor: 'pointer',
                }}
              >
                Sair / Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside
          className="admin-shell-sidebar"
          style={{
            width: '260px',
            backgroundColor: 'var(--bg-canvas, #f8fafc)',
            borderRight: '1px solid var(--line, #e2e8f0)',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted, #64748b)',
              padding: '0.25rem 0.5rem',
              marginBottom: '0.25rem',
            }}
          >
            Módulos de Gestão
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : 'var(--text-primary, #1e293b)',
                    backgroundColor: isActive ? 'var(--forest, #1e3a2f)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main
          className="admin-shell-content"
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            padding: '2rem',
            overflowY: 'auto',
          }}
        >
          <AdminGuard>{children}</AdminGuard>
        </main>
      </div>
    </div>
  );
}
