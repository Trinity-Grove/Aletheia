'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, EmptyState } from '@aletheia/ui';
import type {
  CommunityLearningResourceResponseDto,
  FamilyLearningResourceResponseDto,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';
import { CommunityLearningResourceModal } from './community-learning-resource-modal';

interface CommunityLearningResourcesGalleryProps {
  familyId: string;
}

type View = 'mine' | 'community';

export function CommunityLearningResourcesGallery({ familyId }: CommunityLearningResourcesGalleryProps) {
  const { t } = useLocale();
  const [resources, setResources] = useState<FamilyLearningResourceResponseDto[]>([]);
  const [communityResources, setCommunityResources] = useState<CommunityLearningResourceResponseDto[]>([]);
  const [activeView, setActiveView] = useState<View>('mine');
  const [loading, setLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [error, setError] = useState(false);
  const [communityError, setCommunityError] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<FamilyLearningResourceResponseDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadResources = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/v1/families/${familyId}/learning-resources`, { credentials: 'include' });
      if (!response.ok) throw new Error('resources');
      const data = await response.json();
      setResources(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityResources = async () => {
    setCommunityLoading(true);
    setCommunityError(false);
    try {
      const response = await fetch('/api/v1/community/learning-resources', { credentials: 'include' });
      if (!response.ok) throw new Error('community-resources');
      const data = await response.json();
      setCommunityResources(Array.isArray(data) ? data : []);
    } catch {
      setCommunityError(true);
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, [familyId]);

  const handleViewChange = (view: View) => {
    setActiveView(view);
    if (view === 'community' && communityResources.length === 0 && !communityLoading) void loadCommunityResources();
  };

  const handleSaved = (saved: FamilyLearningResourceResponseDto) => {
    setResources((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...current]);
    setSuccess(t('curriculum.communityResources.savedSuccess'));
  };

  const handleVisibility = async (resource: FamilyLearningResourceResponseDto) => {
    setSavingId(resource.id);
    try {
      const response = await fetch(`/api/v1/families/${familyId}/learning-resources/${resource.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: resource.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC' }),
      });
      if (!response.ok) throw new Error('visibility');
      const updated = await response.json() as FamilyLearningResourceResponseDto;
      handleSaved(updated);
      if (updated.visibility === 'PRIVATE') setCommunityResources((current) => current.filter((item) => item.id !== updated.id));
    } catch {
      setError(true);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (resource: FamilyLearningResourceResponseDto) => {
    setSavingId(resource.id);
    try {
      const response = await fetch(`/api/v1/families/${familyId}/learning-resources/${resource.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok && response.status !== 204) throw new Error('delete');
      setResources((current) => current.filter((item) => item.id !== resource.id));
    } catch {
      setError(true);
    } finally {
      setSavingId(null);
    }
  };

  const handleAdopt = async (resource: CommunityLearningResourceResponseDto) => {
    setAdoptingId(resource.id);
    try {
      const response = await fetch(`/api/v1/families/${familyId}/learning-resources/adopt`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceResourceId: resource.id }),
      });
      if (!response.ok) throw new Error('adopt');
      const copy = await response.json() as FamilyLearningResourceResponseDto;
      setResources((current) => [copy, ...current]);
      setActiveView('mine');
      setSuccess(t('curriculum.communityResources.adoptedSuccess'));
    } catch {
      setError(true);
    } finally {
      setAdoptingId(null);
    }
  };

  const resourceTypeLabel = (resourceType: string) => {
    if (resourceType === 'LESSON_PLAN') return t('curriculum.communityResources.typeLessonPlan');
    if (resourceType === 'CHRONOGRAM') return t('curriculum.communityResources.typeChronogram');
    return t('curriculum.communityResources.typeMaterial');
  };

  return (
    <div className="community-resources-gallery" data-testid="community-learning-resources-gallery">
      <Card className="community-resources-gallery__intro">
        <div>
          <Badge>{t('curriculum.communityResources.tag')}</Badge>
          <h2>{t('curriculum.communityResources.title')}</h2>
          <p>{t('curriculum.communityResources.description')}</p>
        </div>
        <Button data-testid="new-learning-resource-button" variant="primary" onClick={() => { setEditingResource(null); setModalOpen(true); }}>
          {t('curriculum.communityResources.newResource')}
        </Button>
      </Card>

      {success && <Alert variant="success" data-testid="learning-resource-success">{success}</Alert>}
      {error && <Alert variant="error" data-testid="learning-resource-error">{t('curriculum.communityResources.loadError')} <Button variant="secondary" size="sm" onClick={() => void loadResources()}>{t('curriculum.communityResources.retry')}</Button></Alert>}

      <div className="portfolio-view-switcher" role="group" aria-label={t('curriculum.communityResources.viewLabel')}>
        <button type="button" className={`portfolio-view-switcher__tab${activeView === 'mine' ? ' portfolio-view-switcher__tab--active' : ''}`} aria-pressed={activeView === 'mine'} onClick={() => handleViewChange('mine')}>
          {t('curriculum.communityResources.mineTab')}
        </button>
        <button type="button" data-testid="community-learning-resources-tab" className={`portfolio-view-switcher__tab${activeView === 'community' ? ' portfolio-view-switcher__tab--active' : ''}`} aria-pressed={activeView === 'community'} onClick={() => handleViewChange('community')}>
          {t('curriculum.communityResources.communityTab')}
        </button>
      </div>

      {activeView === 'community' ? (
        communityLoading ? <div className="community-resources-gallery__state">{t('curriculum.communityResources.loading')}</div>
          : communityError ? <Alert variant="error">{t('curriculum.communityResources.communityLoadError')} <Button variant="secondary" size="sm" onClick={() => void loadCommunityResources()}>{t('curriculum.communityResources.retry')}</Button></Alert>
            : communityResources.length === 0 ? <EmptyState title={t('curriculum.communityResources.communityEmptyTitle')} description={t('curriculum.communityResources.communityEmptyDescription')} />
              : <div className="community-resources-gallery__grid" data-testid="community-learning-resources-list">
                {communityResources.map((resource) => (
                  <Card key={resource.id} data-testid={`community-learning-resource-card-${resource.id}`} className="community-resources-gallery__card">
                    <Badge>{resourceTypeLabel(resource.resourceType)}</Badge>
                    <h3>{resource.title}</h3>
                    <p>{resource.description || t('curriculum.communityResources.noDescription')}</p>
                    <Button variant="primary" size="sm" isLoading={adoptingId === resource.id} onClick={() => void handleAdopt(resource)}>{t('curriculum.communityResources.adopt')}</Button>
                  </Card>
                ))}
              </div>
      ) : loading ? <div className="community-resources-gallery__state">{t('curriculum.communityResources.loading')}</div>
        : resources.length === 0 ? <EmptyState title={t('curriculum.communityResources.emptyTitle')} description={t('curriculum.communityResources.emptyDescription')} />
          : <div className="community-resources-gallery__grid" data-testid="learning-resources-list">
            {resources.map((resource) => (
              <Card key={resource.id} data-testid={`learning-resource-card-${resource.id}`} className="community-resources-gallery__card">
                <div className="community-resources-gallery__card-top"><Badge>{resourceTypeLabel(resource.resourceType)}</Badge><span>{resource.visibility === 'PUBLIC' ? t('curriculum.communityResources.publicBadge') : t('curriculum.communityResources.privateBadge')}</span></div>
                <h3>{resource.title}</h3>
                <p>{resource.description || t('curriculum.communityResources.noDescription')}</p>
                <div className="community-resources-gallery__actions">
                  <Button variant="secondary" size="sm" onClick={() => { setEditingResource(resource); setModalOpen(true); }}>{t('curriculum.communityResources.edit')}</Button>
                  <Button variant="secondary" size="sm" isLoading={savingId === resource.id} onClick={() => void handleVisibility(resource)}>{resource.visibility === 'PUBLIC' ? t('curriculum.communityResources.unshare') : t('curriculum.communityResources.share')}</Button>
                  <Button variant="secondary" size="sm" isLoading={savingId === resource.id} onClick={() => void handleDelete(resource)}>{t('curriculum.communityResources.remove')}</Button>
                </div>
              </Card>
            ))}
          </div>}

      <CommunityLearningResourceModal
        isOpen={modalOpen}
        familyId={familyId}
        resource={editingResource}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
