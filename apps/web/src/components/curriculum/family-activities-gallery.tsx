'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card } from '@aletheia/ui';
import type { FamilyActivityResponseDto } from '@aletheia/contracts';
import { FamilyActivityModal } from './family-activity-modal';
import { useLocale } from '../../lib/i18n/locale-context';

interface FamilyActivitiesGalleryProps {
  familyId: string;
}

export function FamilyActivitiesGallery({ familyId }: FamilyActivitiesGalleryProps) {
  const { t } = useLocale();
  const [activities, setActivities] = useState<FamilyActivityResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<FamilyActivityResponseDto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!familyId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/families/${familyId}/activities`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('curriculum.familyActivities.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [familyId]);

  const handleSaved = (saved: FamilyActivityResponseDto) => {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      return exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...prev];
    });
    setSuccessMsg(t('curriculum.familyActivities.savedSuccess', { name: saved.name }));
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDelete = async (activity: FamilyActivityResponseDto) => {
    try {
      setDeletingId(activity.id);
      setError(null);
      const res = await fetch(`/api/v1/families/${familyId}/activities/${activity.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('curriculum.familyActivities.deleteError'));
      }
      setActivities((prev) => prev.filter((a) => a.id !== activity.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('curriculum.familyActivities.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div data-testid="family-activities-gallery" style={{ display: 'grid', gap: '2rem' }}>
      <Card style={{ padding: '1.75rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--sage-soft)',
                color: 'var(--forest)',
              }}
            >
              {t('curriculum.familyActivities.tag')}
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--forest)', margin: '0.5rem 0 0 0' }}>
              {t('curriculum.familyActivities.title')}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '44rem' }}>
              {t('curriculum.familyActivities.description')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="sm"
              data-testid="create-family-activity-btn"
              onClick={() => {
                setEditingActivity(null);
                setIsModalOpen(true);
              }}
              style={{ fontWeight: 600 }}
            >
              {t('curriculum.familyActivities.newActivity')}
            </Button>
            <a
              href="/curriculum"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--forest)',
                textDecoration: 'underline',
              }}
            >
              {t('curriculum.familyActivities.backToCurriculum')}
            </a>
          </div>
        </div>
      </Card>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          {t('curriculum.familyActivities.loading')}
        </div>
      ) : activities.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-light)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧩</div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--forest)', fontSize: '1.125rem' }}>
            {t('curriculum.familyActivities.emptyTitle')}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('curriculum.familyActivities.emptyDescription')}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(20rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {activities.map((activity) => (
            <Card
              key={activity.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span
                    data-testid={`family-activity-visibility-badge-${activity.id}`}
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: activity.visibility === 'PUBLIC' ? 'var(--sage-soft)' : 'var(--bg-canvas)',
                      color: activity.visibility === 'PUBLIC' ? 'var(--forest)' : 'var(--text-secondary)',
                    }}
                  >
                    {activity.visibility === 'PUBLIC'
                      ? t('curriculum.familyActivities.publicBadge')
                      : t('curriculum.familyActivities.privateBadge')}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 700, color: 'var(--forest)' }}>
                  {activity.name}
                </h3>

                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {activity.description || t('curriculum.familyActivities.noDescription')}
                </p>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.625rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`edit-family-activity-btn-${activity.id}`}
                  onClick={() => {
                    setEditingActivity(activity);
                    setIsModalOpen(true);
                  }}
                  style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600 }}
                >
                  {t('curriculum.familyActivities.edit')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid={`delete-family-activity-btn-${activity.id}`}
                  onClick={() => void handleDelete(activity)}
                  isLoading={deletingId === activity.id}
                  style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600 }}
                >
                  {t('curriculum.familyActivities.remove')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FamilyActivityModal
        isOpen={isModalOpen}
        familyId={familyId}
        activity={editingActivity}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
