'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card } from '@aletheia/ui';
import type {
  FamilyConsentOverviewDto,
  TermConsentOverviewDto,
  ConsentDefinitionResponseDto,
  ConsentComplianceCheckDto,
} from '@aletheia/contracts';

export interface LearnerItem {
  id: string;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  displayName?: string | null | undefined;
  preferredName?: string | null | undefined;
}

export interface PrivacyConsentSettingsProps {
  familyId: string;
  learners?: LearnerItem[];
}

interface ModalTarget {
  mode: 'GRANT' | 'REVOKE' | 'VIEW';
  definition: ConsentDefinitionResponseDto;
  learnerId?: string | undefined;
  learnerName?: string | undefined;
}

export function PrivacyConsentSettings({ familyId, learners = [] }: PrivacyConsentSettingsProps) {
  const [overview, setOverview] = useState<FamilyConsentOverviewDto | null>(null);
  const [compliance, setCompliance] = useState<ConsentComplianceCheckDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalTarget | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadOverview = async () => {
    if (!familyId) return;
    try {
      setLoading(true);
      setError(null);
      const [consentsRes, compRes] = await Promise.all([
        fetch(`/api/v1/families/${familyId}/consents`, { credentials: 'include' }),
        fetch(`/api/v1/families/${familyId}/consents/compliance`, { credentials: 'include' }),
      ]);

      if (!consentsRes.ok) {
        throw new Error('Falha ao carregar termos e consentimentos.');
      }
      const data: FamilyConsentOverviewDto = await consentsRes.json();
      setOverview(data);

      if (compRes.ok) {
        const compData: ConsentComplianceCheckDto = await compRes.json();
        setCompliance(compData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, [familyId]);

  const handleGrant = async () => {
    if (!activeModal) return;
    try {
      setModalLoading(true);
      setModalError(null);
      const res = await fetch(`/api/v1/families/${familyId}/consents/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          consentDefinitionId: activeModal.definition.id,
          definitionId: activeModal.definition.id,
          learnerId: activeModal.learnerId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao registrar consentimento.');
      }

      setActiveModal(null);
      await loadOverview();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao processar consentimento.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!activeModal) return;
    try {
      setModalLoading(true);
      setModalError(null);
      const res = await fetch(`/api/v1/families/${familyId}/consents/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          consentDefinitionId: activeModal.definition.id,
          definitionId: activeModal.definition.id,
          learnerId: activeModal.learnerId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao revogar consentimento.');
      }

      setActiveModal(null);
      await loadOverview();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Erro ao processar revogação.');
    } finally {
      setModalLoading(false);
    }
  };

  const terms = overview?.terms || [];
  const familyTerms = terms.filter((d: TermConsentOverviewDto) => d.definition.scope === 'FAMILY');
  const learnerTerms = terms.filter((d: TermConsentOverviewDto) => d.definition.scope === 'LEARNER');
  const isCompliant = compliance ? compliance.compliant : terms.every((t) => !t.definition.mandatory || t.status === 'ACTIVE');

  return (
    <div data-testid="privacy-consent-settings" style={{ display: 'grid', gap: '2rem' }}>
      {/* Overview Banner */}
      <Card style={{ padding: '1.75rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)', margin: 0 }}>
              Privacidade & Termos de Consentimento (LGPD)
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '42rem' }}>
              Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018, Art. 14), o tratamento de dados pessoais de crianças e adolescentes é realizado com base no consentimento inequívoco de pelo menos um dos pais ou responsável legal.
            </p>
          </div>

          <div>
            <span
              data-testid="compliance-status-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.875rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                backgroundColor: isCompliant ? 'var(--sage-soft)' : '#fef3c7',
                color: isCompliant ? 'var(--forest)' : '#92400e',
                border: `1px solid ${isCompliant ? 'var(--sage)' : '#f59e0b'}`,
              }}
            >
              <span>{isCompliant ? '✓' : '⚠️'}</span>
              {isCompliant ? 'Conformidade LGPD: Em dia' : 'Termos Pendentes de Aceite'}
            </span>
          </div>
        </div>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {loading && !overview ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Carregando catálogo de privacidade...
        </div>
      ) : (
        <>
          {/* Termos da Família */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Termos da Família
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                }}
              >
                Escopo Família
              </span>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {familyTerms.map((item: TermConsentOverviewDto) => {
                const def = item.definition;
                const status = item.familyStatus || item.status || 'PENDING';
                const isItemCompliant = status === 'ACTIVE';

                return (
                  <Card key={def.id} style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: '18rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {def.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                            v{def.version}
                          </span>
                          {def.mandatory && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase' }}>
                              (Obrigatório)
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {def.description}
                        </p>
                        {item.lastRecord && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Aceito em {new Date(item.lastRecord.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.625rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: isItemCompliant ? 'var(--sage-soft)' : '#fef3c7',
                            color: isItemCompliant ? 'var(--forest)' : '#92400e',
                          }}
                        >
                          {status === 'ACTIVE' && '✓ Ativo'}
                          {status === 'OUTDATED' && '⚠️ Versão Desatualizada'}
                          {status === 'PENDING' && 'Pendente'}
                          {status === 'REVOKED' && 'Revogado'}
                        </span>

                        {!isItemCompliant ? (
                          <Button
                            variant="primary"
                            size="sm"
                            data-testid={`grant-consent-btn-${def.id}`}
                            onClick={() => setActiveModal({ mode: 'GRANT', definition: def })}
                          >
                            Ler e Assinar
                          </Button>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setActiveModal({ mode: 'VIEW', definition: def })}
                            >
                              Ver Termo
                            </Button>
                            {!def.mandatory && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setActiveModal({ mode: 'REVOKE', definition: def })}
                              >
                                Revogar
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Termos dos Educandos */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Consentimento de Menores (Educandos)
              </h3>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                }}
              >
                Por Educando
              </span>
            </div>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {learnerTerms.map((item: TermConsentOverviewDto) => {
                const def = item.definition;
                const learnerMap = new Map((item.learnerStatuses || []).map((ls) => [ls.learnerId, ls]));

                return (
                  <Card key={def.id} style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {def.title}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                          v{def.version}
                        </span>
                        {def.mandatory && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase' }}>
                            (Obrigatório)
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {def.description}
                      </p>
                    </div>

                    {/* Learner rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', backgroundColor: 'var(--bg-canvas)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)' }}>
                      {learners.length === 0 ? (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          Nenhum educando cadastrado na família.
                        </div>
                      ) : (
                        learners.map((learner) => {
                          const ls = learnerMap.get(learner.id);
                          const lStatus = ls?.status || 'PENDING';
                          const isLearnerCompliant = lStatus === 'ACTIVE';
                          const learnerName = learner.displayName || learner.preferredName || learner.firstName || 'Educando';

                          return (
                            <div
                              key={learner.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0',
                                borderBottom: '1px solid var(--border-light)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--forest)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {learnerName.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {learnerName}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span
                                  data-testid={`learner-consent-status-${learner.id}`}
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: isLearnerCompliant ? 'var(--sage-soft)' : '#fef3c7',
                                    color: isLearnerCompliant ? 'var(--forest)' : '#92400e',
                                  }}
                                >
                                  {lStatus === 'ACTIVE' && '✓ Ativo'}
                                  {lStatus === 'OUTDATED' && '⚠️ Desatualizado'}
                                  {lStatus === 'PENDING' && 'Pendente'}
                                  {lStatus === 'REVOKED' && 'Revogado'}
                                </span>

                                {!isLearnerCompliant ? (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    data-testid={`grant-consent-btn-${def.id}-${learner.id}`}
                                    onClick={() =>
                                      setActiveModal({
                                        mode: 'GRANT',
                                        definition: def,
                                        learnerId: learner.id,
                                        learnerName,
                                      })
                                    }
                                  >
                                    Assinar por {learnerName}
                                  </Button>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        setActiveModal({
                                          mode: 'VIEW',
                                          definition: def,
                                          learnerId: learner.id,
                                          learnerName,
                                        })
                                      }
                                    >
                                      Ver
                                    </Button>
                                    {!def.mandatory && (
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                          setActiveModal({
                                            mode: 'REVOKE',
                                            definition: def,
                                            learnerId: learner.id,
                                            learnerName,
                                          })
                                        }
                                      >
                                        Revogar
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Consent Modal */}
      {activeModal && (
        <div
          data-testid="consent-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '38rem',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase' }}>
                  {activeModal.mode === 'GRANT'
                    ? 'Aceite de Termo de Consentimento'
                    : activeModal.mode === 'REVOKE'
                    ? 'Revogação de Consentimento'
                    : 'Visualização de Termo'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Versão {activeModal.definition.version}.0
                </span>
              </div>
              <h2 style={{ margin: '0.375rem 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)' }}>
                {activeModal.definition.title}
              </h2>
              {activeModal.learnerName && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Aplicável ao educando menor: <strong>{activeModal.learnerName}</strong>
                </div>
              )}
            </div>

            <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
              {modalError && (
                <div style={{ marginBottom: '1rem' }}>
                  <Alert variant="error">{modalError}</Alert>
                </div>
              )}

              {/* Term content */}
              <div
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '16rem',
                  overflowY: 'auto',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                }}
              >
                {activeModal.definition.content}
              </div>

              {activeModal.mode === 'GRANT' && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    backgroundColor: 'var(--sage-soft)',
                    border: '1px solid var(--sage)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    color: 'var(--forest)',
                    lineHeight: '1.5',
                  }}
                >
                  <strong>Declaração de Consentimento Legal:</strong>
                  <br />
                  Na qualidade de pai, mãe ou responsável legal devidamente investido do pátrio poder / poder familiar (Art. 14 da LGPD), declaro que li, compreendi e manifesto meu consentimento específico e em destaque para o tratamento dos dados pessoais conforme descrito neste termo.
                </div>
              )}

              {activeModal.mode === 'REVOKE' && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #f87171',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    color: '#991b1b',
                    lineHeight: '1.5',
                  }}
                >
                  <strong>Atenção:</strong>
                  <br />
                  A revogação do consentimento interrompe o tratamento de dados autorizado por este termo a partir deste momento. Dados anteriormente tratados sob amparo legal continuarão resguardados para cumprimento de obrigação legal ou regulatória.
                </div>
              )}
            </div>

            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <Button
                variant="secondary"
                disabled={modalLoading}
                onClick={() => setActiveModal(null)}
              >
                {activeModal.mode === 'VIEW' ? 'Fechar' : 'Cancelar'}
              </Button>

              {activeModal.mode === 'GRANT' && (
                <Button
                  variant="primary"
                  data-testid="confirm-grant-consent-btn"
                  isLoading={modalLoading}
                  onClick={handleGrant}
                >
                  Confirmar e Assinar Termo
                </Button>
              )}

              {activeModal.mode === 'REVOKE' && (
                <Button
                  variant="danger"
                  data-testid="confirm-revoke-consent-btn"
                  isLoading={modalLoading}
                  onClick={handleRevoke}
                >
                  Confirmar Revogação
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
