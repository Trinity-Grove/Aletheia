'use client';

import React, { useState } from 'react';
import { Alert, Button, Modal } from '@aletheia/ui';
import type { PackDiffAction, PackDiffReport } from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface PackUpdateDiffModalProps {
  isOpen: boolean;
  packName: string;
  diffReport: PackDiffReport;
  onClose: () => void;
  onApplyUpdate: () => void | Promise<void>;
  isApplying?: boolean;
}

type TabKey = 'all' | 'author' | 'preserved' | 'conflicts';

export function PackUpdateDiffModal({
  isOpen,
  packName,
  diffReport,
  onClose,
  onApplyUpdate,
  isApplying = false,
}: PackUpdateDiffModalProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  if (!isOpen) return null;

  const authorCount = diffReport.summary.addedCount + diffReport.summary.updatedCount;
  const preservedCount = diffReport.summary.preservedFamilyEditsCount;
  const conflictsCount = diffReport.summary.conflictsCount;
  const allCount = diffReport.items.length;

  const filteredItems = diffReport.items.filter((item) => {
    if (activeTab === 'author') {
      return item.action === 'ADDED_BY_AUTHOR' || item.action === 'UPDATED_BY_AUTHOR';
    }
    if (activeTab === 'preserved') {
      return item.action === 'PRESERVED_FAMILY_EDIT';
    }
    if (activeTab === 'conflicts') {
      return item.action === 'CONFLICT_PRESERVED_FAMILY';
    }
    return true;
  });

  const getActionBadge = (action: PackDiffAction) => {
    switch (action) {
      case 'ADDED_BY_AUTHOR':
        return {
          label: t('curriculum.marketplace.safeUpdate.actionAdded'),
          bg: '#DCFCE7',
          color: '#15803D',
          border: '#86EFAC',
          icon: '✨',
        };
      case 'UPDATED_BY_AUTHOR':
        return {
          label: t('curriculum.marketplace.safeUpdate.actionUpdated'),
          bg: '#DBEAFE',
          color: '#1D4ED8',
          border: '#93C5FD',
          icon: '🔄',
        };
      case 'PRESERVED_FAMILY_EDIT':
        return {
          label: t('curriculum.marketplace.safeUpdate.actionPreserved'),
          bg: '#F3E8FF',
          color: '#7E22CE',
          border: '#D8B4FE',
          icon: '🛡️',
        };
      case 'CONFLICT_PRESERVED_FAMILY':
        return {
          label: t('curriculum.marketplace.safeUpdate.actionConflict'),
          bg: '#FEF3C7',
          color: '#B45309',
          border: '#FCD34D',
          icon: '⚖️',
        };
      default:
        return {
          label: action,
          bg: '#F3F4F6',
          color: '#4B5563',
          border: '#E5E7EB',
          icon: '📌',
        };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('curriculum.marketplace.safeUpdate.title')}: ${packName}`}
      description={`v${diffReport.currentVersion}.0 → v${diffReport.latestVersion}.0`}
      maxWidth="lg"
    >
      <div
        data-testid="pack-update-diff-modal"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0' }}
      >
        <Alert variant="info" data-testid="safe-update-alert">
          {t('curriculum.marketplace.safeUpdate.safetyNotice')}
        </Alert>

        {/* Tab Navigation */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--border-light, #E2E8F0)',
            paddingBottom: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            data-testid="tab-all-items"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeTab === 'all' ? 'var(--forest, #1E293B)' : 'var(--border-light, #CBD5E1)',
              backgroundColor: activeTab === 'all' ? 'var(--forest, #1E293B)' : 'var(--bg-surface, #FFFFFF)',
              color: activeTab === 'all' ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
            }}
          >
            {t('curriculum.marketplace.safeUpdate.allTab', { count: allCount })}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'author'}
            data-testid="tab-author-items"
            onClick={() => setActiveTab('author')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeTab === 'author' ? 'var(--forest, #1E293B)' : 'var(--border-light, #CBD5E1)',
              backgroundColor: activeTab === 'author' ? 'var(--forest, #1E293B)' : 'var(--bg-surface, #FFFFFF)',
              color: activeTab === 'author' ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
            }}
          >
            {t('curriculum.marketplace.safeUpdate.addedTab', { count: authorCount })}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preserved'}
            data-testid="tab-preserved-items"
            onClick={() => setActiveTab('preserved')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeTab === 'preserved' ? 'var(--forest, #1E293B)' : 'var(--border-light, #CBD5E1)',
              backgroundColor: activeTab === 'preserved' ? 'var(--forest, #1E293B)' : 'var(--bg-surface, #FFFFFF)',
              color: activeTab === 'preserved' ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
            }}
          >
            {t('curriculum.marketplace.safeUpdate.preservedTab', { count: preservedCount })}
          </button>

          {conflictsCount > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'conflicts'}
              data-testid="tab-conflicts-items"
              onClick={() => setActiveTab('conflicts')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: activeTab === 'conflicts' ? 'var(--forest, #1E293B)' : 'var(--border-light, #CBD5E1)',
                backgroundColor: activeTab === 'conflicts' ? 'var(--forest, #1E293B)' : 'var(--bg-surface, #FFFFFF)',
                color: activeTab === 'conflicts' ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
              }}
            >
              {t('curriculum.marketplace.safeUpdate.conflictsTab', { count: conflictsCount })}
            </button>
          )}
        </div>

        {/* Diff Items List */}
        <div
          data-testid="diff-items-container"
          style={{
            maxHeight: '26rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            paddingRight: '0.25rem',
          }}
        >
          {filteredItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary, #64748B)', margin: '2rem 0' }}>
              {t('curriculum.marketplace.safeUpdate.noChanges')}
            </p>
          ) : (
            filteredItems.map((item) => {
              const badge = getActionBadge(item.action);
              return (
                <div
                  key={`${item.definitionType}-${item.code}`}
                  data-testid={`diff-item-${item.code}`}
                  style={{
                    padding: '0.875rem 1rem',
                    backgroundColor: 'var(--bg-canvas, #F8FAFC)',
                    border: '1px solid var(--border-light, #E2E8F0)',
                    borderRadius: 'var(--radius-md, 8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary, #64748B)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {item.definitionType}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #94A3B8)' }}>
                        • {item.code}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      <span aria-hidden="true">{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <h4
                    style={{
                      margin: 0,
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: 'var(--forest, #0F172A)',
                    }}
                  >
                    {item.name}
                  </h4>

                  {item.description && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary, #64748B)',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-light, #E2E8F0)',
          }}
        >
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isApplying}
            data-testid="cancel-diff-btn"
          >
            {t('curriculum.marketplace.safeUpdate.cancelBtn')}
          </Button>

          <Button
            variant="primary"
            onClick={() => void onApplyUpdate()}
            isLoading={isApplying}
            disabled={isApplying || !diffReport.hasUpdate}
            data-testid="apply-diff-update-btn"
            style={{ fontWeight: 600 }}
          >
            {isApplying
              ? t('curriculum.marketplace.safeUpdate.applying')
              : t('curriculum.marketplace.safeUpdate.applyBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
