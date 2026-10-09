'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal } from '@aletheia/ui';
import type {
  ConsentComplianceCheckDto,
  LearnerAccessCodeDto,
  LearnerAccessGrantDto,
  LearnerResponseDto,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface LearnerAccessModalProps {
  isOpen: boolean;
  onClose(): void;
  learner: LearnerResponseDto | null;
  familyId: string;
}

export function LearnerAccessModal({
  isOpen,
  onClose,
  learner,
  familyId,
}: LearnerAccessModalProps) {
  const { t } = useLocale();
  const [grant, setGrant] = useState<LearnerAccessGrantDto | null>(null);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedUrl, setIssuedUrl] = useState<string | null>(null);
  const [compliance, setCompliance] = useState<ConsentComplianceCheckDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [grantingConsentId, setGrantingConsentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentSuccess, setConsentSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchCompliance = async (learnerId: string) => {
    try {
      const res = await fetch(
        `/api/v1/families/${familyId}/consents/compliance?learnerId=${learnerId}`,
        { credentials: 'include' }
      );
      if (res && res.ok) {
        const data: ConsentComplianceCheckDto = await res.json();
        setCompliance(data);
      }
    } catch {
      // Compliance check is non-blocking
    }
  };

  useEffect(() => {
    if (!isOpen || !learner || !familyId) {
      setGrant(null);
      setIssuedCode(null);
      setIssuedUrl(null);
      setCompliance(null);
      setError(null);
      setConsentSuccess(null);
      setCopied(false);
      setCopiedUrl(false);
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
        if (res && res.ok) {
          const data: LearnerAccessGrantDto = await res.json();
          if (isMounted) {
            setGrant(data);
            if (data.accessUrl) {
              const fullUrl = typeof window !== 'undefined' && window.location.origin
                ? `${window.location.origin}${data.accessUrl}`
                : data.accessUrl;
              setIssuedUrl(fullUrl);
            }
          }
        } else if (res && res.status === 404) {
          if (isMounted) setGrant(null);
        } else if (res) {
          const err = await res.json().catch(() => ({}));
          if (isMounted) setError(err.message || t('learners.accessModal.errorFetch'));
        }
      } catch {
        if (isMounted) setError(t('learners.accessModal.errorConnection'));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchStatus();
    void fetchCompliance(learner.id);

    return () => {
      isMounted = false;
    };
  }, [isOpen, learner, familyId, t]);

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
        throw new Error(err.message || t('learners.accessModal.errorEnable'));
      }
      const data: LearnerAccessCodeDto = await res.json();
      setGrant(data.grant);
      setIssuedCode(data.code);
      if (data.accessUrl) {
        const fullUrl = typeof window !== 'undefined' && window.location.origin
          ? `${window.location.origin}${data.accessUrl}`
          : data.accessUrl;
        setIssuedUrl(fullUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('learners.accessModal.errorEnable'));
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
        throw new Error(err.message || t('learners.accessModal.errorRegenerate'));
      }
      const data: LearnerAccessCodeDto = await res.json();
      setGrant(data.grant);
      setIssuedCode(data.code);
      if (data.accessUrl) {
        const fullUrl = typeof window !== 'undefined' && window.location.origin
          ? `${window.location.origin}${data.accessUrl}`
          : data.accessUrl;
        setIssuedUrl(fullUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('learners.accessModal.errorRegenerate'));
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
        throw new Error(err.message || t('learners.accessModal.errorToggle'));
      }
      const updated: LearnerAccessGrantDto = await res.json();
      setGrant(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('learners.accessModal.errorToggle'));
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async (definitionId: string) => {
    try {
      setGrantingConsentId(definitionId);
      setError(null);
      const res = await fetch(`/api/v1/families/${familyId}/consents/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          consentDefinitionId: definitionId,
          learnerId: learner.id,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('learners.accessModal.errorConsent'));
      }
      setConsentSuccess(t('learners.accessModal.consentSuccess'));
      await fetchCompliance(learner.id);
      setTimeout(() => setConsentSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('learners.accessModal.errorConsent'));
    } finally {
      setGrantingConsentId(null);
    }
  };

  const handleCopy = () => {
    if (!issuedCode) return;
    void navigator.clipboard?.writeText(issuedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyUrl = () => {
    if (!issuedUrl) return;
    void navigator.clipboard?.writeText(issuedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('learners.accessModal.title', { name: displayName })}
      maxWidth="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          {t('learners.accessModal.close')}
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
            {t('learners.accessModal.credentialStatus')}
          </span>
          {hasGrant && grant?.enabled ? (
            <Badge variant="emerald" size="sm">{t('learners.accessModal.statusActive')}</Badge>
          ) : hasGrant && !grant?.enabled ? (
            <Badge variant="rose" size="sm">{t('learners.accessModal.statusDisabled')}</Badge>
          ) : (
            <Badge variant="slate" size="sm">{t('learners.accessModal.statusNotConfigured')}</Badge>
          )}
        </div>

        {/* Seção Privacidade & Consentimento do Menor (LGPD) */}
        <div
          data-testid="learner-consent-section"
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)' }}>
              {t('learners.accessModal.lgpdSectionTitle')}
            </span>
            {compliance?.compliant ? (
              <Badge variant="emerald" size="sm" data-testid="consent-compliant-badge">
                {t('learners.accessModal.termsAccepted')}
              </Badge>
            ) : (
              <Badge variant="amber" size="sm" data-testid="consent-pending-badge">
                {t('learners.accessModal.consentPending')}
              </Badge>
            )}
          </div>

          {consentSuccess && (
            <Alert variant="success" data-testid="consent-success-alert">
              {consentSuccess}
            </Alert>
          )}

          {compliance && !compliance.compliant && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Alert variant="warning" data-testid="consent-pending-alert">
                {t('learners.accessModal.consentWarning')}
              </Alert>

              {compliance.pendingMandatoryTerms && compliance.pendingMandatoryTerms.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {compliance.pendingMandatoryTerms.map((term) => (
                    <div
                      key={term.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.75rem',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {term.title} (v{term.version})
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        data-testid={`grant-consent-btn-${term.id}`}
                        isLoading={grantingConsentId === term.id}
                        onClick={() => handleGrantConsent(term.id)}
                      >
                        {t('learners.accessModal.grantConsent')}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  data-testid="grant-consent-btn"
                  isLoading={grantingConsentId === 'default'}
                  onClick={() => handleGrantConsent('00000000-0000-0000-0000-000000000001')}
                >
                  {t('learners.accessModal.grantConsent')}
                </Button>
              )}
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {t('learners.accessModal.privacyCenterHint')}{' '}
            <a
              href="/settings/privacy"
              data-testid="privacy-settings-link"
              style={{ color: 'var(--forest)', fontWeight: 600, textDecoration: 'underline' }}
            >
              {t('learners.accessModal.privacyCenterLink')}
            </a>.
          </div>
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
              {t('learners.accessModal.pinTitle')}
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
              {t('learners.accessModal.pinNotice')}
            </p>
            <Button variant="secondary" size="sm" data-testid="copy-access-code-btn" onClick={handleCopy}>
              {copied ? t('learners.accessModal.copied') : t('learners.accessModal.copyCode')}
            </Button>
          </div>
        )}

        {issuedUrl && hasGrant && grant?.enabled && (
          <div
            data-testid="learner-access-url-section"
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1.5px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--forest)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '0.375rem',
              }}
            >
              {t('learners.accessModal.directLinkTitle')}
            </span>
            <div
              data-testid="access-url-display"
              style={{
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-mono, monospace)',
                wordBreak: 'break-all',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-canvas)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                marginBottom: '0.75rem',
              }}
            >
              {issuedUrl}
            </div>
            <Button
              variant="primary"
              size="sm"
              data-testid="copy-access-url-btn"
              onClick={handleCopyUrl}
            >
              {copiedUrl ? t('learners.accessModal.urlCopied') : t('learners.accessModal.copyUrl')}
            </Button>
          </div>
        )}

        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {t('learners.accessModal.studentModeExplanation')}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
          {!hasGrant ? (
            <Button
              variant="primary"
              data-testid="grant-access-btn"
              onClick={handleGrant}
              isLoading={loading}
            >
              {t('learners.accessModal.enableAccess')}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                data-testid="regenerate-access-btn"
                onClick={handleRegenerate}
                isLoading={loading}
              >
                {t('learners.accessModal.regenerateCode')}
              </Button>

              {grant?.enabled ? (
                <Button
                  variant="danger"
                  data-testid="revoke-access-btn"
                  onClick={() => handleToggleEnable(false)}
                  isLoading={loading}
                >
                  {t('learners.accessModal.disableAccess')}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  data-testid="enable-access-btn"
                  onClick={() => handleToggleEnable(true)}
                  isLoading={loading}
                >
                  {t('learners.accessModal.reactivateAccess')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
