'use client';

import React, { useState } from 'react';
import { AletheiaIcon, Alert, Badge, Button, EmptyState, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type { CreatePrayerDto, PrayerResponseDto, PrayerType } from '@aletheia/contracts';
import { Can } from '../auth/role-guard';
import { useLocale } from '../../lib/i18n/locale-context';

export interface PrayerJournalProps {
  prayers: PrayerResponseDto[];
  onCreatePrayer(_data: CreatePrayerDto): Promise<void> | void;
  onAnswerPrayer(_id: string, _answeredNote?: string): Promise<void> | void;
  onArchivePrayer(_id: string): Promise<void> | void;
}

export function PrayerJournal({
  prayers,
  onCreatePrayer,
  onAnswerPrayer,
  onArchivePrayer,
}: PrayerJournalProps) {
  const { t } = useLocale();
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

  const prayerTypeOptions = [
    { value: 'PETITION', label: t('devotional.prayer.modalCreate.petitionOption') },
    { value: 'GRATITUDE', label: t('devotional.prayer.modalCreate.gratitudeOption') },
  ];

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
      setError(t('devotional.prayer.errors.titleRequired'));
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
      const msg = err instanceof Error ? err.message : t('devotional.prayer.errors.saveFailed');
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
              {t('devotional.prayer.header.title')}
            </h2>
            {answeredCount > 0 && (
              <Badge data-testid="answered-prayers-counter" variant="emerald">
                <AletheiaIcon name="sparkles" size={12} />
                <span>{t('devotional.prayer.header.answeredCount', { count: answeredCount })}</span>
              </Badge>
            )}
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('devotional.prayer.header.subtitle')}
          </p>
        </div>

        <Can action="manage_devotional">
          <Button size="sm" data-testid="new-prayer-btn" onClick={() => handleOpenCreateModal(activeTab)}>
            {t('devotional.prayer.actions.new')}
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
              {t('devotional.prayer.celebration.title')}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-emerald-700)' }}>
              {t('devotional.prayer.celebration.subtitle')}
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
          <span>{t('devotional.prayer.tabs.petitions')}</span>
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
          <span>{t('devotional.prayer.tabs.gratitudes')}</span>
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
              ? t('devotional.prayer.empty.petitionsTitle')
              : t('devotional.prayer.empty.gratitudesTitle')
          }
          description={t('devotional.prayer.empty.description')}
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
                      <span>{t('devotional.prayer.card.answeredBadge')}</span>
                    </Badge>
                  ) : (
                    <Badge variant={prayer.type === 'PETITION' ? 'indigo' : 'emerald'} size="sm">
                      {prayer.type === 'PETITION' ? t('devotional.prayer.card.inPrayerBadge') : t('devotional.prayer.card.gratitudeBadge')}
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
                      <span>{t('devotional.prayer.card.testimonyLabel')}</span>
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
                      {t('devotional.prayer.actions.markAnswered')}
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
                          setError(err instanceof Error ? err.message : t('devotional.prayer.errors.archiveFailed'));
                        }
                      })();
                    }}
                  >
                    {t('devotional.prayer.actions.archive')}
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
            title={t('devotional.prayer.modalAnswer.title')}
            description={t('devotional.prayer.modalAnswer.description')}
            footer={
              <>
                <Button variant="secondary" onClick={() => setAnsweringPrayerId(null)}>
                  {t('devotional.prayer.modalAnswer.cancel')}
                </Button>
                <Button data-testid="confirm-answer-btn" onClick={handleConfirmAnswer}>
                  {t('devotional.prayer.modalAnswer.confirm')}
                </Button>
              </>
            }
          >
            <Textarea
              label={t('devotional.prayer.modalAnswer.label')}
              rows={3}
              data-testid="answered-note-input"
              value={answeredNote}
              onChange={(e) => setAnsweredNote(e.target.value)}
              placeholder={t('devotional.prayer.modalAnswer.placeholder')}
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
            title={newType === 'PETITION' ? t('devotional.prayer.modalCreate.petitionTitle') : t('devotional.prayer.modalCreate.gratitudeTitle')}
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={loading}>
                  {t('devotional.prayer.modalCreate.cancel')}
                </Button>
                <Button type="submit" form="prayer-form" data-testid="prayer-submit-btn" isLoading={loading}>
                  {t('devotional.prayer.modalCreate.save')}
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
                label={t('devotional.prayer.modalCreate.typeLabel')}
                value={newType}
                onChange={(e) => setNewType(e.target.value as PrayerType)}
                options={prayerTypeOptions}
              />

              <Input
                label={t('devotional.prayer.modalCreate.titleLabel')}
                data-testid="prayer-title-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={newType === 'PETITION' ? t('devotional.prayer.modalCreate.petitionTitlePlaceholder') : t('devotional.prayer.modalCreate.gratitudeTitlePlaceholder')}
              />

              <Textarea
                label={t('devotional.prayer.modalCreate.detailsLabel')}
                rows={3}
                data-testid="prayer-description-input"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('devotional.prayer.modalCreate.detailsPlaceholder')}
              />
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
