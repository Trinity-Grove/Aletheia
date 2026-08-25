import React from "react";
import type { ObjectiveResponseDto, ObjectiveStatus, SubjectResponseDto } from "@aletheia/contracts";

export interface SubjectCardProps {
  subject: SubjectResponseDto;
  objectives: ObjectiveResponseDto[];
  onAddObjective: (subjectId: string) => void;
  onToggleStatus: (objectiveId: string, nextStatus: ObjectiveStatus) => void;
  onDeleteObjective: (objectiveId: string) => void;
}

export function SubjectCard({
  subject,
  objectives,
  onAddObjective,
  onToggleStatus,
  onDeleteObjective,
}: SubjectCardProps) {
  const total = objectives.length;
  const achieved = objectives.filter((o) => o.status === "ACHIEVED").length;
  const percent = total > 0 ? Math.round((achieved / total) * 100) : 0;

  const cycleStatus = (status: ObjectiveStatus): ObjectiveStatus => {
    if (status === "NOT_STARTED") return "IN_PROGRESS";
    if (status === "IN_PROGRESS") return "ACHIEVED";
    return "NOT_STARTED";
  };

  const getStatusBadge = (status: ObjectiveStatus) => {
    switch (status) {
      case "ACHIEVED":
        return { label: "Concluído", bg: "#DEF7EC", text: "#03543F", icon: "✅" };
      case "IN_PROGRESS":
        return { label: "Em Andamento", bg: "#FEF3C7", text: "#92400E", icon: "⏳" };
      case "NOT_STARTED":
      default:
        return { label: "Não Iniciado", bg: "#F3F4F6", text: "#4B5563", icon: "⚪" };
    }
  };

  return (
    <div
      data-testid={`subject-card-${subject.id}`}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "0.75rem",
        border: "1px solid #E5E7EB",
        borderTop: `4px solid ${subject.color || "#2563EB"}`,
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#111827" }}>{subject.name}</h3>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#4B5563" }}>
            {achieved}/{total} ({percent}%)
          </span>
        </div>
        {subject.description && (
          <p style={{ fontSize: "0.8125rem", color: "#6B7280", marginTop: "0.25rem" }}>{subject.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ width: "100%", height: "6px", backgroundColor: "#F3F4F6", borderRadius: "9999px", overflow: "hidden" }}>
        <div
          data-testid="subject-progress-bar"
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: subject.color || "#2563EB",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Objectives List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
        {objectives.length === 0 ? (
          <div style={{ fontSize: "0.8125rem", color: "#9CA3AF", fontStyle: "italic", padding: "0.5rem 0" }}>
            Nenhum objetivo cadastrado nesta disciplina.
          </div>
        ) : (
          objectives.map((obj) => {
            const badge = getStatusBadge(obj.status);
            return (
              <div
                key={obj.id}
                data-testid={`objective-item-${obj.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                  backgroundColor: "#F9FAFB",
                  border: "1px solid #F3F4F6",
                  fontSize: "0.8125rem",
                }}
              >
                <span
                  style={{
                    color: obj.status === "ACHIEVED" ? "#6B7280" : "#1F2937",
                    textDecoration: obj.status === "ACHIEVED" ? "line-through" : "none",
                    flex: 1,
                    paddingRight: "0.5rem",
                  }}
                >
                  {obj.title}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    data-testid={`status-toggle-btn-${obj.id}`}
                    onClick={() => onToggleStatus(obj.id, cycleStatus(obj.status))}
                    style={{
                      padding: "0.25rem 0.5rem",
                      borderRadius: "9999px",
                      border: "none",
                      backgroundColor: badge.bg,
                      color: badge.text,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {badge.icon} {badge.label}
                  </button>

                  <button
                    type="button"
                    data-testid={`delete-objective-btn-${obj.id}`}
                    onClick={() => onDeleteObjective(obj.id)}
                    title="Excluir objetivo"
                    style={{
                      border: "none",
                      background: "none",
                      color: "#9CA3AF",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Add Objective */}
      <button
        type="button"
        data-testid={`add-objective-btn-${subject.id}`}
        onClick={() => onAddObjective(subject.id)}
        style={{
          width: "100%",
          padding: "0.375rem",
          borderRadius: "0.375rem",
          border: "1px dashed #D1D5DB",
          backgroundColor: "#FFFFFF",
          color: "#4B5563",
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        + Adicionar Objetivo
      </button>
    </div>
  );
}
