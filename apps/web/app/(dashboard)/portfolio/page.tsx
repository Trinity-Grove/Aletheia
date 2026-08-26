'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

  // Initial Load: token, family, learners, subjects, records
  useEffect(() => {
    async function loadBaseData() {
      try {
        const token = localStorage.getItem('token');
        const storedFamilyId = localStorage.getItem('familyId');
        if (!token || !storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }

        // Subjects
        const subjectsRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (subjectsRes.ok) {
          const sData = await subjectsRes.json();
          setSubjects(sData);
        }

        // Records (for linking)
        const recordsRes = await fetch(`/api/v1/families/${storedFamilyId}/records`, {
          headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/portfolio?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolioItems(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  useEffect(() => {
    fetchPortfolioItems();
  }, [fetchPortfolioItems]);

  // Actions
  const handleSaveItem = async (dto: CreatePortfolioItemDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');

    if (itemToEdit) {
      const res = await fetch(`/api/v1/families/${familyId}/portfolio/${itemToEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao atualizar evidência');
      }
    } else {
      const res = await fetch(`/api/v1/families/${familyId}/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao adicionar evidência');
      }
    }
    await fetchPortfolioItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/portfolio/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchPortfolioItems();
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Portfólio Vivo de Evidências
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0.25rem 0 0 0' }}>
            Exposição viva das obras de arte, narrações gravadas, cadernos de natureza e relatórios de projetos.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
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

