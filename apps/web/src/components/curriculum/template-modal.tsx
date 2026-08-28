import React, { useState } from "react";
import { Landmark, Sprout, BookOpen } from "lucide-react";
import type { PedagogicalFramework } from "@aletheia/contracts";

export interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: PedagogicalFramework) => Promise<void>;
}

export function TemplateModal({ isOpen, onClose, onApply }: TemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PedagogicalFramework>("CLASSICAL_TRIVIUM");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onApply(selectedTemplate);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const templates: Array<{ id: PedagogicalFramework; title: string; desc: string; icon: React.ReactNode }> = [
    {
      id: "CLASSICAL_TRIVIUM",
      title: "Educação Clássica (Trívio)",
      desc: "Foco na fase gramatical: Português, Latim, Aritmética Lógica, História Ocidental Antiga, Ciências e Literatura Poética.",
      icon: <Landmark size={18} style={{ color: "#4338CA" }} />,
    },
    {
      id: "CHARLOTTE_MASON",
      title: "Abordagem Charlotte Mason",
      desc: "Foco em Livros Vivos (Living Books), Estudo da Natureza, Narração, Picture Study, Trabalhos Manuais e Formação de Hábitos.",
      icon: <Sprout size={18} style={{ color: "#059669" }} />,
    },
    {
      id: "TRADITIONAL",
      title: "Currículo Tradicional Estruturado",
      desc: "Disciplinas fundamentais organizadas: Português, Matemática, História, Geografia e Ciências Naturais.",
      icon: <BookOpen size={18} style={{ color: "#D97706" }} />,
    },
  ];

  return (
    <div
      data-testid="template-modal-overlay"
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
          maxWidth: "36rem",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
          Aplicar Modelo Pedagógico
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#4B5563", marginBottom: "1.25rem" }}>
          Escolha uma abordagem para gerar disciplinas sugeridas e objetivos de aprendizagem iniciais:
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {templates.map((t) => (
              <label
                key={t.id}
                data-testid={`template-option-${t.id}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  border: `2px solid ${selectedTemplate === t.id ? "#2563EB" : "#E5E7EB"}`,
                  backgroundColor: selectedTemplate === t.id ? "#EFF6FF" : "#FFFFFF",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="pedagogical-template"
                  value={t.id}
                  checked={selectedTemplate === t.id}
                  onChange={() => setSelectedTemplate(t.id)}
                  style={{ marginTop: "0.25rem" }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: "#1F2937", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>{t.icon}</span>
                    <span>{t.title}</span>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#4B5563", marginTop: "0.25rem" }}>{t.desc}</div>
                </div>
              </label>
            ))}
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
              data-testid="apply-template-btn"
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
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Aplicando..." : "Aplicar Modelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
