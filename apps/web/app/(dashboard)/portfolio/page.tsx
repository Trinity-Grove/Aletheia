'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@aletheia/ui';
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

export default function PortfolioPage() {
  const { toast } = useToast();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectResponseDto[]>([]);
  const [records, setRecords] = useState<LearningRecordResponseDto[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PortfolioItemResponseDto | null>(null);

  // Initial Load: family, learners, subjects, records
  useEffect(() => {
    async function loadBaseData() {
      try {
        const storedFamilyId = localStorage.getItem('familyId');
        if (!storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          credentials: 'include',
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }

        // Subjects
        const subjectsRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/subjects`, {
          credentials: 'include',
        });
        if (subjectsRes.ok) {
          const sData = await subjectsRes.json();
          setSubjects(sData);
        }

        // Records (for linking)
        const recordsRes = await fetch(`/api/v1/families/${storedFamilyId}/records`, {
          credentials: 'include',
        });
        if (recordsRes.ok) {
          const rData = await recordsRes.json();
          setRecords(rData);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadBaseData();
  }, []);

  // Fetch Portfolio Items
  const fetchPortfolioItems = useCallback(async () => {
    if (!familyId) return;
    try {
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/portfolio?${params.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data: PortfolioItemResponseDto[] = await res.json();
        // A real file upload never populates `fileUrl` — that field is only
        // ever the guardian-supplied external URL for LINK-type items. For
        // everything else, the only way to view the uploaded file is a
        // short-lived presigned GET URL fetched on demand, so resolve one
        // per uploaded item before rendering (the gallery already knows how
        // to render `fileUrl` for previews/links, it just never had one).
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
              // ignore — item just renders without a preview link
            }
            return item;
          }),
        );
        setPortfolioItems(withDownloadUrls);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  useEffect(() => {
    fetchPortfolioItems();
  }, [fetchPortfolioItems]);

  // Actions
  const handleSaveItem = async (dto: CreatePortfolioItemDto): Promise<PortfolioItemResponseDto> => {
    if (!familyId) throw new Error('Família não autenticada');

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
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || (itemToEdit ? 'Falha ao atualizar evidência' : 'Falha ao adicionar evidência'));
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
      const err = await uploadUrlRes.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao preparar o envio do arquivo');
    }
    const { uploadUrl } = await uploadUrlRes.json();

    const putRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!putRes.ok) {
      throw new Error('Falha ao enviar o arquivo para o armazenamento.');
    }

    const confirmRes = await fetch(`/api/v1/families/${familyId}/portfolio/${itemId}/confirm-upload`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!confirmRes.ok) {
      const err = await confirmRes.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao confirmar o envio do arquivo');
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
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao excluir evidência.');
      }
      await fetchPortfolioItems();
      toast({ variant: 'success', title: 'Evidência excluída.' });
    } catch (err: unknown) {
      toast({ variant: 'error', title: err instanceof Error ? err.message : 'Falha ao excluir evidência.' });
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Portfólio Vivo de Evidências
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Exposição viva das obras de arte, narrações gravadas, cadernos de natureza e relatórios de projetos.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Carregando portfólio...
          </div>
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

