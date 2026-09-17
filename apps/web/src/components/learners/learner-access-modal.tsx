'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal } from '@aletheia/ui';
import type { LearnerAccessCodeDto, LearnerAccessGrantDto, LearnerResponseDto } from '@aletheia/contracts';

export interface LearnerAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  learner: LearnerResponseDto | null;
  familyId: string;
}

export function LearnerAccessModal({
  isOpen,
  onClose,
  learner,
  familyId,
}: LearnerAccessModalProps) {
  const [grant, setGrant] = useState<LearnerAccessGrantDto | null>(null);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !learner || !familyId) {
      setGrant(null);
      setIssuedCode(null);
      setError(null);
      return;
    }

    let isMounted = true;
    async function fetchStatus() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/families/${familyId}/learners/${learner!.id}/access`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data: LearnerAccessGrantDto = await res.json();
          if (isMounted) setGrant(data);
        } else if (res.status === 404) {
          if (isMounted) setGrant(null);
        } else {
          const err = await res.json().catch(() => ({}));
          if (isMounted) setError(err.message || 'Falha ao buscar status do acesso.');
        }
      } catch {
        if (isMounted) setError('Erro de conexão ao buscar status de acesso.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [isOpen, learner, familyId]);

  if (!learner) return null;

  const displayName = learner.preferredName || learner.firstName;
  const hasGrant = Boolean(grant && grant.createdAt);

  const handleGrant = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/families/${familyId}/learners/${learner.id}/access/grant`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao habilitar acesso.');
      }
      const data: LearnerAccessCodeDto = await res.json();
      setGrant(data.grant);
      setIssuedCode(data.code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao habilitar acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/families/${familyId}/learners/${learner.id}/access/regenerate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao regenerar código de acesso.');
      }
      const data: LearnerAccessCodeDto = await res.json();
      setGrant(data.grant);
      setIssuedCode(data.code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao regenerar código de acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = async (enable: boolean) => {
    const action = enable ? 'enable' : 'revoke';
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/families/${familyId}/learners/${learner.id}/access/${action}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Falha ao ${enable ? 'reativar' : 'desativar'} acesso.`);
      }
      const updated: LearnerAccessGrantDto = await res.json();
      setGrant(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao alterar status de acesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!issuedCode) return;
    void navigator.clipboard?.writeText(issuedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Acesso do Educando — ${displayName}`}
      maxWidth="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div data-testid="learner-access-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <Alert variant="error" data-testid="access-error-alert">
            {error}
          </Alert>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Status da Credencial:
          </span>
          {hasGrant && grant?.enabled ? (
            <Badge variant="emerald" size="sm">Acesso Ativo</Badge>
          ) : hasGrant && !grant?.enabled ? (
            <Badge variant="rose" size="sm">Acesso Desativado</Badge>
          ) : (
            <Badge variant="slate" size="sm">Não Configurado</Badge>
          )}
        </div>

        {issuedCode && (
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--sage-soft)',
              border: '1.5px solid var(--forest)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Novo Código PIN de Acesso
            </span>
            <div
              data-testid="access-code-display"
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--forest)',
                letterSpacing: '0.2em',
                margin: '0.75rem 0',
              }}
            >
              {issuedCode}
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Guarde este código. Por motivos de segurança, ele é exibido apenas uma vez.
            </p>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? 'Código Copiado!' : 'Copiar Código'}
            </Button>
          </div>
        )}

        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          O acesso do educando permite que ele entre no <strong>Modo Aluno</strong> pelo endereço{' '}
          <a href="/aluno" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--forest)', textDecoration: 'underline' }}>
            /aluno
          </a>{' '}
          para visualizar a agenda diária e registrar a conclusão das suas tarefas de estudo de forma autônoma.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
          {!hasGrant ? (
            <Button
              variant="primary"
              data-testid="grant-access-btn"
              onClick={handleGrant}
              isLoading={loading}
            >
              Habilitar Acesso do Educando
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                data-testid="regenerate-access-btn"
                onClick={handleRegenerate}
                isLoading={loading}
              >
                Regenerar Novo Código
              </Button>

              {grant?.enabled ? (
                <Button
                  variant="danger"
                  data-testid="revoke-access-btn"
                  onClick={() => handleToggleEnable(false)}
                  isLoading={loading}
                >
                  Desativar Acesso
                </Button>
              ) : (
                <Button
                  variant="primary"
                  data-testid="enable-access-btn"
                  onClick={() => handleToggleEnable(true)}
                  isLoading={loading}
                >
                  Reativar Acesso
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
