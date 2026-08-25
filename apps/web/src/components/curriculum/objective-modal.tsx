import React, { useState } from "react";
import type { CreateObjectiveDto } from "@aletheia/contracts";

export interface ObjectiveModalProps {
  isOpen: boolean;
  subjectId: string;
  subjectName: string;
  learnerId: string;
  academicYearId: string;
  onClose: () => void;
  onSave: (dto: CreateObjectiveDto) => Promise<void>;
}

export function ObjectiveModal({
  isOpen,
  subjectId,
  subjectName,
  learnerId,
  academicYearId,
  onClose,
  onSave,
}: ObjectiveModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onSave({
        learnerId,
        subjectId,
        academicYearId,
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
      });
      setTitle("");
      setDescription("");
      setTargetDate("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="objective-modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          maxWidth: "30rem",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>
          Novo Objetivo de Aprendizagem
        </h2>
        <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "1rem" }}>
          Disciplina: <strong>{subjectName}</strong>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="objective-title" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
              Meta / Objetivo *
            </label>
            <input
              id="objective-title"
              data-testid="objective-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dominar declinações latinas da 1ª e 2ª classe"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #D1D5DB",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="objective-description" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
              Critérios de Conclusão / Detalhes
            </label>
            <textarea
              id="objective-description"
              data-testid="objective-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Evidências esperadas de domínio..."
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #D1D5DB",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="objective-target-date" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
              Data Alvo (Opcional)
            </label>
            <input
              id="objective-target-date"
              data-testid="objective-date-input"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #D1D5DB",
                fontSize: "0.875rem",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #D1D5DB",
                backgroundColor: "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="save-objective-btn"
              disabled={loading}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                border: "none",
                backgroundColor: "#2563EB",
                color: "#FFFFFF",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Salvando..." : "Salvar Objetivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
