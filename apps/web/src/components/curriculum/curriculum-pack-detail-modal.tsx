'use client';

import React, { useState } from 'react';
import { Button, Modal } from '@aletheia/ui';
import type { CurriculumPackMediaResponseDto, CurriculumPackResponseDto } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface CurriculumPackDetailModalProps {
  isOpen: boolean;
  pack: CurriculumPackResponseDto | null;
  isInstalled: boolean;
  onClose(): void;
  onInstall?(pack: CurriculumPackResponseDto): void;
}

export function CurriculumPackDetailModal({
  isOpen,
  pack,
  isInstalled,
  onClose,
  onInstall,
}: CurriculumPackDetailModalProps) {
  const { t } = useLocale();
  const [media, setMedia] = useState<CurriculumPackMediaResponseDto[]>([]);
  const [mediaRequested, setMediaRequested] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  const loadPublicMedia = async () => {
    if (!pack || mediaLoading) return;
    setMediaRequested(true);
    setMediaLoading(true);
    setMediaError(false);
    try {
      const response = await fetch(`/api/v1/curriculum-packs/${pack.id}/media`, { credentials: 'include' });
      if (!response.ok) throw new Error('media request failed');
      setMedia((await response.json()) as CurriculumPackMediaResponseDto[]);
    } catch {
      setMediaError(true);
    } finally {
      setMediaLoading(false);
    }
  };

  if (!pack) return null;

  const meta = (pack.metadata as Record<string, any>) || {};
  const manifest = (meta.manifest as Record<string, any>) || {};
  const pillars = Array.isArray(meta.pillars) ? meta.pillars : [];
  const targetStages = Array.isArray(meta.targetStages) ? meta.targetStages : [];
  const manifestSubjects = Array.isArray(manifest.subjects) ? manifest.subjects : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pack.name}
      description={
        meta.category
          ? t('curriculum.packs.categoryLabel', { category: meta.category, version: pack.version })
          : t('curriculum.packs.versionLabel', { version: pack.version })
      }
      maxWidth="lg"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {isInstalled ? (
              <span style={{ color: 'var(--forest)', fontWeight: 600, fontSize: '0.875rem' }}>
                {t('curriculum.packs.alreadyInstalled')}
              </span>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={onClose}>
              {t('curriculum.packs.close')}
            </Button>
            {!isInstalled && onInstall ? (
              <Button
                variant="primary"
                data-testid="detail-install-pack-btn"
                onClick={() => onInstall(pack)}
              >
                {t('curriculum.packs.installInCurriculum')}
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      <div data-testid="curriculum-pack-detail-modal" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Meta badges & tags */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {meta.category && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--gold-dark)',
                backgroundColor: 'var(--bg-canvas)',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
              }}
            >
              {meta.category}
            </span>
          )}
          {meta.estimatedLessons && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)',
              }}
            >
              {t('curriculum.packs.estimatedLessons', { count: meta.estimatedLessons })}
            </span>
          )}
          {targetStages.map((stage: string) => (
            <span
              key={stage}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--sage-soft)',
                color: 'var(--forest)',
                fontWeight: 600,
              }}
            >
              {stage}
            </span>
          ))}
        </div>

        {/* Full description */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)' }}>
            {t('curriculum.packs.overviewPhilosophy')}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
            }}
          >
            {pack.description || t('curriculum.packs.noDescription')}
          </p>
        </div>

        {/* Methodological pillars */}
        {pillars.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
            }}
          >
            <h4
              style={{
                margin: '0 0 0.75rem 0',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--forest)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>🧭</span> {t('curriculum.packs.methodologicalPillars')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '0.625rem' }}>
              {pillars.map((pillar: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                  }}
                >
                  <span style={{ color: 'var(--forest)', fontWeight: 700 }}>✓</span>
                  <span>{pillar}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manifest contents */}
        {manifestSubjects.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
            }}
          >
            <h4
              style={{
                margin: '0 0 0.75rem 0',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--forest)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>📚</span> {t('curriculum.packs.includedSubjects')}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {manifestSubjects.map((subj: string, idx: number) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.8125rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  {subj}
                </span>
              ))}
            </div>
          </div>
        )}

        {pack.status === 'PUBLISHED' && (
          <div
            style={{
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--forest)' }}>
              {t('curriculum.packs.publicMediaTitle')}
            </h4>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              {t('curriculum.packs.publicMediaDescription')}
            </p>
            {!mediaRequested && (
              <Button
                variant="secondary"
                size="sm"
                data-testid="load-public-pack-media-btn"
                onClick={() => void loadPublicMedia()}
              >
                {t('curriculum.packs.loadPublicMediaBtn')}
              </Button>
            )}
            {mediaLoading && <p data-testid="public-pack-media-loading">{t('curriculum.packs.publicMediaLoading')}</p>}
            {mediaError && <p role="alert">{t('curriculum.packs.publicMediaError')}</p>}
            {mediaRequested && !mediaLoading && !mediaError && media.length === 0 && (
              <p>{t('curriculum.packs.publicMediaEmpty')}</p>
            )}
            {media.length > 0 && (
              <ul style={{ display: 'grid', gap: '0.5rem', margin: 0, padding: 0, listStyle: 'none' }}>
                {media.map((item) => (
                  <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{item.title}</span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        data-testid={`public-pack-media-link-${item.id}`}
                        style={{ color: 'var(--forest)', fontWeight: 600, fontSize: '0.8125rem' }}
                      >
                        {t('curriculum.packs.openPublicMediaBtn')}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
