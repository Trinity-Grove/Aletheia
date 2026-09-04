'use client';

import React, { useState } from 'react';
import { AletheiaIcon, Alert, Badge, Button, EmptyState, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type { CreatePrayerDto, PrayerResponseDto, PrayerType } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';

export interface PrayerJournalProps {
  prayers: PrayerResponseDto[];
  onCreatePrayer: (_data: CreatePrayerDto) => Promise<void> | void;
  onAnswerPrayer: (_id: string, _answeredNote?: string) => Promise<void> | void;
  onArchivePrayer: (_id: string) => Promise<void> | void;
}

const PRAYER_TYPE_OPTIONS = [
  { value: 'PETITION', label: 'Pedido de Oração (Petição / Intercessão)' },
  { value: 'GRATITUDE', label: 'Gratidão / Louvor (Ação de Graças)' },
];

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
              <Badge data-testid="answered-prayers-counter" variant="emerald">
                <AletheiaIcon name="sparkles" size={12} />
                <span>{answeredCount} respondida(s)</span>
              </Badge>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Intercessões, súplicas ativas e testemunhos de orações respondidas pelo Senhor.
          </p>
        </div>

        <Can action="manage_devotional">
          <Button size="sm" data-testid="new-prayer-btn" onClick={() => handleOpenCreateModal(activeTab)}>
            + Novo Registro
          </Button>
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

      {/* Tabs — custom pattern, no Tabs component exists in @aletheia/ui yet */}
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
        <EmptyState
          data-testid="prayer-empty-state"
          icon={<AletheiaIcon name="sparkles" size={32} style={{ color: 'var(--text-muted)' }} />}
          title={
            activeTab === 'PETITION'
              ? 'Nenhum pedido de oração ativo no momento.'
              : 'Nenhuma gratidão registrada ainda.'
          }
          description="Adicione um novo registro para que todos possam orar juntos."
        />
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
                    <Badge data-testid={`prayer-answered-badge-${prayer.id}`} variant="emerald">
                      <AletheiaIcon name="sparkles" size={12} />
                      <span>Respondida!</span>
                    </Badge>
                  ) : (
                    <Badge variant={prayer.type === 'PETITION' ? 'indigo' : 'emerald'} size="sm">
                      {prayer.type === 'PETITION' ? 'Em Oração' : 'Gratidão'}
                    </Badge>
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
                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid={`answer-prayer-btn-${prayer.id}`}
                      onClick={() => {
                        setAnsweringPrayerId(prayer.id);
                        setAnsweredNote('');
                      }}
                      leftIcon={<AletheiaIcon name="check" size={12} />}
                    >
                      Marcar como Respondida
                    </Button>
                  </Can>
                )}

                <Can action="manage_devotional">
                  <Button
                    variant="ghost"
                    size="sm"
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
                  >
                    Arquivar
                  </Button>
                </Can>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Answering Prompt / Modal */}
      {answeringPrayerId && (
        <div data-testid="answer-prayer-modal">
          <Modal
            isOpen={true}
            onClose={() => setAnsweringPrayerId(null)}
            title="Marcar Oração como Respondida"
            description="Deseja registrar um testemunho ou nota de como Deus respondeu a esta oração na vida da família?"
            footer={
              <>
                <Button variant="secondary" onClick={() => setAnsweringPrayerId(null)}>
                  Cancelar
                </Button>
                <Button data-testid="confirm-answer-btn" onClick={handleConfirmAnswer}>
                  Confirmar Resposta
                </Button>
              </>
            }
          >
            <Textarea
              label="Nota de Agradecimento / Testemunho"
              rows={3}
              data-testid="answered-note-input"
              value={answeredNote}
              onChange={(e) => setAnsweredNote(e.target.value)}
              placeholder="Ex: Deus supriu a nossa necessidade através de..."
            />
          </Modal>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div data-testid="prayer-form-modal">
          <Modal
            isOpen={true}
            onClose={() => setIsModalOpen(false)}
            title={newType === 'PETITION' ? 'Novo Pedido de Oração' : 'Nova Gratidão / Louvor'}
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" form="prayer-form" data-testid="prayer-submit-btn" isLoading={loading}>
                  Salvar
                </Button>
              </>
            }
          >
            {error && (
              <Alert variant="error" style={{ marginBottom: '1rem' }}>
                {error}
              </Alert>
            )}

            <form id="prayer-form" onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Select
                label="Tipo"
                value={newType}
                onChange={(e) => setNewType(e.target.value as PrayerType)}
                options={PRAYER_TYPE_OPTIONS}
              />

              <Input
                label="Título *"
                data-testid="prayer-title-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={newType === 'PETITION' ? 'Ex: Saúde da vovó' : 'Ex: Bênção no trabalho'}
              />

              <Textarea
                label="Detalhes / Motivos"
                rows={3}
                data-testid="prayer-description-input"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descreva detalhes para oração em família..."
              />
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
