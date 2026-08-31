'use client';

import React, { useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type { CreatePrayerDto, PrayerResponseDto, PrayerType } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface PrayerJournalProps {
  prayers: PrayerResponseDto[];
  onCreatePrayer: (_data: CreatePrayerDto) => Promise<void> | void;
  onAnswerPrayer: (_id: string, _answeredNote?: string) => Promise<void> | void;
  onArchivePrayer: (_id: string) => Promise<void> | void;
}

export function PrayerJournal({
  prayers,
  onCreatePrayer,
  onAnswerPrayer,
  onArchivePrayer,
}: PrayerJournalProps) {
  const [activeTab, setActiveTab] = useState<PrayerType>('PETITION');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [answeringPrayerId, setAnsweringPrayerId] = useState<string | null>(null);
  const [answeredNote, setAnsweredNote] = useState('');

  // Form State
  const [newType, setNewType] = useState<PrayerType>('PETITION');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePrayers = prayers.filter(
    (p) => !p.archivedAt && p.type === activeTab
  );

  const answeredCount = prayers.filter((p) => !p.archivedAt && p.isAnswered).length;
  const petitionCount = prayers.filter((p) => !p.archivedAt && p.type === 'PETITION').length;
  const gratitudeCount = prayers.filter((p) => !p.archivedAt && p.type === 'GRATITUDE').length;

  const handleOpenCreateModal = (type: PrayerType) => {
    setNewType(type);
    setNewTitle('');
    setNewDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newTitle.trim()) {
      setError('O título do pedido/louvor é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      await onCreatePrayer({
        type: newType,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar oração.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAnswer = async () => {
    if (!answeringPrayerId) return;
    try {
      await onAnswerPrayer(answeringPrayerId, answeredNote.trim() || undefined);
      setAnsweringPrayerId(null);
      setAnsweredNote('');
    } catch {
      // Fallback
    }
  };

  return (
    <div
      data-testid="prayer-journal"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Diário de Oração da Família
            </h2>
            {answeredCount > 0 && (
              <span
                data-testid="answered-prayers-counter"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-emerald-50)',
                  color: 'var(--color-emerald-700)',
                  border: '1px solid var(--color-emerald-100)',
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <AletheiaIcon name="sparkles" size={12} />
                <span>{answeredCount} respondida(s)</span>
              </span>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Intercessões, súplicas ativas e testemunhos de orações respondidas pelo Senhor.
          </p>
        </div>

        <Can action="manage_devotional">
          <button
            type="button"
            data-testid="new-prayer-btn"
            onClick={() => handleOpenCreateModal(activeTab)}
            className="btn btn-primary ui-button ui-button--primary ui-button--sm"
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--color-indigo-700)',
              color: 'var(--text-inverse)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            + Novo Registro
          </button>
        </Can>
      </div>

      {/* Answered Celebration Banner when available in active view */}
      {activePrayers.some((p) => p.isAnswered) && (
        <div
          data-testid="answered-celebration-banner"
          style={{
            backgroundColor: 'var(--color-emerald-50)',
            border: '1px solid var(--color-emerald-100)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ color: 'var(--color-emerald-600)', display: 'flex', alignItems: 'center' }}>
            <AletheiaIcon name="sparkles" size={20} />
          </span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-emerald-700)', display: 'block' }}>
              Celebração de Resposta de Oração!
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-emerald-700)' }}>
              Deus tem sido fiel em ouvir as orações da sua família. Compartilhe o testemunho!
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-light)',
          gap: '1rem',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'PETITION'}
          onClick={() => setActiveTab('PETITION')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'PETITION' ? 700 : 500,
            color: activeTab === 'PETITION' ? 'var(--color-indigo-700)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'PETITION' ? '2px solid var(--color-indigo-700)' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          <AletheiaIcon name="heart" size={14} />
          <span>Pedidos de Oração</span>
          <span
            style={{
              backgroundColor: activeTab === 'PETITION' ? 'var(--color-indigo-50)' : 'var(--sage-soft)',
              color: activeTab === 'PETITION' ? 'var(--color-indigo-700)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.125rem 0.5rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {petitionCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'GRATITUDE'}
          onClick={() => setActiveTab('GRATITUDE')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.5rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'GRATITUDE' ? 700 : 500,
            color: activeTab === 'GRATITUDE' ? 'var(--color-emerald-700)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'GRATITUDE' ? '2px solid var(--color-emerald-700)' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          <AletheiaIcon name="sparkles" size={14} />
          <span>Gratidões & Louvores</span>
          <span
            style={{
              backgroundColor: activeTab === 'GRATITUDE' ? 'var(--color-emerald-50)' : 'var(--sage-soft)',
              color: activeTab === 'GRATITUDE' ? 'var(--color-emerald-700)' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.125rem 0.5rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {gratitudeCount}
          </span>
        </button>
      </div>

      {/* Prayer list */}
      {activePrayers.length === 0 ? (
        <div
          data-testid="prayer-empty-state"
          style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            backgroundColor: 'var(--sage-soft)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-medium)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <AletheiaIcon name="sparkles" size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {activeTab === 'PETITION'
              ? 'Nenhum pedido de oração ativo no momento.'
              : 'Nenhuma gratidão registrada ainda.'}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Adicione um novo registro para que todos possam orar juntos.
          </p>
        </div>
      ) : (
        <div
          data-testid="prayer-list-grid"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
        >
          {activePrayers.map((prayer) => (
            <div
              key={prayer.id}
              data-testid={`prayer-card-${prayer.id}`}
              style={{
                border: prayer.isAnswered ? '1px solid var(--color-emerald-100)' : '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                backgroundColor: prayer.isAnswered ? 'var(--color-emerald-50)' : 'var(--bg-surface)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                position: 'relative',
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.375rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {prayer.title}
                  </h3>

                  {prayer.isAnswered ? (
                    <span
                      data-testid={`prayer-answered-badge-${prayer.id}`}
                      style={{
                        backgroundColor: 'var(--color-emerald-50)',
                        color: 'var(--color-emerald-700)',
                        border: '1px solid var(--color-emerald-100)',
                        padding: '0.125rem 0.625rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <AletheiaIcon name="sparkles" size={12} />
                      <span>Respondida!</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: prayer.type === 'PETITION' ? 'var(--color-indigo-50)' : 'var(--color-emerald-50)',
                        color: prayer.type === 'PETITION' ? 'var(--color-indigo-700)' : 'var(--color-emerald-700)',
                        padding: '0.125rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                      }}
                    >
                      {prayer.type === 'PETITION' ? 'Em Oração' : 'Gratidão'}
                    </span>
                  )}
                </div>

                {prayer.description && (
                  <p
                    style={{
                      margin: '0.25rem 0 0.5rem 0',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {prayer.description}
                  </p>
                )}

                {prayer.answeredNote && (
                  <div
                    data-testid={`prayer-answered-note-${prayer.id}`}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-emerald-100)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-emerald-700)',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
                      <AletheiaIcon name="sparkles" size={14} style={{ color: 'var(--color-emerald-600)' }} />
                      <span>Testemunho / Resposta:</span>
                    </strong>
                    {prayer.answeredNote}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexShrink: 0 }}>
                {!prayer.isAnswered && (
                  <Can action="manage_devotional">
                    <button
                      type="button"
                      data-testid={`answer-prayer-btn-${prayer.id}`}
                      onClick={() => {
                        setAnsweringPrayerId(prayer.id);
                        setAnsweredNote('');
                      }}
                      className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
                      style={{
                        padding: '0.3rem 0.625rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-emerald-700)',
                        borderColor: 'var(--color-emerald-100)',
                        backgroundColor: 'var(--color-emerald-50)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <AletheiaIcon name="check" size={12} />
                      <span>Marcar como Respondida</span>
                    </button>
                  </Can>
                )}

                <Can action="manage_devotional">
                  <button
                    type="button"
                    data-testid={`archive-prayer-btn-${prayer.id}`}
                    onClick={() => {
                      void (async () => {
                        try {
                          await onArchivePrayer(prayer.id);
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : 'Falha ao arquivar oração.');
                        }
                      })();
                    }}
                    className="btn btn-outline-danger ui-button ui-button--ghost ui-button--sm"
                    style={{
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: '1px solid transparent',
                    }}
                  >
                    Arquivar
                  </button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answering Prompt / Modal */}
      {answeringPrayerId && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="answer-prayer-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AletheiaIcon name="sparkles" size={20} style={{ color: 'var(--color-emerald-600)' }} />
              <span>Marcar Oração como Respondida</span>
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Deseja registrar um testemunho ou nota de como Deus respondeu a esta oração na vida da família?
            </p>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="answered-note"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}
              >
                Nota de Agradecimento / Testemunho
              </label>
              <textarea
                id="answered-note"
                data-testid="answered-note-input"
                rows={3}
                value={answeredNote}
                onChange={(e) => setAnsweredNote(e.target.value)}
                placeholder="Ex: Deus supriu a nossa necessidade através de..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary ui-button ui-button--secondary"
                onClick={() => setAnsweringPrayerId(null)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="confirm-answer-btn"
                className="btn btn-primary ui-button ui-button--primary"
                onClick={handleConfirmAnswer}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--color-emerald-600)',
                  color: 'var(--text-inverse)',
                  cursor: 'pointer',
                }}
              >
                Confirmar Resposta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="prayer-form-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {newType === 'PETITION' ? (
                  <>
                    <AletheiaIcon name="heart" size={18} style={{ color: 'var(--color-indigo-700)' }} />
                    <span>Novo Pedido de Oração</span>
                  </>
                ) : (
                  <>
                    <AletheiaIcon name="sparkles" size={18} style={{ color: 'var(--color-emerald-700)' }} />
                    <span>Nova Gratidão / Louvor</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.25rem',
                }}
                aria-label="Fechar"
              >
                <AletheiaIcon name="x" size={18} />
              </button>
            </div>

            {error && (
              <div
                className="alert alert-error"
                role="alert"
                style={{
                  marginBottom: '1rem',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: 'var(--color-rose-50)',
                  border: '1px solid var(--color-rose-100)',
                  color: 'var(--color-rose-700)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={handleCreateSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div className="form-group">
                <label
                  htmlFor="prayer-type"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Tipo
                </label>
                <select
                  id="prayer-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PrayerType)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="PETITION">Pedido de Oração (Petição / Intercessão)</option>
                  <option value="GRATITUDE">Gratidão / Louvor (Ação de Graças)</option>
                </select>
              </div>

              <div className="form-group">
                <label
                  htmlFor="prayer-title"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Título *
                </label>
                <input
                  id="prayer-title"
                  type="text"
                  data-testid="prayer-title-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={newType === 'PETITION' ? 'Ex: Saúde da vovó' : 'Ex: Bênção no trabalho'}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="prayer-description"
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Detalhes / Motivos
                </label>
                <textarea
                  id="prayer-description"
                  rows={3}
                  data-testid="prayer-description-input"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descreva detalhes para oração em família..."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary ui-button ui-button--secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'var(--bg-surface)',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="prayer-submit-btn"
                  className="btn btn-primary ui-button ui-button--primary"
                  disabled={loading}
                  style={{
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--color-indigo-700)',
                    color: 'var(--text-inverse)',
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
