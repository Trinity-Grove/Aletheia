'use client';

import React, { useEffect, useState } from 'react';
import { EmptyState } from '@aletheia/ui';
import type { AccountAuditEventType, AccountAuditLogEntryDto } from '@aletheia/contracts';

export interface AccountActivityLogProps {
  fetchAuditLog: () => Promise<AccountAuditLogEntryDto[]>;
}

const EVENT_LABELS: Record<AccountAuditEventType, string> = {
  LOGIN_SUCCEEDED: 'Login realizado',
  LOGIN_FAILED: 'Tentativa de login com senha incorreta',
  LOGOUT: 'Logout',
  PASSWORD_CHANGED: 'Senha alterada',
  PASSWORD_RESET_REQUESTED: 'Redefinição de senha solicitada',
  PASSWORD_RESET_COMPLETED: 'Senha redefinida por link de e-mail',
  EMAIL_CHANGED: 'E-mail alterado',
   EMAIL_VERIFIED: 'E-mail verificado',
   REFRESH_TOKEN_REUSE_DETECTED: 'Atividade suspeita detectada — sessões encerradas por segurança',
   MFA_ENABLED: 'Autenticação de dois fatores ativada',
   MFA_DISABLED: 'Autenticação de dois fatores desativada',
   MFA_CHALLENGE_FAILED: 'Código de autenticação de dois fatores inválido',
 };

function formatEntryDate(createdAt: string): string {
  return new Date(createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function AccountActivityLog({ fetchAuditLog }: AccountActivityLogProps) {
  const [entries, setEntries] = useState<AccountAuditLogEntryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAuditLog()
      .then((result) => {
        if (!cancelled) setEntries(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar a atividade recente.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchAuditLog]);

  return (
    <div
      data-testid="account-activity-log-card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Atividade Recente da Conta
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Eventos de segurança da sua conta, mais recentes primeiro.
        </p>
      </div>

      {error && (
        <div
          data-testid="account-activity-log-error"
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--color-rose-50)',
            border: '1px solid var(--color-rose-100)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-rose-700)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {!error && entries === null && (
        <p data-testid="account-activity-log-loading" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Carregando...
        </p>
      )}

      {!error && entries !== null && entries.length === 0 && (
        <EmptyState
          title="Nenhuma atividade registrada"
          description="Eventos como login, alteração de senha e de e-mail aparecerão aqui."
        />
      )}

      {!error && entries !== null && entries.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {entries.map((entry) => (
            <li
              key={entry.id}
              data-testid={`account-activity-item-${entry.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.625rem 0',
                borderBottom: '1px solid var(--border-light)',
                fontSize: '0.875rem',
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>
                {EVENT_LABELS[entry.eventType] ?? entry.eventType}
              </span>
              <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {formatEntryDate(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
