'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@aletheia/ui';
import type {
  CreateLearningRecordDto,
  CreatePortfolioItemDto,
  LearnerProgressSummaryDto,
  LearnerSummaryDto,
  LearningRecordResponseDto,
  ObjectiveResponseDto,
  PortfolioItemResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
import { RecordsJournalView } from '../../../src/components/records/records-journal-view';
import { RecordFormModal } from '../../../src/components/records/record-form-modal';
import { PortfolioItemModal } from '../../../src/components/records/portfolio-item-modal';

export default function RecordsPage() {
  const { toast } = useToast();
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

  // Initial Load: family, learners, subjects, objectives
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

        // Objectives
        const objectivesRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/objectives`, {
          credentials: 'include',
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
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/records?${params.toString()}`, {
        credentials: 'include',
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
      const res = await fetch(
        `/api/v1/families/${familyId}/records/learners/${activeLearnerId}/summary`,
        {
          credentials: 'include',
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

    if (recordToEdit) {
      const res = await fetch(`/api/v1/families/${familyId}/records/${recordToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        body: JSON.stringify(dto),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao atualizar registro de aprendizagem');
      }
    } else {
      const res = await fetch(`/api/v1/families/${familyId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
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
    try {
      const res = await fetch(`/api/v1/families/${familyId}/records/${recordId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Falha ao excluir registro de aprendizagem.');
      }
      await fetchRecords();
      await fetchProgressSummary();
      toast({ variant: 'success', title: 'Registro excluído.' });
    } catch (err: unknown) {
      toast({
        variant: 'error',
        title: err instanceof Error ? err.message : 'Falha ao excluir registro de aprendizagem.',
      });
    }
  };

  const handleSaveEvidence = async (dto: CreatePortfolioItemDto): Promise<PortfolioItemResponseDto> => {
    if (!familyId) throw new Error('Família não autenticada');
    const res = await fetch(`/api/v1/families/${familyId}/portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao anexar evidência');
    }
    const saved: PortfolioItemResponseDto = await res.json();
    await fetchRecords();
    return saved;
  };

  const handleUploadEvidenceFile = async (itemId: string, file: File) => {
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
          onUploadFile={handleUploadEvidenceFile}
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

