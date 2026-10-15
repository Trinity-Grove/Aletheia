'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AletheiaIcon, Button, EmptyState, PageHeader, useToast } from '@aletheia/ui';
import type {
  CreatePortfolioItemDto,
  CreatePortfolioItemFromEvidenceSubmissionDto,
  EvidenceSubmissionResponseDto,
  EvidenceTypeCatalogEntryDto,
  LearnerSummaryDto,
  LearningRecordResponseDto,
  PortfolioItemResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
import { PortfolioGalleryView } from '../../../src/components/records/portfolio-gallery-view';
import { PortfolioTimelineView } from '../../../src/components/records/portfolio-timeline-view';
import { PortfolioItemModal } from '../../../src/components/records/portfolio-item-modal';
import { ValidatedEvidencePromotionModal } from '../../../src/components/records/validated-evidence-promotion-modal';
import { useOptionalAuth } from '../../../src/lib/auth/auth-context';
import { useLocale } from '../../../src/lib/i18n/locale-context';

type PortfolioPageState = 'loading' | 'ready' | 'error' | 'no-family';

const PORTFOLIO_PERFORMANCE_EVENT = 'aletheia:portfolio-performance';

function getPerformanceNow(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

export default function PortfolioPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const auth = useOptionalAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectResponseDto[]>([]);
  const [records, setRecords] = useState<LearningRecordResponseDto[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemResponseDto[]>([]);
  const [validatedEvidence, setValidatedEvidence] = useState<EvidenceSubmissionResponseDto[]>([]);
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceTypeCatalogEntryDto[]>([]);
  const [pageState, setPageState] = useState<PortfolioPageState>('loading');
  const [portfolioState, setPortfolioState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [portfolioView, setPortfolioView] = useState<'gallery' | 'timeline'>('gallery');
  const baseDataRequestId = useRef(0);
  const mediaUrlCache = useRef(new Map<string, { url: string; expiresAt: number }>());
  const mediaUrlRequests = useRef(new Map<string, Promise<string | null>>());
  const portfolioLoadStartedAt = useRef<number | null>(null);
  const mediaResolutionRequests = useRef(0);
  const hasReportedFirstUsefulRender = useRef(false);
  const validatedMediaUrlCache = useRef(new Map<string, { url: string; expiresAt: number }>());
  const validatedMediaUrlRequests = useRef(new Map<string, Promise<string | null>>());

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isValidatedEvidenceModalOpen, setIsValidatedEvidenceModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PortfolioItemResponseDto | null>(null);

  const loadBaseData = useCallback(async (targetFamilyId: string, resetPortfolioState = true) => {
    const requestId = ++baseDataRequestId.current;
    setPageState('loading');
    if (resetPortfolioState) setPortfolioState('idle');

    try {
      const [learnersRes, subjectsRes, recordsRes, evidenceTypesRes] = await Promise.all([
        fetch(`/api/v1/families/${targetFamilyId}/learners`, { credentials: 'include' }),
        fetch(`/api/v1/families/${targetFamilyId}/curriculum/subjects`, { credentials: 'include' }),
        fetch(`/api/v1/families/${targetFamilyId}/records`, { credentials: 'include' }),
        fetch(`/api/v1/families/${targetFamilyId}/curriculum/evidence-types/catalog`, { credentials: 'include' }),
      ]);

      if (!learnersRes.ok || !subjectsRes.ok || !recordsRes.ok) {
        throw new Error('portfolio-base-data-request-failed');
      }

      const [learnersData, subjectsData, recordsData] = await Promise.all([
        learnersRes.json() as Promise<LearnerSummaryDto[]>,
        subjectsRes.json() as Promise<SubjectResponseDto[]>,
        recordsRes.json() as Promise<LearningRecordResponseDto[]>,
      ]);

      if (requestId !== baseDataRequestId.current) return;

      setLearners(learnersData);
      setSubjects(subjectsData);
      setRecords(recordsData);
      if (evidenceTypesRes.ok) {
        const evidenceTypesData: unknown = await evidenceTypesRes.json();
        setEvidenceTypes(Array.isArray(evidenceTypesData) ? evidenceTypesData as EvidenceTypeCatalogEntryDto[] : []);
      }
      setPageState('ready');
    } catch {
      if (requestId !== baseDataRequestId.current) return;
      setPageState('error');
    }
  }, []);

  const resolvePortfolioMediaUrl = useCallback(async (itemId: string): Promise<string | null> => {
    if (!familyId) return null;

    const cached = mediaUrlCache.current.get(itemId);
    if (cached && cached.expiresAt > Date.now() + 5_000) {
      return cached.url;
    }

    const pendingRequest = mediaUrlRequests.current.get(itemId);
    if (pendingRequest) return pendingRequest;

    mediaResolutionRequests.current += 1;
    let request: Promise<string | null>;
    request = fetch(`/api/v1/families/${familyId}/portfolio/${itemId}/download-url`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const payload: { downloadUrl?: string; expiresAt?: string } = await res.json();
        const expiresAt = payload.expiresAt ? Date.parse(payload.expiresAt) : Number.NaN;
        if (!payload.downloadUrl || !Number.isFinite(expiresAt)) return null;
        mediaUrlCache.current.set(itemId, { url: payload.downloadUrl, expiresAt });
        return payload.downloadUrl;
      })
      .catch(() => null)
      .finally(() => {
        if (mediaUrlRequests.current.get(itemId) === request) {
          mediaUrlRequests.current.delete(itemId);
        }
      });

    mediaUrlRequests.current.set(itemId, request);
    return request;
  }, [familyId]);

  useEffect(() => {
    mediaUrlCache.current.clear();
    mediaUrlRequests.current.clear();
    validatedMediaUrlCache.current.clear();
    validatedMediaUrlRequests.current.clear();
  }, [familyId]);

  // Resolve the active family from the session first, preserving the legacy
  // localStorage fallback used by older dashboard entry points and tests.
  useEffect(() => {
    if (auth?.status === 'loading') {
      baseDataRequestId.current += 1;
      setFamilyId(null);
      setPageState('loading');
      setPortfolioState('idle');
      return;
    }

    const storedFamilyId = localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId');
    const resolvedFamilyId = auth?.activeFamilyId ?? storedFamilyId;
    setFamilyId(resolvedFamilyId);

    if (!resolvedFamilyId) {
      baseDataRequestId.current += 1;
      setPageState('no-family');
      setPortfolioState('idle');
      return;
    }

    void loadBaseData(resolvedFamilyId);
  }, [auth?.activeFamilyId, auth?.status, loadBaseData]);

  // Fetch Portfolio Items
  const fetchPortfolioItems = useCallback(async () => {
    if (!familyId) return;
    portfolioLoadStartedAt.current = getPerformanceNow();
    mediaResolutionRequests.current = 0;
    hasReportedFirstUsefulRender.current = false;
    setPortfolioState('loading');
    try {
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const [res, evidenceRes] = await Promise.all([
        fetch(`/api/v1/families/${familyId}/portfolio?${params.toString()}`, {
          credentials: 'include',
        }),
        activeLearnerId
          ? fetch(`/api/v1/families/${familyId}/curriculum/evidence-submissions?learnerId=${activeLearnerId}`, { credentials: 'include' })
          : Promise.resolve(null),
      ]);
      if (!res.ok) {
        throw new Error('portfolio-items-request-failed');
      }

      const data: PortfolioItemResponseDto[] = await res.json();
      const evidenceData: unknown = evidenceRes?.ok ? await evidenceRes.json() : [];
      mediaUrlCache.current.clear();
      mediaUrlRequests.current.clear();
      setPortfolioItems(data);
      setValidatedEvidence(Array.isArray(evidenceData) ? (evidenceData as EvidenceSubmissionResponseDto[]).filter((submission) => submission.validationStatus === 'VALIDATED') : []);
      setPortfolioState('ready');
    } catch {
      setPortfolioState('error');
    }
  }, [familyId, activeLearnerId]);

  const handleFirstUsefulRender = useCallback((portfolioItemCount: number) => {
    if (hasReportedFirstUsefulRender.current || portfolioLoadStartedAt.current === null || typeof window === 'undefined') return;
    hasReportedFirstUsefulRender.current = true;
    window.dispatchEvent(new CustomEvent(PORTFOLIO_PERFORMANCE_EVENT, {
      detail: {
        portfolioItemCount,
        mediaResolutionRequests: mediaResolutionRequests.current,
        firstUsefulRenderMs: Math.max(0, getPerformanceNow() - portfolioLoadStartedAt.current),
      },
    }));
  }, []);

  useEffect(() => {
    if (portfolioState === 'ready') handleFirstUsefulRender(portfolioItems.length);
  }, [handleFirstUsefulRender, portfolioItems.length, portfolioState]);

  const resolveValidatedEvidenceMediaUrl = useCallback(async (submissionId: string): Promise<string | null> => {
    if (!familyId) return null;
    const cached = validatedMediaUrlCache.current.get(submissionId);
    if (cached && cached.expiresAt > Date.now() + 5_000) return cached.url;
    const pendingRequest = validatedMediaUrlRequests.current.get(submissionId);
    if (pendingRequest) return pendingRequest;

    let request: Promise<string | null>;
    request = fetch(`/api/v1/families/${familyId}/curriculum/evidence-submissions/${submissionId}/download-url`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return null;
        const payload: { downloadUrl?: string; expiresAt?: string } = await res.json();
        const expiresAt = payload.expiresAt ? Date.parse(payload.expiresAt) : Number.NaN;
        if (!payload.downloadUrl || !Number.isFinite(expiresAt)) return null;
        validatedMediaUrlCache.current.set(submissionId, { url: payload.downloadUrl, expiresAt });
        return payload.downloadUrl;
      })
      .catch(() => null)
      .finally(() => {
        if (validatedMediaUrlRequests.current.get(submissionId) === request) validatedMediaUrlRequests.current.delete(submissionId);
      });
    validatedMediaUrlRequests.current.set(submissionId, request);
    return request;
  }, [familyId]);

  useEffect(() => {
    if (pageState === 'ready') {
      void fetchPortfolioItems();
    }
  }, [fetchPortfolioItems, pageState]);

  const handleRetry = () => {
    if (familyId) {
      setPortfolioState('loading');
      void loadBaseData(familyId, false);
    }
  };

  // Actions
  const handleSaveItem = async (dto: CreatePortfolioItemDto): Promise<PortfolioItemResponseDto> => {
    if (!familyId) throw new Error(t('records.portfolio.messages.authRequired'));

    const res = itemToEdit
      ? await fetch(`/api/v1/families/${familyId}/portfolio/${itemToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dto),
        })
      : await fetch(`/api/v1/families/${familyId}/portfolio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(dto),
        });

    if (!res.ok) {
      if (itemToEdit) {
        throw new Error(t('records.portfolio.messages.updateError'));
      }
      throw new Error(t('records.portfolio.messages.createError'));
    }

    const saved: PortfolioItemResponseDto = await res.json();
    await fetchPortfolioItems();
    return saved;
  };

  const handleUploadFile = async (itemId: string, file: File) => {
    if (!familyId) return;

    const uploadUrlRes = await fetch(`/api/v1/families/${familyId}/portfolio/${itemId}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fileName: file.name, mimeType: file.type, fileSizeBytes: file.size }),
    });
    if (!uploadUrlRes.ok) {
      throw new Error(t('records.portfolio.messages.uploadPrepareError'));
    }
    const { uploadUrl } = await uploadUrlRes.json();

    const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!putRes.ok) {
      throw new Error(t('records.portfolio.messages.uploadTransferError'));
    }

    const confirmRes = await fetch(`/api/v1/families/${familyId}/portfolio/${itemId}/confirm-upload`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!confirmRes.ok) {
      throw new Error(t('records.portfolio.messages.uploadConfirmError'));
    }
    await fetchPortfolioItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/v1/families/${familyId}/portfolio/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(t('records.portfolio.messages.deleteError'));
      }
      await fetchPortfolioItems();
      toast({ variant: 'success', title: t('records.portfolio.messages.deleteSuccess') });
    } catch {
      toast({ variant: 'error', title: t('records.portfolio.messages.deleteError') });
    }
  };

  const handleOpenAddItem = () => {
    setItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: PortfolioItemResponseDto) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handlePromoteValidatedEvidence = async (submissionId: string, dto: CreatePortfolioItemFromEvidenceSubmissionDto) => {
    if (!familyId) throw new Error(t('records.portfolio.messages.authRequired'));
    const res = await fetch(`/api/v1/families/${familyId}/portfolio/from-evidence-submission/${submissionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(payload.message || t('records.validatedEvidence.promoteError'));
    }
    await fetchPortfolioItems();
  };

  const promotedSubmissionIds = useMemo(
    () => new Set(portfolioItems.flatMap((item) => item.evidenceSubmissionId ? [item.evidenceSubmissionId] : [])),
    [portfolioItems],
  );

  return (
    <ProductShell
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
    >
      <div className="page-container">
        <PageHeader
          title={t('reports.pages.portfolio.title')}
          description={t('reports.pages.portfolio.description')}
        />


        {pageState === 'no-family' ? (
          <EmptyState
            data-testid="portfolio-no-family-state"
            icon={<AletheiaIcon name="users" size={40} style={{ color: 'var(--forest)' }} />}
            title={t('reports.pages.portfolio.noFamilyTitle')}
            description={t('reports.pages.portfolio.noFamilyDescription')}
            action={
              auth?.families && auth.families.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                  {auth.families.map((family) => (
                    <Button key={family.id} onClick={() => auth.selectFamily(family.id)}>
                      {family.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <Link className="ui-button ui-button--primary ui-button--md" href="/onboarding">
                  {t('reports.pages.portfolio.createFamily')}
                </Link>
              )
            }
          />
        ) : pageState === 'loading' || portfolioState === 'loading' ? (
          <div data-testid="portfolio-loading-state" aria-busy="true" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {t('reports.pages.portfolio.loading')}
          </div>
        ) : pageState === 'error' || portfolioState === 'error' ? (
          <EmptyState
            data-testid="portfolio-error-state"
            role="alert"
            icon={<AletheiaIcon name="alert-circle" size={40} style={{ color: 'var(--color-amber-600)' }} />}
            title={t('reports.pages.portfolio.errorTitle')}
            description={t('reports.pages.portfolio.errorDescription')}
            action={<Button onClick={handleRetry}>{t('reports.pages.portfolio.retry')}</Button>}
          />
        ) : (
          <>
            <div className="portfolio-view-switcher" role="group" aria-label={t('records.portfolio.timeline.viewLabel')}>
              <button
                type="button"
                aria-pressed={portfolioView === 'gallery'}
                className={`portfolio-view-switcher__tab${portfolioView === 'gallery' ? ' portfolio-view-switcher__tab--active' : ''}`}
                onClick={() => setPortfolioView('gallery')}
              >
                {t('records.portfolio.timeline.galleryTab')}
              </button>
              <button
                type="button"
                aria-pressed={portfolioView === 'timeline'}
                className={`portfolio-view-switcher__tab${portfolioView === 'timeline' ? ' portfolio-view-switcher__tab--active' : ''}`}
                onClick={() => setPortfolioView('timeline')}
              >
                {t('records.portfolio.timeline.timelineTab')}
              </button>
            </div>
            {portfolioView === 'timeline' ? (
              <PortfolioTimelineView
                items={portfolioItems}
                records={records}
                activeLearnerId={activeLearnerId}
                onResolveMediaUrl={resolvePortfolioMediaUrl}
              />
            ) : (
              <PortfolioGalleryView
                items={portfolioItems}
                learners={learners}
                subjects={subjects}
                activeLearnerId={activeLearnerId}
                onOpenAddItem={handleOpenAddItem}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onResolveMediaUrl={resolvePortfolioMediaUrl}
                onOpenPromoteValidatedEvidence={() => setIsValidatedEvidenceModalOpen(true)}
                validatedEvidenceCount={validatedEvidence.filter((submission) => !promotedSubmissionIds.has(submission.id)).length}
              />
            )}
          </>
        )}

        {/* Modal */}
        <PortfolioItemModal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          onSave={handleSaveItem}
          onUploadFile={handleUploadFile}
          learners={learners}
          subjects={subjects}
          records={records}
          itemToEdit={itemToEdit}
          defaultLearnerId={activeLearnerId}
        />
        <ValidatedEvidencePromotionModal
          isOpen={isValidatedEvidenceModalOpen}
          onClose={() => setIsValidatedEvidenceModalOpen(false)}
          submissions={validatedEvidence}
          evidenceTypes={evidenceTypes}
          promotedSubmissionIds={promotedSubmissionIds}
          onPromote={handlePromoteValidatedEvidence}
          onResolveMediaUrl={resolveValidatedEvidenceMediaUrl}
        />
      </div>
    </ProductShell>
  );
}

