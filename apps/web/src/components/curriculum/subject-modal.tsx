import React, { useState } from "react";
import type { CreateSubjectDto } from "@aletheia/contracts";

export interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateSubjectDto) => Promise<void>;
}

export function SubjectModal({ isOpen, onClose, onSave }: SubjectModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        color,
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const presetColors = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#0D9488", "#DB2777", "#DC2626"];

  return (
    <div
      data-testid="subject-modal-overlay"
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
          maxWidth: "28rem",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "1rem" }}>
          Nova Disciplina
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="subject-name" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
              Nome da Disciplina *
            </label>
            <input
              id="subject-name"
              data-testid="subject-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Latim, História Medieval, Astronomia"
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
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
              Cor de Destaque
            </label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "9999px",
                    backgroundColor: c,
                    border: color === c ? "3px solid #111827" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="subject-description" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "0.25rem" }}>
              Descrição e Escopo
            </label>
            <textarea
              id="subject-description"
              data-testid="subject-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivos gerais, livros-base e metodologia adotada..."
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
              data-testid="save-subject-btn"
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
              {loading ? "Salvando..." : "Salvar Disciplina"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
