'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AletheiaIcon, Button, EmptyState, PageHeader, useToast } from '@aletheia/ui';
import type {
  CreatePortfolioItemDto,
  LearnerSummaryDto,
  LearningRecordResponseDto,
  PortfolioItemResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
import { PortfolioGalleryView } from '../../../src/components/records/portfolio-gallery-view';
import { PortfolioItemModal } from '../../../src/components/records/portfolio-item-modal';
import { useOptionalAuth } from '../../../src/lib/auth/auth-context';
import { useLocale } from '../../../src/lib/i18n/locale-context';

type PortfolioPageState = 'loading' | 'ready' | 'error' | 'no-family';

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
  const [pageState, setPageState] = useState<PortfolioPageState>('loading');
  const [portfolioState, setPortfolioState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PortfolioItemResponseDto | null>(null);

  const loadBaseData = useCallback(async (targetFamilyId: string) => {
    setPageState('loading');
    setPortfolioState('idle');

    try {
      const [learnersRes, subjectsRes, recordsRes] = await Promise.all([
        fetch(`/api/v1/families/${targetFamilyId}/learners`, { credentials: 'include' }),
        fetch(`/api/v1/families/${targetFamilyId}/curriculum/subjects`, { credentials: 'include' }),
        fetch(`/api/v1/families/${targetFamilyId}/records`, { credentials: 'include' }),
      ]);

      if (!learnersRes.ok || !subjectsRes.ok || !recordsRes.ok) {
        throw new Error('portfolio-base-data-request-failed');
      }

      const [learnersData, subjectsData, recordsData] = await Promise.all([
        learnersRes.json() as Promise<LearnerSummaryDto[]>,
        subjectsRes.json() as Promise<SubjectResponseDto[]>,
        recordsRes.json() as Promise<LearningRecordResponseDto[]>,
      ]);

      setLearners(learnersData);
      setSubjects(subjectsData);
      setRecords(recordsData);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  // Resolve the active family from the session first, preserving the legacy
  // localStorage fallback used by older dashboard entry points and tests.
  useEffect(() => {
    if (auth?.status === 'loading') {
      setFamilyId(null);
      setPageState('loading');
      setPortfolioState('idle');
      return;
    }

    const storedFamilyId = localStorage.getItem('aletheia.activeFamilyId') ?? localStorage.getItem('familyId');
    const resolvedFamilyId = auth?.activeFamilyId ?? storedFamilyId;
    setFamilyId(resolvedFamilyId);

    if (!resolvedFamilyId) {
      setPageState('no-family');
      setPortfolioState('idle');
      return;
    }

    void loadBaseData(resolvedFamilyId);
  }, [auth?.activeFamilyId, auth?.status, loadBaseData]);

  // Fetch Portfolio Items
  const fetchPortfolioItems = useCallback(async () => {
    if (!familyId) return;
    setPortfolioState('loading');
    try {
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/portfolio?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('portfolio-items-request-failed');
      }

      const data: PortfolioItemResponseDto[] = await res.json();
      // A real file upload never populates `fileUrl` — that field is only
      // ever the guardian-supplied external URL for LINK-type items. For
      // everything else, the only way to view the uploaded file is a
      // short-lived presigned GET URL fetched on demand, so resolve one
      // per uploaded item before rendering (the gallery already knows how
      // to render `fileUrl` for previews, it just never had one).
      const withDownloadUrls = await Promise.all(
        data.map(async (item) => {
          if (item.fileUrl || !item.mimeType) return item;
          try {
            const dlRes = await fetch(
              `/api/v1/families/${familyId}/portfolio/${item.id}/download-url`,
              { credentials: 'include' },
            );
            if (dlRes.ok) {
              const { downloadUrl } = await dlRes.json();
              return { ...item, fileUrl: downloadUrl };
            }
          } catch {
            // A missing preview must not hide the rest of the portfolio.
          }
          return item;
        }),
      );
      setPortfolioItems(withDownloadUrls);
      setPortfolioState('ready');
    } catch {
      setPortfolioState('error');
    }
  }, [familyId, activeLearnerId]);

  useEffect(() => {
    if (pageState === 'ready') {
      void fetchPortfolioItems();
    }
  }, [fetchPortfolioItems, pageState]);

  const handleRetry = () => {
    if (familyId) {
      void loadBaseData(familyId);
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
          <PortfolioGalleryView
            items={portfolioItems}
            learners={learners}
            subjects={subjects}
            activeLearnerId={activeLearnerId}
            onOpenAddItem={handleOpenAddItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
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
      </div>
    </ProductShell>
  );
}

