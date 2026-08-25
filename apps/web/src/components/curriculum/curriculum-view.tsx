import React, { useState } from "react";
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
} from "@aletheia/contracts";
import { AcademicYearSwitcher } from "./academic-year-switcher";
import { TemplateModal } from "./template-modal";
import { SubjectModal } from "./subject-modal";
import { ObjectiveModal } from "./objective-modal";
import { SubjectCard } from "./subject-card";

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
      case "CLASSICAL_TRIVIUM":
        return "🏛️ Clássica (Trívio)";
      case "CHARLOTTE_MASON":
        return "🌿 Charlotte Mason";
      case "TRADITIONAL":
        return "📚 Tradicional";
      default:
        return "✏️ Personalizado";
    }
  };

  const totalObjectives = objectives.length;
  const achievedObjectives = objectives.filter((o) => o.status === "ACHIEVED").length;
  const overallPercent = totalObjectives > 0 ? Math.round((achievedObjectives / totalObjectives) * 100) : 0;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1.25rem",
          backgroundColor: "#FFFFFF",
          borderRadius: "0.75rem",
          border: "1px solid #E5E7EB",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>
              {activeLearner ? `Currículo de ${activeLearner.preferredName || activeLearner.firstName}` : "Currículo & Plano de Estudos"}
            </h1>
            {learnerPlan && (
              <span
                data-testid="pedagogical-framework-badge"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "0.25rem 0.625rem",
                  borderRadius: "9999px",
                  backgroundColor: "#EEF2FF",
                  color: "#4F46E5",
                }}
              >
                {getFrameworkLabel(learnerPlan.pedagogicalFramework)}
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>
            Planejamento pedagógico, matriz de disciplinas e objetivos de aprendizagem.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <AcademicYearSwitcher
            years={years}
            activeYearId={activeYearId}
            onSelectYear={onSelectYear}
          />
          {activeLearner && (
            <button
              type="button"
              data-testid="open-template-modal-btn"
              onClick={() => setIsTemplateModalOpen(true)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #4F46E5",
                backgroundColor: "#EEF2FF",
                color: "#4F46E5",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ⚡ Modelos Pedagógicos
            </button>
          )}
          <button
            type="button"
            data-testid="open-subject-modal-btn"
            onClick={() => setIsSubjectModalOpen(true)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Nova Disciplina
          </button>
        </div>
      </div>

      {/* Progress Summary Card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          backgroundColor: "#F8FAFC",
          borderRadius: "0.5rem",
          border: "1px solid #E2E8F0",
        }}
      >
        <div>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Progresso Geral do Ano: </span>
          <span data-testid="overall-progress-text" style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2563EB" }}>
            {achievedObjectives} de {totalObjectives} objetivos concluídos ({overallPercent}%)
          </span>
        </div>
        <div style={{ width: "200px", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
          <div
            data-testid="overall-progress-bar"
            style={{
              width: `${overallPercent}%`,
              height: "100%",
              backgroundColor: "#2563EB",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Subjects & Objectives Grid */}
      {subjects.length === 0 ? (
        <div
          data-testid="curriculum-empty-state"
          style={{
            padding: "3rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "0.75rem",
            border: "1px dashed #D1D5DB",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📚</div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
            Nenhuma disciplina cadastrada para este ano letivo
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#6B7280", maxWidth: "28rem", margin: "0 auto 1.5rem auto" }}>
            Comece aplicando um modelo pedagógico clássico ou Charlotte Mason, ou crie suas próprias disciplinas personalizadas.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem" }}>
            {activeLearner && (
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: "#4F46E5",
                  color: "#FFFFFF",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ⚡ Usar Modelo Pedagógico
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(true)}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                border: "1px solid #D1D5DB",
                backgroundColor: "#FFFFFF",
                color: "#374151",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Criar Disciplina Manualmente
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="subjects-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(20rem, 1fr))",
            gap: "1.25rem",
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
