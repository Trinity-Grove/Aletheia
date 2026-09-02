'use client';

import React, { useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  AcademicYearResponseDto,
  CreateObjectiveDto,
  CreateSubjectDto,
  LearnerPlanResponseDto,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  ObjectiveStatus,
  PedagogicalFramework,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { AcademicYearSwitcher } from './academic-year-switcher';
import { TemplateModal } from './template-modal';
import { SubjectModal } from './subject-modal';
import { ObjectiveModal } from './objective-modal';
import { SubjectCard } from './subject-card';
import { Can } from '../auth/role-guard';

export interface CurriculumViewProps {
  years: AcademicYearResponseDto[];
  activeYearId: string;
  onSelectYear: (yearId: string) => void;
  subjects: SubjectResponseDto[];
  objectives: ObjectiveResponseDto[];
  activeLearner: LearnerSummaryDto | null;
  learnerPlan: LearnerPlanResponseDto | null;
  onApplyTemplate: (template: PedagogicalFramework) => Promise<void>;
  onCreateSubject: (dto: CreateSubjectDto) => Promise<void>;
  onCreateObjective: (dto: CreateObjectiveDto) => Promise<void>;
  onToggleObjectiveStatus: (objectiveId: string, nextStatus: ObjectiveStatus) => Promise<void>;
  onDeleteObjective: (objectiveId: string) => Promise<void>;
}

export function CurriculumView({
  years,
  activeYearId,
  onSelectYear,
  subjects,
  objectives,
  activeLearner,
  learnerPlan,
  onApplyTemplate,
  onCreateSubject,
  onCreateObjective,
  onToggleObjectiveStatus,
  onDeleteObjective,
}: CurriculumViewProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [selectedSubjectForObjective, setSelectedSubjectForObjective] = useState<SubjectResponseDto | null>(null);

  const getFrameworkLabel = (framework?: PedagogicalFramework) => {
    switch (framework) {
      case 'CLASSICAL_TRIVIUM':
        return 'Clássica (Trívio)';
      case 'CHARLOTTE_MASON':
        return 'Charlotte Mason';
      case 'TRADITIONAL':
        return 'Tradicional';
      default:
        return 'Personalizado';
    }
  };

  const totalObjectives = objectives.length;
  const achievedObjectives = objectives.filter((o) => o.status === 'ACHIEVED').length;
  const overallPercent = totalObjectives > 0 ? Math.round((achievedObjectives / totalObjectives) * 100) : 0;

  return (
    <div
      data-testid="curriculum-view"
      style={{
        maxWidth: '76rem',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.5rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              {activeLearner ? `Currículo de ${activeLearner.preferredName || activeLearner.firstName}` : 'Currículo & Plano de Estudos'}
            </h1>
            {learnerPlan && (
              <span
                data-testid="pedagogical-framework-badge"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-indigo-50)',
                  color: 'var(--color-indigo-700)',
                  border: '1px solid var(--color-indigo-100)',
                }}
              >
                {getFrameworkLabel(learnerPlan.pedagogicalFramework)}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
            Planejamento pedagógico, matriz de disciplinas, ementas e objetivos de aprendizagem.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <AcademicYearSwitcher
            years={years}
            activeYearId={activeYearId}
            onSelectYear={onSelectYear}
          />
          {activeLearner && (
            <Can action="manage_curriculum">
              <button
                type="button"
                data-testid="open-template-modal-btn"
                onClick={() => setIsTemplateModalOpen(true)}
                className="btn btn-secondary ui-button ui-button--secondary ui-button--sm"
                style={{
                  padding: '0.45rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-indigo-100)',
                  backgroundColor: 'var(--color-indigo-50)',
                  color: 'var(--color-indigo-700)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                }}
              >
                <AletheiaIcon name="sparkles" size={14} />
                <span>Modelos Pedagógicos</span>
              </button>
            </Can>
          )}
          <Can action="manage_curriculum">
            <button
              type="button"
              data-testid="open-subject-modal-btn"
              onClick={() => setIsSubjectModalOpen(true)}
              className="btn btn-primary ui-button ui-button--primary ui-button--sm"
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                color: 'var(--text-inverse)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              + Nova Disciplina
            </button>
          </Can>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Progresso Geral do Ano:
          </span>
          <span
            data-testid="overall-progress-text"
            style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-indigo-700)' }}
          >
            {achievedObjectives} de {totalObjectives} objetivos concluídos ({overallPercent}%)
          </span>
        </div>
        <div
          style={{
            width: '240px',
            maxWidth: '100%',
            height: '8px',
            backgroundColor: 'var(--sage-soft)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            data-testid="overall-progress-bar"
            style={{
              width: `${overallPercent}%`,
              height: '100%',
              backgroundColor: overallPercent === 100 ? 'var(--color-emerald-600)' : 'var(--color-indigo-700)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Subjects & Objectives Grid */}
      {subjects.length === 0 ? (
        <div
          data-testid="curriculum-empty-state"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border-medium)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-indigo-50)',
              color: 'var(--color-indigo-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <AletheiaIcon name="book-open" size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.375rem 0' }}>
              Nenhuma disciplina cadastrada para este ano letivo
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '28rem', margin: '0 auto' }}>
              Comece aplicando um modelo pedagógico clássico ou Charlotte Mason, ou crie suas próprias disciplinas personalizadas.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {activeLearner && (
              <Can action="manage_curriculum">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="btn btn-primary ui-button ui-button--primary"
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    color: 'var(--text-inverse)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <AletheiaIcon name="sparkles" size={16} />
                  <span>Usar Modelo Pedagógico</span>
                </button>
              </Can>
            )}
            <Can action="manage_curriculum">
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(true)}
                className="btn btn-secondary ui-button ui-button--secondary"
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Criar Disciplina Manualmente
              </button>
            </Can>
          </div>
        </div>
      ) : (
        <div
          data-testid="subjects-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {subjects.map((subject) => {
            const subjectObjectives = objectives.filter((o) => o.subjectId === subject.id);
            return (
              <SubjectCard
                key={subject.id}
                subject={subject}
                objectives={subjectObjectives}
                onAddObjective={() => setSelectedSubjectForObjective(subject)}
                onToggleStatus={onToggleObjectiveStatus}
                onDeleteObjective={onDeleteObjective}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApply={onApplyTemplate}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSave={onCreateSubject}
      />

      {selectedSubjectForObjective && activeLearner && (
        <ObjectiveModal
          isOpen={true}
          subjectId={selectedSubjectForObjective.id}
          subjectName={selectedSubjectForObjective.name}
          learnerId={activeLearner.id}
          academicYearId={activeYearId}
          onClose={() => setSelectedSubjectForObjective(null)}
          onSave={onCreateObjective}
        />
      )}
    </div>
  );
}
