'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  PartyPopper,
  Heart,
  Sun,
  Star,
  Check,
  X,
} from 'lucide-react';
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
        backgroundColor: '#FFFFFF',
        borderRadius: '1rem',
        border: '1px solid #E2E8F0',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.05)',
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
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
              Diário de Oração da Família
            </h2>
            {answeredCount > 0 && (
              <span
                data-testid="answered-prayers-counter"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Sparkles size={12} />
                <span>{answeredCount} respondida(s)</span>
              </span>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748B' }}>
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
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#4338CA',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(67, 56, 202, 0.2)',
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
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ color: '#059669', display: 'flex', alignItems: 'center' }}>
            <PartyPopper size={20} />
          </span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065F46', display: 'block' }}>
              Celebração de Resposta de Oração!
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#047857' }}>
              Deus tem sido fiel em ouvir as orações da sua família. Compartilhe o testemunho!
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
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
            color: activeTab === 'PETITION' ? '#4338CA' : '#64748B',
            borderBottom: activeTab === 'PETITION' ? '2px solid #4338CA' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          <Heart size={14} />
          <span>Pedidos de Oração</span>
          <span
            style={{
              backgroundColor: activeTab === 'PETITION' ? '#EEF2FF' : '#F1F5F9',
              color: activeTab === 'PETITION' ? '#4338CA' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
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
            color: activeTab === 'GRATITUDE' ? '#047857' : '#64748B',
            borderBottom: activeTab === 'GRATITUDE' ? '2px solid #047857' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          <Sun size={14} />
          <span>Gratidões & Louvores</span>
          <span
            style={{
              backgroundColor: activeTab === 'GRATITUDE' ? '#ECFDF5' : '#F1F5F9',
              color: activeTab === 'GRATITUDE' ? '#047857' : '#64748B',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
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
            backgroundColor: '#F8FAFC',
            borderRadius: '0.75rem',
            border: '1px dashed #CBD5E1',
            color: '#64748B',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <Sparkles size={32} style={{ color: '#94A3B8' }} />
          </div>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {activeTab === 'PETITION'
              ? 'Nenhum pedido de oração ativo no momento.'
              : 'Nenhuma gratidão registrada ainda.'}
          </p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#94A3B8' }}>
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
                border: prayer.isAnswered ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                backgroundColor: prayer.isAnswered ? '#F0FDF4' : '#FFFFFF',
                boxShadow: prayer.isAnswered
                  ? '0 2px 4px rgba(16, 185, 129, 0.05)'
                  : '0 1px 2px rgba(15, 23, 42, 0.04)',
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
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
                    {prayer.title}
                  </h3>

                  {prayer.isAnswered ? (
                    <span
                      data-testid={`prayer-answered-badge-${prayer.id}`}
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        border: '1px solid #86EFAC',
                        padding: '0.125rem 0.625rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Respondida!</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: prayer.type === 'PETITION' ? '#EEF2FF' : '#ECFDF5',
                        color: prayer.type === 'PETITION' ? '#4338CA' : '#047857',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
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
                      color: '#475569',
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
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.5rem',
                      border: '1px solid #BBF7D0',
                      fontSize: '0.8125rem',
                      color: '#166534',
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
                      <Star size={14} style={{ color: '#059669' }} />
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
                        color: '#047857',
                        borderColor: '#A7F3D0',
                        backgroundColor: '#ECFDF5',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Check size={12} />
                      <span>Marcar como Respondida</span>
                    </button>
                  </Can>
                )}

                <Can action="manage_devotional">
                  <button
                    type="button"
                    data-testid={`archive-prayer-btn-${prayer.id}`}
                    onClick={() => onArchivePrayer(prayer.id)}
                    className="btn btn-outline-danger ui-button ui-button--ghost ui-button--sm"
                    style={{
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#94A3B8',
                      borderRadius: '0.375rem',
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
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PartyPopper size={20} style={{ color: '#059669' }} />
              <span>Marcar Oração como Respondida</span>
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#64748B' }}>
              Deseja registrar um testemunho ou nota de como Deus respondeu a esta oração na vida da família?
            </p>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="answered-note"
                style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}
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
                  borderRadius: '0.5rem',
                  border: '1px solid #CBD5E1',
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
                  borderRadius: '0.375rem',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
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
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
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
              backgroundColor: '#FFFFFF',
              borderRadius: '1rem',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {newType === 'PETITION' ? (
                  <>
                    <Heart size={18} style={{ color: '#4338CA' }} />
                    <span>Novo Pedido de Oração</span>
                  </>
                ) : (
                  <>
                    <Sun size={18} style={{ color: '#047857' }} />
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
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.25rem',
                }}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                className="alert alert-error"
                role="alert"
                style={{
                  marginBottom: '1rem',
                  padding: '0.625rem 0.75rem',
                  backgroundColor: '#FFF1F2',
                  border: '1px solid #FCA5A5',
                  color: '#9F1239',
                  borderRadius: '0.5rem',
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
                    color: '#334155',
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
                    borderRadius: '0.375rem',
                    border: '1px solid #CBD5E1',
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
                    color: '#334155',
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
                    borderRadius: '0.375rem',
                    border: '1px solid #CBD5E1',
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
                    color: '#334155',
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
                    borderRadius: '0.375rem',
                    border: '1px solid #CBD5E1',
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
                    borderRadius: '0.375rem',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
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
                    borderRadius: '0.375rem',
                    border: 'none',
                    backgroundColor: '#4338CA',
                    color: '#FFFFFF',
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
