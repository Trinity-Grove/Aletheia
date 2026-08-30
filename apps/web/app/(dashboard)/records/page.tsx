'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  CreateLearningRecordDto,
  CreatePortfolioItemDto,
  LearnerProgressSummaryDto,
  LearnerSummaryDto,
  LearningRecordResponseDto,
  ObjectiveResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
import { RecordsJournalView } from '../../../src/components/records/records-journal-view';
import { RecordFormModal } from '../../../src/components/records/record-form-modal';
import { PortfolioItemModal } from '../../../src/components/records/portfolio-item-modal';

export default function RecordsPage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectResponseDto[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveResponseDto[]>([]);
  const [records, setRecords] = useState<LearningRecordResponseDto[]>([]);
  const [progressSummary, setProgressSummary] = useState<LearnerProgressSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<LearningRecordResponseDto | null>(null);

  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceRecord, setEvidenceRecord] = useState<LearningRecordResponseDto | null>(null);

  // Initial Load: token, family, learners, subjects, objectives
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

        // Objectives
        const objectivesRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/objectives`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (objectivesRes.ok) {
          const oData = await objectivesRes.json();
          setObjectives(oData);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadBaseData();
  }, []);

  // Fetch Records whenever activeLearnerId or familyId changes
  const fetchRecords = useCallback(async () => {
    if (!familyId) return;
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/records?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  // Fetch Progress Summary if learner selected
  const fetchProgressSummary = useCallback(async () => {
    if (!familyId || !activeLearnerId) {
      setProgressSummary(null);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/v1/families/${familyId}/records/learners/${activeLearnerId}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setProgressSummary(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  useEffect(() => {
    fetchRecords();
    fetchProgressSummary();
  }, [fetchRecords, fetchProgressSummary]);

  // Actions
  const handleSaveRecord = async (dto: CreateLearningRecordDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');

    if (recordToEdit) {
      const res = await fetch(`/api/v1/families/${familyId}/records/${recordToEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao atualizar registro de aprendizagem');
      }
    } else {
      const res = await fetch(`/api/v1/families/${familyId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao criar registro de aprendizagem');
      }
    }
    await fetchRecords();
    await fetchProgressSummary();
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/records/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchRecords();
      await fetchProgressSummary();
    }
  };

  const handleSaveEvidence = async (dto: CreatePortfolioItemDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
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
      throw new Error(err.message || 'Falha ao anexar evidência');
    }
    await fetchRecords();
  };

  const handleOpenCreateRecord = () => {
    setRecordToEdit(null);
    setIsRecordModalOpen(true);
  };

  const handleEditRecord = (record: LearningRecordResponseDto) => {
    setRecordToEdit(record);
    setIsRecordModalOpen(true);
  };

  const handleOpenAddEvidence = (record: LearningRecordResponseDto) => {
    setEvidenceRecord(record);
    setIsEvidenceModalOpen(true);
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
            Diário de Aprendizagem & Domínio
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Acompanhe a evolução individual, registre narrações, vivências espontâneas e o florescimento do caráter.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Carregando diário de aprendizagem...
          </div>
        ) : (
          <RecordsJournalView
            records={records}
            progressSummary={progressSummary}
            learners={learners}
            subjects={subjects}
            activeLearnerId={activeLearnerId}
            onOpenCreateRecord={handleOpenCreateRecord}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onAddEvidence={handleOpenAddEvidence}
          />
        )}

        {/* Modals */}
        <RecordFormModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSave={handleSaveRecord}
          learners={learners}
          subjects={subjects}
          objectives={objectives}
          recordToEdit={recordToEdit}
          defaultLearnerId={activeLearnerId}
        />

        <PortfolioItemModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          onSave={handleSaveEvidence}
          learners={learners}
          subjects={subjects}
          records={records}
          initialRecordId={evidenceRecord?.id}
          defaultLearnerId={evidenceRecord?.learnerId || activeLearnerId}
        />
      </div>
    </ProductShell>
  );
}

