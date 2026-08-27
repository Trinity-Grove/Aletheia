'use client';

import React, { useState } from 'react';
import type { CreateLearnerDto, LearnerResponseDto } from '@aletheia/contracts';
import { LearnersList } from '../../../src/components/learners/learners-list';
import { LearnerFormModal } from '../../../src/components/learners/learner-form-modal';
import { Can } from '../../../src/components/auth/role-guard';

export interface LearnersPageProps {
  initialLearners?: LearnerResponseDto[];
}

export default function LearnersPage({ initialLearners = [] }: LearnersPageProps) {
  const [learners, setLearners] = useState<LearnerResponseDto[]>(initialLearners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLearner, setEditingLearner] = useState<LearnerResponseDto | null>(null);

  const handleOpenCreate = () => {
    setEditingLearner(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (learner: LearnerResponseDto) => {
    setEditingLearner(learner);
    setIsModalOpen(true);
  };

  const handleToggleArchive = (learner: LearnerResponseDto) => {
    const isArchived = Boolean(learner.archivedAt);
    setLearners((prev) =>
      prev.map((item) =>
        item.id === learner.id
          ? {
              ...item,
              archivedAt: isArchived ? null : new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleSubmitForm = async (data: CreateLearnerDto) => {
    if (editingLearner) {
      setLearners((prev) =>
        prev.map((item) => {
          if (item.id !== editingLearner.id) return item;
          const updated: LearnerResponseDto = {
            ...item,
            firstName: data.firstName ?? item.firstName,
            lastName: data.lastName !== undefined ? data.lastName : item.lastName,
            preferredName: data.preferredName !== undefined ? data.preferredName : item.preferredName,
            birthDate: data.birthDate ?? item.birthDate,
            stage: data.stage ?? item.stage,
            customGrade: data.customGrade !== undefined ? data.customGrade : item.customGrade,
            avatarColor: data.avatarColor !== undefined ? data.avatarColor : item.avatarColor,
            specialNeeds: data.specialNeeds !== undefined ? data.specialNeeds : item.specialNeeds,
            notes: data.notes !== undefined ? data.notes : item.notes,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        })
      );
    } else {
      const newLearner: LearnerResponseDto = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `l-${Date.now()}`,
        familyId: 'family-current',
        firstName: data.firstName,
        lastName: data.lastName ?? null,
        preferredName: data.preferredName ?? null,
        birthDate: data.birthDate,
        stage: data.stage ?? 'PRIMARY_GRAMMAR',
        customGrade: data.customGrade ?? null,
        avatarColor: data.avatarColor ?? '#3B82F6',
        specialNeeds: data.specialNeeds ?? null,
        notes: data.notes ?? null,
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLearners((prev) => [...prev, newLearner]);
    }
  };

  return (
    <div className="learners-page-container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Gestão de Educandos</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#6B7280' }}>
            Gerencie os perfis pedagógicos e etapas de desenvolvimento dos seus filhos.
          </p>
        </div>

        <Can action="create_learner">
          <button
            type="button"
            data-testid="add-learner-btn"
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ padding: '0.625rem 1.25rem', fontWeight: 600 }}
          >
            + Adicionar Educando
          </button>
        </Can>
      </div>

      <LearnersList
        learners={learners}
        onEdit={handleOpenEdit}
        onToggleArchive={handleToggleArchive}
      />

      <LearnerFormModal
        isOpen={isModalOpen}
        initialData={editingLearner}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitForm}
      />
    </div>
  );
}
