'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, EmptyState, Modal } from '@aletheia/ui';
import type {
  AuthorTrustProfileResponseDto,
  CurriculumPackModerationStatus,
  CurriculumPackResponseDto,
} from '@aletheia/contracts';
import { AuthorTrustBadge } from './author-trust-badge';
import { CommunityPackCompositionEditor } from './community-pack-composition-editor';
import { CommunityPackPublicationStatus } from './community-pack-publication-status';
import { CommunityPackModerationHistory } from './community-pack-moderation-history';
import { useLocale } from '../../lib/i18n/locale-context';

const STATUS_KEYS: Record<CurriculumPackModerationStatus, string> = {
  DRAFT: 'curriculum.community.statusDraft',
  PENDING_REVIEW: 'curriculum.community.statusPendingReview',
  APPROVED: 'curriculum.community.statusApproved',
  REJECTED: 'curriculum.community.statusRejected',
  SUSPENDED: 'curriculum.community.statusSuspended',
};

const STATUS_STYLES: Record<CurriculumPackModerationStatus, { backgroundColor: string; color: string }> = {
  DRAFT: { backgroundColor: '#F3F4F6', color: '#4B5563' },
  PENDING_REVIEW: { backgroundColor: '#FEF3C7', color: '#92400E' },
  APPROVED: { backgroundColor: '#ECFDF5', color: '#047857' },
  REJECTED: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
  SUSPENDED: { backgroundColor: '#FEF2F2', color: '#B91C1C' },
};

interface MyAuthoredPacksPanelProps {
  availablePacks?: CurriculumPackResponseDto[];
  onOpenCatalog?: (() => void) | undefined;
  onOpenImport?: (() => void) | undefined;
  focusPackId?: string | null | undefined;
}

interface DraftForm {
  code: string;
  name: string;
  description: string;
  metadata: Record<string, unknown>;
}

const EMPTY_DRAFT_FORM: DraftForm = {
  code: 'MY_COMMUNITY_PACK',
  name: '',
  description: '',
  metadata: {},
};

export function MyAuthoredPacksPanel({
  availablePacks = [],
  onOpenCatalog,
  onOpenImport,
  focusPackId = null,
}: MyAuthoredPacksPanelProps) {
  const { t } = useLocale();
  const [packs, setPacks] = useState<CurriculumPackResponseDto[]>([]);
  const [profile, setProfile] = useState<AuthorTrustProfileResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; kind: 'success' | 'error' } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPack, setEditingPack] = useState<CurriculumPackResponseDto | null>(null);
  const [draftForm, setDraftForm] = useState<DraftForm>(EMPTY_DRAFT_FORM);
  const [selectedBaseId, setSelectedBaseId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<'created' | 'updated' | 'archived' | 'error' | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [packsRes, profileRes] = await Promise.all([
        fetch('/api/v1/curriculum-packs/my-packs', { credentials: 'include' }),
        fetch('/api/v1/curriculum-packs/author-profile', { credentials: 'include' }),
      ]);
      if (!packsRes.ok || !profileRes.ok) {
        setLoadError(true);
        return;
      }
      setPacks(await packsRes.json());
      setProfile(await profileRes.json());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!focusPackId || loading) return;
    const element = document.querySelector(`[data-testid="my-authored-pack-${focusPackId}"]`);
    if (element && typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'nearest' });
  }, [focusPackId, loading, packs]);

  const handleSubmitForReview = async (packId: string) => {
    setSubmittingId(packId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/curriculum-packs/${packId}/submit`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        setFeedback({ id: packId, kind: 'error' });
        return;
      }
      setFeedback({ id: packId, kind: 'success' });
      await loadData();
    } catch {
      setFeedback({ id: packId, kind: 'error' });
    } finally {
      setSubmittingId(null);
    }
  };

  const openCreateEditor = () => {
    setEditingPack(null);
    setSelectedBaseId('');
    setDraftForm(EMPTY_DRAFT_FORM);
    setActionFeedback(null);
    setIsEditorOpen(true);
  };

  const openEditEditor = (pack: CurriculumPackResponseDto) => {
    setEditingPack(pack);
    setSelectedBaseId('');
    setDraftForm({
      code: pack.code,
      name: pack.name,
      description: pack.description ?? '',
      metadata: pack.metadata,
    });
    setActionFeedback(null);
    setIsEditorOpen(true);
  };

  const handleBaseChange = (baseId: string) => {
    setSelectedBaseId(baseId);
    const base = availablePacks.find((pack) => pack.id === baseId);
    if (!base) return;
    setDraftForm({
      code: `${base.code}_AUTHOR`,
      name: `${base.name} — ${t('curriculum.community.authorCopySuffix')}`,
      description: base.description ?? '',
      metadata: base.metadata,
    });
  };

  const handleSaveDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setActionFeedback(null);
    try {
      const payload = {
        code: draftForm.code.trim().toUpperCase(),
        name: draftForm.name.trim(),
        description: draftForm.description.trim() || null,
        metadata: draftForm.metadata,
      };
      const res = await fetch(
        editingPack ? `/api/v1/curriculum-packs/${editingPack.id}` : '/api/v1/curriculum-packs',
        {
          method: editingPack ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            editingPack ? payload : { ...payload, version: 1, status: 'DRAFT', schemaVersion: '1.0.0' }
          ),
        }
      );
      if (!res.ok) throw new Error('save failed');
      setIsEditorOpen(false);
      setActionFeedback(editingPack ? 'updated' : 'created');
      await loadData();
    } catch {
      setActionFeedback('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (pack: CurriculumPackResponseDto) => {
    if (!window.confirm(t('curriculum.community.archiveConfirm', { name: pack.name }))) return;
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/v1/curriculum-packs/${pack.id}/archive`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('archive failed');
      setActionFeedback('archived');
      await loadData();
    } catch {
      setActionFeedback('error');
    }
  };

  if (loading) {
    return <div data-testid="my-authored-packs-loading">…</div>;
  }

  if (loadError) {
    return (
      <Alert variant="error" data-testid="my-authored-packs-error">
        {t('curriculum.community.myPacksLoadError')}{' '}
        <Button variant="secondary" size="sm" onClick={() => void loadData()}>
          {t('curriculum.community.retryLoadBtn')}
        </Button>
      </Alert>
    );
  }

  return (
    <div data-testid="my-authored-packs-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--forest)', fontSize: '1.125rem' }}>
            {t('curriculum.community.authorWorkspaceTitle')}
          </h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('curriculum.community.authorWorkspaceDescription')}
          </p>
        </div>
        <Button variant="primary" data-testid="create-community-pack-btn" onClick={openCreateEditor}>
          + {t('curriculum.community.createPackBtn')}
        </Button>
      </div>

      {actionFeedback === 'created' && <Alert variant="success">{t('curriculum.community.createSuccessMsg')}</Alert>}
      {actionFeedback === 'updated' && <Alert variant="success">{t('curriculum.community.updateSuccessMsg')}</Alert>}
      {actionFeedback === 'archived' && <Alert variant="success">{t('curriculum.community.archiveSuccessMsg')}</Alert>}
      {actionFeedback === 'error' && <Alert variant="error">{t('curriculum.community.authorWorkspaceError')}</Alert>}

      {profile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AuthorTrustBadge tier={profile.tier} trustScore={profile.trustScore} showScore />
        </div>
      )}

      {packs.length === 0 ? (
        <EmptyState
          data-testid="my-authored-packs-empty"
          title={t('curriculum.community.myPacksEmpty')}
          description={t('curriculum.community.myPacksEmptyDescription')}
          action={(
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="primary" data-testid="empty-create-community-pack-btn" onClick={openCreateEditor}>
                {t('curriculum.community.createPackBtn')}
              </Button>
              {onOpenCatalog && (
                <Button variant="secondary" data-testid="empty-open-catalog-btn" onClick={onOpenCatalog}>
                  {t('curriculum.community.openCatalogBtn')}
                </Button>
              )}
              {onOpenImport && (
                <Button variant="secondary" data-testid="empty-import-material-btn" onClick={onOpenImport}>
                  {t('curriculum.community.importMaterialBtn')}
                </Button>
              )}
            </div>
          )}
        />
      ) : (
        packs.map((pack) => (
          <Card
            key={pack.id}
            data-testid={`my-authored-pack-${pack.id}`}
            style={{ padding: '1rem', border: focusPackId === pack.id ? '2px solid var(--forest)' : undefined }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{pack.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{pack.code}</div>
              </div>
              {pack.moderationStatus && (
                <span
                  data-testid={`my-authored-pack-status-${pack.id}`}
                  style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    ...STATUS_STYLES[pack.moderationStatus],
                  }}
                >
                  {pack.status === 'ARCHIVED' ? t('curriculum.community.statusArchived') : t(STATUS_KEYS[pack.moderationStatus])}
                </span>
              )}
            </div>

            {feedback?.id === pack.id && feedback.kind === 'success' && (
              <Alert variant="success" data-testid={`submit-for-review-success-${pack.id}`} style={{ marginTop: '0.5rem' }}>
                {t('curriculum.community.submitForReviewSuccessMsg')}
              </Alert>
            )}
            {feedback?.id === pack.id && feedback.kind === 'error' && (
              <Alert variant="error" data-testid={`submit-for-review-error-${pack.id}`} style={{ marginTop: '0.5rem' }}>
                <span>{t('curriculum.community.submitForReviewErrorMsg')}</span>{' '}
                <Button variant="secondary" size="sm" onClick={() => void handleSubmitForReview(pack.id)}>
                  {t('curriculum.community.retrySubmitForReviewBtn')}
                </Button>
              </Alert>
            )}

            <CommunityPackPublicationStatus
              packId={pack.id}
              packStatus={pack.status}
              moderationStatus={pack.moderationStatus ?? 'DRAFT'}
              moderationNotes={pack.moderationNotes}
            />

            <CommunityPackModerationHistory packId={pack.id} />

            {pack.status === 'DRAFT' && (pack.moderationStatus === 'DRAFT' || pack.moderationStatus === 'REJECTED') && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`edit-community-pack-btn-${pack.id}`}
                  onClick={() => openEditEditor(pack)}
                >
                  {pack.moderationStatus === 'REJECTED'
                    ? t('curriculum.community.correctRejectedPackBtn')
                    : t('curriculum.community.editPackBtn')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`submit-for-review-btn-${pack.id}`}
                  isLoading={submittingId === pack.id}
                  disabled={submittingId === pack.id}
                  onClick={() => handleSubmitForReview(pack.id)}
                >
                  {submittingId === pack.id
                    ? t('curriculum.community.submittingForReviewBtn')
                    : pack.moderationStatus === 'REJECTED'
                      ? t('curriculum.community.resubmitForReviewBtn')
                      : t('curriculum.community.submitForReviewBtn')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`archive-community-pack-btn-${pack.id}`}
                  onClick={() => void handleArchive(pack)}
                >
                  {t('curriculum.community.archivePackBtn')}
                </Button>
              </div>
            )}
          </Card>
        ))
      )}

      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingPack ? t('curriculum.community.editPackTitle') : t('curriculum.community.createPackTitle')}
        description={t('curriculum.community.authorWorkspaceDescription')}
        maxWidth="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <Button variant="secondary" onClick={() => setIsEditorOpen(false)} disabled={isSaving}>
              {t('curriculum.community.cancelBtn')}
            </Button>
            <Button variant="primary" type="submit" form="community-pack-editor-form" isLoading={isSaving}>
              {t('curriculum.community.saveDraftBtn')}
            </Button>
          </div>
        }
      >
        <form
          id="community-pack-editor-form"
          data-testid="community-pack-editor-form"
          onSubmit={(event) => void handleSaveDraft(event)}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {!editingPack && availablePacks.length > 0 && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span>{t('curriculum.community.basePackLabel')}</span>
              <select value={selectedBaseId} onChange={(event) => handleBaseChange(event.target.value)}>
                <option value="">{t('curriculum.community.blankPackOption')}</option>
                {availablePacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span>{t('curriculum.community.packCodeLabel')}</span>
            <input
              required
              value={draftForm.code}
              onChange={(event) => setDraftForm((current) => ({ ...current, code: event.target.value }))}
              data-testid="community-pack-code-input"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span>{t('curriculum.community.packNameLabel')}</span>
            <input
              required
              value={draftForm.name}
              onChange={(event) => setDraftForm((current) => ({ ...current, name: event.target.value }))}
              data-testid="community-pack-name-input"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span>{t('curriculum.community.packDescriptionLabel')}</span>
            <textarea
              value={draftForm.description}
              onChange={(event) => setDraftForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              data-testid="community-pack-description-input"
            />
          </label>
          {editingPack && <CommunityPackCompositionEditor packId={editingPack.id} />}
        </form>
      </Modal>
    </div>
  );
}
