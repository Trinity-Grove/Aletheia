'use client';

import React, { useEffect, useState } from 'react';
import type { CreateLearnerDto, LearnerResponseDto } from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (initialLearners.length > 0) return;

    async function loadLearners() {
      try {
        const token = localStorage.getItem('token');
        const familyId = localStorage.getItem('familyId');
        if (!token || !familyId) return;

        const res = await fetch(`/api/v1/families/${familyId}/learners`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setLearners(await res.json());
        } else {
          setLoadError('Não foi possível carregar os educandos.');
        }
      } catch {
        setLoadError('Não foi possível carregar os educandos. Verifique sua conexão.');
      }
    }
    loadLearners();
  }, [initialLearners.length]);

  const handleOpenCreate = () => {
    setEditingLearner(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (learner: LearnerResponseDto) => {
    setEditingLearner(learner);
    setIsModalOpen(true);
  };

  const handleToggleArchive = (learner: LearnerResponseDto) => {
    void (async () => {
      const token = localStorage.getItem('token');
      const familyId = localStorage.getItem('familyId');
      if (!token || !familyId) return;

      const isArchived = Boolean(learner.archivedAt);
      const action = isArchived ? 'reactivate' : 'archive';
      try {
        const res = await fetch(`/api/v1/families/${familyId}/learners/${learner.id}/${action}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Falha ao ${isArchived ? 'reativar' : 'arquivar'} educando.`);
        }
        const updated = await res.json();
        setLearners((prev) => prev.map((item) => (item.id === learner.id ? updated : item)));
        setActionError(null);
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : 'Falha ao atualizar educando.');
      }
    })();
  };

  const handleSubmitForm = async (data: CreateLearnerDto) => {
    const token = localStorage.getItem('token');
    const familyId = localStorage.getItem('familyId');
    if (!token || !familyId) {
      throw new Error('Sessão inválida. Faça login novamente.');
    }

    const isEditing = Boolean(editingLearner);
    const url = isEditing
      ? `/api/v1/families/${familyId}/learners/${editingLearner!.id}`
      : `/api/v1/families/${familyId}/learners`;

    const res = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao salvar educando.');
    }

    const saved: LearnerResponseDto = await res.json();
    setLearners((prev) =>
      isEditing ? prev.map((item) => (item.id === saved.id ? saved : item)) : [...prev, saved]
    );
  };

  return (
    <ProductShell
      currentPath="/learners"
      learners={learners.map((l) => ({
        id: l.id,
        firstName: l.firstName,
        preferredName: l.preferredName,
        stage: l.stage,
        avatarColor: l.avatarColor,
      }))}
    >
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
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
              Gestão de Educandos
            </h1>
            <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
              Gerencie os perfis pedagógicos e etapas de desenvolvimento dos seus filhos.
            </p>
          </div>

          <Can action="create_learner">
            <button
              type="button"
              data-testid="add-learner-btn"
              onClick={handleOpenCreate}
              className="btn btn-primary ui-button ui-button--primary"
            >
              + Adicionar Educando
            </button>
          </Can>
        </div>

        {(loadError || actionError) && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
            {loadError ?? actionError}
          </div>
        )}

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
    </ProductShell>
  );
}
