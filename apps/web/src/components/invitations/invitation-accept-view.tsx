'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Alert, Button, Card } from '@aletheia/ui';
import { getApiAuthToken } from '../../lib/api';
import { useAuth } from '../../lib/auth/auth-context';

export interface InvitationAcceptViewProps {
  token?: string | undefined;
  params?: Promise<{ token: string }> | { token: string };
}

export function InvitationAcceptView({ token: initialToken, params }: InvitationAcceptViewProps) {
  const router = useRouter();
  const routeParams = useParams();

  // Resolve token from props, async params, or routeParams
  let resolvedToken = initialToken || (routeParams?.token as string) || '';
  if (!resolvedToken && params) {
    if (typeof (params as Promise<{ token: string }>).then === 'function') {
      const unwrapped = use(params as Promise<{ token: string }>);
      resolvedToken = unwrapped?.token || '';
    } else if ((params as { token: string }).token) {
      resolvedToken = (params as { token: string }).token;
    }
  }

  const { status, user, refreshSession, selectFamily } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAcceptInvitation = async () => {
    if (!resolvedToken) {
      setError('Token de convite não fornecido.');
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const authToken = getApiAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/v1/invitations/${encodeURIComponent(resolvedToken)}/accept`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Convite inválido, expirado ou já utilizado.');
      }

      const data: { success: boolean; familyId: string } = await res.json();
      setSuccess(true);

      try {
        localStorage.setItem('familyId', data.familyId);
        localStorage.setItem('aletheia_active_family_id', data.familyId);
      } catch {
        // Ignore storage errors
      }

      if (selectFamily) {
        selectFamily(data.familyId);
      }
      if (refreshSession) {
        await refreshSession().catch(() => {});
      }

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao aceitar convite.');
    } finally {
      setIsAccepting(false);
    }
  };

  const loginUrl = `/login?redirect=${encodeURIComponent(`/convite/${resolvedToken}`)}`;
  const registerUrl = `/register?redirect=${encodeURIComponent(`/convite/${resolvedToken}`)}`;

  return (
    <div
      data-testid="invitation-accept-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <Card
        style={{
          maxWidth: '32rem',
          width: '100%',
          padding: '2.5rem 2rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          textAlign: 'center',
        }}
      >
        {/* Brand / Decorative Icon */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--sage-soft)',
              color: 'var(--forest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            🏡
          </div>
        </div>

        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--gold-dark)',
            }}
          >
            Aletheia • Trinity Grove
          </span>
          <h1
            style={{
              margin: '0.5rem 0 0.25rem 0',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              fontWeight: 600,
              color: 'var(--forest)',
            }}
          >
            Convite para Família
          </h1>
          <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Você foi convidado(a) para fazer parte de uma comunidade de aprendizado familiar.
          </p>
        </div>

        {error && (
          <Alert variant="error" data-testid="invitation-error-alert">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" data-testid="invitation-success-message">
            Convite aceito com sucesso! Bem-vindo(a) à família!
          </Alert>
        )}

        {/* Loading status */}
        {status === 'loading' && (
          <div data-testid="invitation-loading" style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
            Verificando sua sessão...
          </div>
        )}

        {/* Unauthenticated State */}
        {status === 'unauthenticated' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              Para aceitar este convite com segurança e acessar os planos de estudo, entre com sua conta existente ou crie um novo cadastro.
            </div>

            <Link
              href={loginUrl}
              data-testid="login-to-accept-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--forest)',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.9375rem',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              Fazer Login para Aceitar
            </Link>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Ainda não tem conta?{' '}
              <Link
                href={registerUrl}
                data-testid="register-to-accept-link"
                style={{ color: 'var(--forest)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Cadastre-se aqui
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated State */}
        {status === 'authenticated' && user && !success && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              data-testid="logged-user-info"
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Conectado como:
              </div>
              <div style={{ fontWeight: 700, color: 'var(--forest)' }}>
                {user.fullName || user.email}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {user.email}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button
                variant="primary"
                data-testid="accept-invitation-btn"
                isLoading={isAccepting}
                onClick={handleAcceptInvitation}
                style={{ height: '2.75rem', fontSize: '0.9375rem', fontWeight: 600 }}
              >
                Aceitar Convite e Entrar na Família
              </Button>

              <Button
                variant="secondary"
                data-testid="cancel-invitation-btn"
                onClick={() => router.push('/')}
                disabled={isAccepting}
                style={{ height: '2.5rem', fontSize: '0.875rem' }}
              >
                Ir para o Início
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
