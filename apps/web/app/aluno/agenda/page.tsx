'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button } from '@aletheia/ui';
import {
  LearnerProgressView,
  LearnerEvidenceModal,
  type LearnerTrackedCompetency,
} from '../../../src/components/learner-portal';

interface AgendaItem {
  id: string;
  lessonPlanId?: string;
  title: string;
  subjectName?: string | null;
  subjectColor?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  isCompleted?: boolean;
}

interface AgendaData {
  date: string;
  items: AgendaItem[];
}

export default function LearnerAgendaPage() {
  const router = useRouter();

  const [learnerId, setLearnerId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'agenda' | 'progress'>('agenda');

  // Agenda State
  const [agenda, setAgenda] = useState<AgendaData | null>(null);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [agendaError, setAgendaError] = useState<string | null>(null);

  // Progress State
  const [trackings, setTrackings] = useState<LearnerTrackedCompetency[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Evidence Modal State
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedTrackingIdForEvidence, setSelectedTrackingIdForEvidence] = useState<string | null>(null);

  // Global Celebration / Notification
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('learner_session');
      if (!stored) {
        router.replace('/aluno/login');
        return;
      }
      const parsed = JSON.parse(stored);
      if (!parsed?.learnerId) {
        router.replace('/aluno/login');
        return;
      }
      setLearnerId(parsed.learnerId);
      setDisplayName(parsed.displayName || 'Educando');
      void loadAgenda(parsed.learnerId);
    } catch {
      router.replace('/aluno/login');
    }
  }, []);

  const loadAgenda = async (id: string) => {
    try {
      setLoadingAgenda(true);
      setAgendaError(null);
      const res = await fetch(`/api/v1/learner-access/learners/${id}/agenda`, {
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('learner_session');
        router.replace('/aluno/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Falha ao carregar as atividades de hoje.');
      }
      const data = await res.json();
      setAgenda(data);
    } catch (err: unknown) {
      setAgendaError(err instanceof Error ? err.message : 'Erro ao carregar agenda.');
    } finally {
      setLoadingAgenda(false);
    }
  };

  const loadProgress = async (id: string) => {
    try {
      setLoadingProgress(true);
      setProgressError(null);
      const res = await fetch(`/api/v1/learner-access/learners/${id}/progress?status=ACTIVE`, {
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('learner_session');
        router.replace('/aluno/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Falha ao carregar o progresso de competências.');
      }
      const data = await res.json();
      setTrackings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setProgressError(err instanceof Error ? err.message : 'Erro ao carregar progresso.');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleTabChange = (tab: 'agenda' | 'progress') => {
    setActiveTab(tab);
    if (tab === 'progress' && learnerId) {
      void loadProgress(learnerId);
    }
  };

  const handleOpenEvidenceModal = (trackingId?: string) => {
    setSelectedTrackingIdForEvidence(trackingId ?? null);
    setIsEvidenceModalOpen(true);
  };

  const handleEvidenceSuccess = (message: string) => {
    setCelebrationMsg(message);
    if (learnerId) {
      void loadProgress(learnerId);
    }
    setTimeout(() => {
      setCelebrationMsg((current) => (current === message ? null : current));
    }, 6000);
  };

  const handleCompleteLesson = async (item: AgendaItem) => {
    const targetLessonId = item.lessonPlanId || item.id;
    try {
      setCompletingId(targetLessonId);
      setAgendaError(null);
      const res = await fetch(
        `/api/v1/learner-access/learners/${learnerId}/lessons/${targetLessonId}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao registrar conclusão da lição.');
      }

      setAgenda((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.lessonPlanId === targetLessonId || it.id === targetLessonId
              ? { ...it, isCompleted: true }
              : it
          ),
        };
      });

      const successMsg = `Parabéns, ${displayName}! Lição "${item.title}" concluída com sucesso! 🌟`;
      setCelebrationMsg(successMsg);
      setTimeout(() => {
        setCelebrationMsg((current) => (current === successMsg ? null : current));
      }, 4000);
    } catch (err: unknown) {
      setAgendaError(err instanceof Error ? err.message : 'Falha ao concluir lição.');
    } finally {
      setCompletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/learner-access/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('learner_session');
      router.push('/aluno/login');
    }
  };

  const completedCount = agenda?.items?.filter((i) => i.isCompleted).length ?? 0;
  const totalCount = agenda?.items?.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      data-testid="learner-agenda-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Learner Top Header */}
      <header
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-light)',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--forest)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.125rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--gold-dark)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Portal do Aluno
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--forest)' }}>
              {displayName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            type="button"
            variant="secondary"
            data-testid="header-open-evidence-btn"
            onClick={() => handleOpenEvidenceModal()}
            style={{ fontSize: '0.875rem' }}
          >
            Enviar Trabalho 📤
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid var(--border-light)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '52rem', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {celebrationMsg && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert variant="success" data-testid="celebration-alert">
              {celebrationMsg}
            </Alert>
          </div>
        )}

        {/* Tab Navigation Selector */}
        <div
          role="tablist"
          aria-label="Navegação do Portal do Aluno"
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid var(--border-light)',
            marginBottom: '2rem',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'agenda'}
            data-testid="tab-agenda"
            onClick={() => handleTabChange('agenda')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'agenda' ? '3px solid var(--forest)' : '3px solid transparent',
              color: activeTab === 'agenda' ? 'var(--forest)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              transition: 'all 0.15s ease',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📅</span> Minha Agenda
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'progress'}
            data-testid="tab-progress"
            onClick={() => handleTabChange('progress')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'progress' ? '3px solid var(--forest)' : '3px solid transparent',
              color: activeTab === 'progress' ? 'var(--forest)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              transition: 'all 0.15s ease',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>🌱</span> Meu Progresso
          </button>
        </div>

        {/* Tab 1: Minha Agenda */}
        {activeTab === 'agenda' && (
          <div data-testid="tab-panel-agenda">
            {agendaError && (
              <div style={{ marginBottom: '1.5rem' }}>
                <Alert variant="error">{agendaError}</Alert>
              </div>
            )}

            {/* Progress & Welcome banner */}
            <section
              style={{
                backgroundColor: 'var(--forest)',
                color: '#ffffff',
                padding: '1.75rem',
                borderRadius: 'var(--radius-xl)',
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Agenda de Hoje
                </h1>
                <p style={{ margin: '0.375rem 0 1.25rem 0', opacity: 0.85, fontSize: '0.9375rem' }}>
                  {agenda?.date
                    ? new Date(`${agenda.date}T12:00:00Z`).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    : 'Carregando suas lições...'}
                </p>

                {totalCount > 0 && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem',
                        marginBottom: '0.375rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>Progresso do dia</span>
                      <span>
                        {completedCount} de {totalCount} concluídas ({progressPercent}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          backgroundColor: 'var(--gold)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Lessons List */}
            <section>
              {loadingAgenda ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Carregando atividades...
                </div>
              ) : !agenda || !agenda.items || agenda.items.length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--forest)', fontSize: '1.25rem' }}>
                    Tudo tranquilo por hoje!
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    Nenhuma lição pendente na sua agenda hoje. Aproveite para descansar ou ler um bom livro.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(agenda.items || []).map((item) => {
                    const lessonKey = item.lessonPlanId || item.id;
                    const isCompleted = Boolean(item.isCompleted);
                    const isWorking = completingId === lessonKey;

                    return (
                      <article
                        key={item.id}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid',
                          borderColor: isCompleted ? 'var(--sage)' : 'var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1.5rem',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.2s ease',
                          opacity: isCompleted ? 0.85 : 1,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                            {item.subjectName && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: item.subjectColor ? `${item.subjectColor}20` : 'var(--sage-soft)',
                                  color: item.subjectColor || 'var(--forest)',
                                }}
                              >
                                {item.subjectName}
                              </span>
                            )}
                            {item.startTime && (
                              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                              </span>
                            )}
                          </div>

                          <h2
                            style={{
                              margin: 0,
                              fontSize: '1.125rem',
                              fontWeight: 600,
                              color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {item.title}
                          </h2>
                        </div>

                        <div>
                          {isCompleted ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: 'var(--sage-soft)',
                                color: 'var(--forest)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>✓</span> Concluída
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="primary"
                              data-testid={`complete-lesson-btn-${lessonKey}`}
                              isLoading={isWorking}
                              onClick={() => handleCompleteLesson(item)}
                              style={{
                                minWidth: '9.5rem',
                                height: '2.5rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                              }}
                            >
                              Concluir Lição
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Meu Progresso */}
        {activeTab === 'progress' && (
          <div data-testid="tab-panel-progress">
            <LearnerProgressView
              learnerId={learnerId}
              trackings={trackings}
              loading={loadingProgress}
              error={progressError}
              onOpenEvidenceModal={handleOpenEvidenceModal}
            />
          </div>
        )}
      </main>

      {/* Evidence Submission Modal */}
      <LearnerEvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        learnerId={learnerId}
        trackings={trackings}
        initialTrackingId={selectedTrackingIdForEvidence}
        onSuccess={handleEvidenceSuccess}
      />
    </div>
  );
}
