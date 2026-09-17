'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon, Alert, Button } from '@aletheia/ui';
import type { LearnerCompetencyAchievementResponseDto } from '@aletheia/contracts';

interface LearnerAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  learnerId: string;
  learnerName: string;
}

export function LearnerAchievementsModal({
  isOpen,
  onClose,
  familyId,
  learnerId,
  learnerName,
}: LearnerAchievementsModalProps) {
  const [achievements, setAchievements] = useState<LearnerCompetencyAchievementResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !familyId || !learnerId) return;

    async function loadAchievements() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/v1/families/${familyId}/curriculum/achievements?learnerId=${learnerId}`,
          { credentials: 'include' }
        );
        if (!res.ok) {
          throw new Error('Falha ao carregar as conquistas do educando.');
        }
        const data = await res.json();
        setAchievements(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar conquistas.');
      } finally {
        setLoading(false);
      }
    }

    void loadAchievements();
  }, [isOpen, familyId, learnerId]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="learner-achievements-modal"
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
          maxWidth: '42rem',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--gold-dark)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Mural de Conquistas & Medalhas
            </span>
            <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest)' }}>
              Conquistas de {learnerName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {error && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Carregando conquistas e medalhas...
            </div>
          ) : achievements.length === 0 ? (
            <div
              data-testid="achievements-empty-state"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                border: '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏅</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--forest)', fontSize: '1.125rem' }}>
                Nenhuma conquista ou medalha desbloqueada ainda
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', maxWidth: '28rem', marginInline: 'auto' }}>
                Conforme as evidências de aprendizagem do educando forem registradas e aprovadas pelos responsáveis, novas medalhas de competência surgirão aqui automaticamente!
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {achievements.map((ach) => {
                const snapshot = (ach.evidenceSnapshot as Record<string, any>) || {};
                const title = snapshot.competencyTitle || `Competência v${ach.competencyVersion}`;
                const domain = snapshot.domainName || 'Competência Geral';
                const evidenceCount = snapshot.approvedEvidenceCount;

                return (
                  <div
                    key={ach.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      padding: '1.25rem',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1.5px solid var(--gold-light, #fef08a)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--gold, #eab308)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        boxShadow: '0 2px 8px rgba(234, 179, 8, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      🏅
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--sage-soft)',
                            color: 'var(--forest)',
                          }}
                        >
                          {domain}
                        </span>
                        {evidenceCount && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            • Comprovado por {evidenceCount} {evidenceCount === 1 ? 'evidência' : 'evidências'}
                          </span>
                        )}
                      </div>

                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--forest)' }}>
                        {title}
                      </h4>

                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Conquistado em {new Date(ach.achievedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
