'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  AdminModeratePackDto,
  AdminResolveReportDto,
  AuthorTrustProfileResponseDto,
  CurriculumPackResponseDto,
  PackReportResponseDto,
} from '@aletheia/contracts';
import { Alert, Badge, Button, EmptyState, Modal } from '@aletheia/ui';
import { AuthorTrustBadge } from '../curriculum/author-trust-badge';
import { api } from '../../lib/api';
import { useLocale } from '../../lib/i18n/locale-context';

export interface ModerationQueueItem {
  pack: CurriculumPackResponseDto;
  authorTrustProfile: AuthorTrustProfileResponseDto | null;
  openReportsCount: number;
}

type TabType = 'queue' | 'reports';
type ReportFilterType = 'ALL' | 'OPEN' | 'UPHELD' | 'DISMISSED';

interface ModalState {
  isOpen: boolean;
  type: 'pack' | 'report';
  targetId: string;
  packAction?: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'RESTORE';
  reportStatus?: 'UPHELD' | 'DISMISSED';
}

export function PackModerationDashboard() {
  const { t, formatDate } = useLocale();

  const [activeTab, setActiveTab] = useState<TabType>('queue');
  const [queue, setQueue] = useState<ModerationQueueItem[]>([]);
  const [reports, setReports] = useState<PackReportResponseDto[]>([]);
  const [reportFilter, setReportFilter] = useState<ReportFilterType>('ALL');

  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'pack',
    targetId: '',
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const data = await api.get<ModerationQueueItem[]>('/admin/moderation/queue');
      setQueue(Array.isArray(data) ? data : []);
    } catch {
      setErrorMessage(t('curriculum.moderation.admin.errorGeneric'));
    } finally {
      setLoadingQueue(false);
    }
  }, [t]);

  const loadReports = useCallback(
    async (filter: ReportFilterType = reportFilter) => {
      setLoadingReports(true);
      try {
        const options = filter === 'ALL' ? undefined : { params: { status: filter } };
        const data = await api.get<PackReportResponseDto[]>('/admin/moderation/reports', options);
        setReports(Array.isArray(data) ? data : []);
      } catch {
        setErrorMessage(t('curriculum.moderation.admin.errorGeneric'));
      } finally {
        setLoadingReports(false);
      }
    },
    [reportFilter, t],
  );

  useEffect(() => {
    loadQueue();
    loadReports(reportFilter);
  }, [loadQueue, loadReports, reportFilter]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleFilterChange = (filter: ReportFilterType) => {
    setReportFilter(filter);
  };

  const openPackModal = (
    packId: string,
    action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'RESTORE',
  ) => {
    setNotes('');
    setSuccessMessage(null);
    setErrorMessage(null);
    setModalState({
      isOpen: true,
      type: 'pack',
      targetId: packId,
      packAction: action,
    });
  };

  const openReportModal = (reportId: string, status: 'UPHELD' | 'DISMISSED') => {
    setNotes('');
    setSuccessMessage(null);
    setErrorMessage(null);
    setModalState({
      isOpen: true,
      type: 'report',
      targetId: reportId,
      reportStatus: status,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    setNotes('');
    setIsSubmitting(false);
  };

  const handleConfirmAction = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (modalState.type === 'pack' && modalState.packAction) {
        const body: AdminModeratePackDto = {
          action: modalState.packAction,
          notes: notes.trim() || undefined,
        };
        await api.post(`/admin/moderation/packs/${modalState.targetId}/moderate`, body);
        setSuccessMessage(t('curriculum.moderation.admin.successPackModerated'));
        handleCloseModal();
        await loadQueue();
      } else if (modalState.type === 'report' && modalState.reportStatus) {
        const body: AdminResolveReportDto = {
          status: modalState.reportStatus,
          notes: notes.trim() || undefined,
        };
        await api.post(`/admin/moderation/reports/${modalState.targetId}/resolve`, body);
        setSuccessMessage(t('curriculum.moderation.admin.successReportResolved'));
        handleCloseModal();
        await loadReports(reportFilter);
      }
    } catch {
      setErrorMessage(t('curriculum.moderation.admin.errorGeneric'));
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-testid="pack-moderation-dashboard"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          {t('curriculum.moderation.admin.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary, #64748b)', margin: '0.25rem 0 0 0' }}>
          {t('curriculum.moderation.admin.subtitle')}
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" data-testid="moderation-success-alert">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" data-testid="moderation-error-alert">
          {errorMessage}
        </Alert>
      )}

      <div
        role="tablist"
        aria-label={t('curriculum.moderation.admin.title')}
        style={{
          display: 'flex',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          paddingBottom: '0.5rem',
        }}
      >
        <Button
          variant={activeTab === 'queue' ? 'primary' : 'ghost'}
          role="tab"
          aria-selected={activeTab === 'queue'}
          data-testid="tab-queue"
          onClick={() => handleTabChange('queue')}
        >
          {t('curriculum.moderation.admin.tabQueue', { count: queue.length })}
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'primary' : 'ghost'}
          role="tab"
          aria-selected={activeTab === 'reports'}
          data-testid="tab-reports"
          onClick={() => handleTabChange('reports')}
        >
          {t('curriculum.moderation.admin.tabReports', { count: reports.length })}
        </Button>
      </div>

      {activeTab === 'queue' && (
        <div data-testid="queue-list">
          {queue.length === 0 && !loadingQueue ? (
            <EmptyState
              title={t('curriculum.moderation.admin.queueEmpty')}
              description=""
            />
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-light, #e2e8f0)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: 'var(--bg-muted, #f8fafc)', borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                  <tr>
                    <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colPack')}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colAuthor')}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colStatus')}</th>
                    <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colReports')}</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('curriculum.moderation.admin.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr
                      key={item.pack.id}
                      data-testid={`queue-row-${item.pack.id}`}
                      style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600 }}>{item.pack.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                          <span>{item.pack.code}</span> &bull; <span>v{item.pack.version}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {item.authorTrustProfile ? (
                          <AuthorTrustBadge
                            tier={item.authorTrustProfile.tier}
                            trustScore={item.authorTrustProfile.trustScore}
                            showScore
                          />
                        ) : (
                          <AuthorTrustBadge tier="NOVICE" />
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge variant={item.pack.moderationStatus === 'APPROVED' ? 'emerald' : item.pack.moderationStatus === 'SUSPENDED' ? 'amber' : 'slate'}>
                          {item.pack.moderationStatus || 'DRAFT'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {item.openReportsCount > 0 ? (
                          <Badge variant="rose">{item.openReportsCount}</Badge>
                        ) : (
                          <Badge variant="slate">0</Badge>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {item.pack.moderationStatus === 'PENDING_REVIEW' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                data-testid={`approve-pack-btn-${item.pack.id}`}
                                onClick={() => openPackModal(item.pack.id, 'APPROVE')}
                              >
                                {t('curriculum.moderation.admin.actionApprove')}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                data-testid={`reject-pack-btn-${item.pack.id}`}
                                onClick={() => openPackModal(item.pack.id, 'REJECT')}
                              >
                                {t('curriculum.moderation.admin.actionReject')}
                              </Button>
                            </>
                          )}
                          {item.pack.moderationStatus === 'SUSPENDED' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                data-testid={`restore-pack-btn-${item.pack.id}`}
                                onClick={() => openPackModal(item.pack.id, 'RESTORE')}
                              >
                                {t('curriculum.moderation.admin.actionRestore')}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                data-testid={`reject-pack-btn-${item.pack.id}`}
                                onClick={() => openPackModal(item.pack.id, 'REJECT')}
                              >
                                {t('curriculum.moderation.admin.actionReject')}
                              </Button>
                            </>
                          )}
                          {item.pack.moderationStatus === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="danger"
                              data-testid={`suspend-pack-btn-${item.pack.id}`}
                              onClick={() => openPackModal(item.pack.id, 'SUSPEND')}
                            >
                              {t('curriculum.moderation.admin.actionSuspend')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant={reportFilter === 'ALL' ? 'primary' : 'secondary'}
              data-testid="filter-all"
              onClick={() => handleFilterChange('ALL')}
            >
              {t('curriculum.moderation.admin.filterAll')}
            </Button>
            <Button
              size="sm"
              variant={reportFilter === 'OPEN' ? 'primary' : 'secondary'}
              data-testid="filter-open"
              onClick={() => handleFilterChange('OPEN')}
            >
              {t('curriculum.moderation.admin.filterOpen')}
            </Button>
            <Button
              size="sm"
              variant={reportFilter === 'UPHELD' ? 'primary' : 'secondary'}
              data-testid="filter-upheld"
              onClick={() => handleFilterChange('UPHELD')}
            >
              {t('curriculum.moderation.admin.filterUpheld')}
            </Button>
            <Button
              size="sm"
              variant={reportFilter === 'DISMISSED' ? 'primary' : 'secondary'}
              data-testid="filter-dismissed"
              onClick={() => handleFilterChange('DISMISSED')}
            >
              {t('curriculum.moderation.admin.filterDismissed')}
            </Button>
          </div>

          <div data-testid="reports-list">
            {reports.length === 0 && !loadingReports ? (
              <EmptyState
                title={t('curriculum.moderation.admin.reportsEmpty')}
                description=""
              />
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-light, #e2e8f0)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: 'var(--bg-muted, #f8fafc)', borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colPack')}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colReporter')}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colReason')}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colDetails')}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colDate')}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{t('curriculum.moderation.admin.colStatus')}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{t('curriculum.moderation.admin.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        data-testid={`report-row-${report.id}`}
                        style={{ borderBottom: '1px solid var(--border-light, #e2e8f0)' }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {report.packId}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                          {report.reporterFamilyId}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                          {t(`curriculum.moderation.reasons.${report.reason}`)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', maxWidth: '250px', wordBreak: 'break-word' }}>
                          {report.details || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {formatDate(new Date(report.createdAt))}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <Badge
                            variant={
                              report.status === 'OPEN'
                                ? 'amber'
                                : report.status === 'UPHELD'
                                  ? 'rose'
                                  : 'slate'
                            }
                          >
                            {report.status === 'OPEN'
                              ? t('curriculum.moderation.admin.filterOpen')
                              : report.status === 'UPHELD'
                                ? t('curriculum.moderation.admin.filterUpheld')
                                : t('curriculum.moderation.admin.filterDismissed')}
                          </Badge>
                          {report.resolvedAt && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary, #64748b)', marginTop: '0.25rem' }}>
                              {formatDate(new Date(report.resolvedAt))}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          {report.status === 'OPEN' ? (
                            <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <Button
                                size="sm"
                                variant="danger"
                                data-testid={`uphold-report-btn-${report.id}`}
                                onClick={() => openReportModal(report.id, 'UPHELD')}
                              >
                                {t('curriculum.moderation.admin.actionUpheld')}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                data-testid={`dismiss-report-btn-${report.id}`}
                                onClick={() => openReportModal(report.id, 'DISMISSED')}
                              >
                                {t('curriculum.moderation.admin.actionDismissed')}
                              </Button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary, #64748b)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {modalState.isOpen && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          title={t('curriculum.moderation.admin.confirmTitle')}
          description={t('curriculum.moderation.admin.confirmMsg')}
          maxWidth="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
            <div>
              <label
                htmlFor="moderation-notes-input"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '0.375rem',
                }}
              >
                {t('curriculum.moderation.admin.modalNotesLabel')}
              </label>
              <textarea
                id="moderation-notes-input"
                data-testid="moderation-notes-input"
                rows={3}
                placeholder={t('curriculum.moderation.admin.modalNotesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-md, 6px)',
                  border: '1px solid var(--border-light, #cbd5e1)',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-light, #e2e8f0)',
              }}
            >
              <Button
                type="button"
                variant="secondary"
                data-testid="cancel-moderation-action-btn"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                {t('curriculum.moderation.admin.cancelBtn')}
              </Button>
              <Button
                type="button"
                variant="primary"
                data-testid="confirm-moderation-action-btn"
                onClick={handleConfirmAction}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {t('curriculum.moderation.admin.confirmBtn')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
