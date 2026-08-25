'use client';

import React, { useState } from 'react';
import type { CreatePrayerDto, PrayerResponseDto, PrayerType } from '@aletheia/contracts';

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
        borderRadius: '0.75rem',
        border: '1px solid #E5E7EB',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
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
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
            Diário de Oração da Família
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
            Intercessões, súplicas ativas e testemunhos de orações respondidas.
          </p>
        </div>

        <button
          type="button"
          data-testid="new-prayer-btn"
          onClick={() => handleOpenCreateModal(activeTab)}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          + Novo Registro
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #E5E7EB',
          gap: '1.5rem',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'PETITION'}
          onClick={() => setActiveTab('PETITION')}
          style={{
            padding: '0.5rem 0.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'PETITION' ? 600 : 500,
            color: activeTab === 'PETITION' ? '#4F46E5' : '#6B7280',
            borderBottom: activeTab === 'PETITION' ? '2px solid #4F46E5' : '2px solid transparent',
            marginBottom: '-2px',
          }}
        >
          Pedidos de Oração ({prayers.filter((p) => !p.archivedAt && p.type === 'PETITION').length})
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'GRATITUDE'}
          onClick={() => setActiveTab('GRATITUDE')}
          style={{
            padding: '0.5rem 0.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.9375rem',
            fontWeight: activeTab === 'GRATITUDE' ? 600 : 500,
            color: activeTab === 'GRATITUDE' ? '#059669' : '#6B7280',
            borderBottom: activeTab === 'GRATITUDE' ? '2px solid #059669' : '2px solid transparent',
            marginBottom: '-2px',
          }}
        >
          Gratidões & Louvores ({prayers.filter((p) => !p.archivedAt && p.type === 'GRATITUDE').length})
        </button>
      </div>

      {/* Prayer list */}
      {activePrayers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6B7280', fontSize: '0.875rem' }}>
          Nenhum registro encontrado nesta seção. Adicione um novo pedido ou motivo de gratidão!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activePrayers.map((prayer) => (
            <div
              key={prayer.id}
              data-testid={`prayer-card-${prayer.id}`}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                padding: '1rem',
                backgroundColor: prayer.isAnswered ? '#F0FDF4' : '#FAFAFA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                    {prayer.title}
                  </h3>
                  {prayer.isAnswered && (
                    <span
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      Respondida!
                    </span>
                  )}
                </div>

                {prayer.description && (
                  <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.875rem', color: '#4B5563' }}>
                    {prayer.description}
                  </p>
                )}

                {prayer.answeredNote && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.375rem',
                      border: '1px solid #BBF7D0',
                      fontSize: '0.8125rem',
                      color: '#15803D',
                    }}
                  >
                    <strong>Testemunho / Resposta:</strong> {prayer.answeredNote}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!prayer.isAnswered && (
                  <button
                    type="button"
                    data-testid={`answer-prayer-btn-${prayer.id}`}
                    onClick={() => {
                      setAnsweringPrayerId(prayer.id);
                      setAnsweredNote('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#166534' }}
                  >
                    Marcar como Respondida
                  </button>
                )}

                <button
                  type="button"
                  data-testid={`archive-prayer-btn-${prayer.id}`}
                  onClick={() => onArchivePrayer(prayer.id)}
                  className="btn btn-outline-danger"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  Arquivar
                </button>
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
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
              borderRadius: '0.75rem',
              maxWidth: '450px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
              Marcar Oração como Respondida
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6B7280' }}>
              Deseja registrar um testemunho ou nota de como Deus respondeu a esta oração?
            </p>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="answered-note">Nota de Agradecimento / Testemunho</label>
              <textarea
                id="answered-note"
                data-testid="answered-note-input"
                rows={3}
                value={answeredNote}
                onChange={(e) => setAnsweredNote(e.target.value)}
                placeholder="Ex: Deus supriu a nossa necessidade através de..."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setAnsweringPrayerId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="confirm-answer-btn"
                className="btn btn-primary"
                onClick={handleConfirmAnswer}
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
              borderRadius: '0.75rem',
              maxWidth: '500px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                {newType === 'PETITION' ? 'Novo Pedido de Oração' : 'Nova Gratidão / Louvor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="prayer-type">Tipo</label>
                <select
                  id="prayer-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PrayerType)}
                >
                  <option value="PETITION">Pedido de Oração (Petição / Intercessão)</option>
                  <option value="GRATITUDE">Gratidão / Louvor (Ação de Graças)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="prayer-title">Título *</label>
                <input
                  id="prayer-title"
                  type="text"
                  data-testid="prayer-title-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={newType === 'PETITION' ? 'Ex: Saúde da vovó' : 'Ex: Bênção no trabalho'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prayer-description">Detalhes / Motivos</label>
                <textarea
                  id="prayer-description"
                  rows={3}
                  data-testid="prayer-description-input"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descreva detalhes para oração em família..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="prayer-submit-btn"
                  className="btn btn-primary"
                  disabled={loading}
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
