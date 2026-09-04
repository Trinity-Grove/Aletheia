import React, { useState } from 'react';
import { AletheiaIcon, Button, Modal } from '@aletheia/ui';
import type { PedagogicalFramework } from '@aletheia/contracts';

export interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: PedagogicalFramework) => Promise<void>;
}

export function TemplateModal({ isOpen, onClose, onApply }: TemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PedagogicalFramework>('CLASSICAL_TRIVIUM');
  const [loading, setLoading] = useState(false);

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
      id: 'CLASSICAL_TRIVIUM',
      title: 'Educação Clássica (Trívio)',
      desc: 'Foco na fase gramatical: Português, Latim, Aritmética Lógica, História Ocidental Antiga, Ciências e Literatura Poética.',
      icon: <AletheiaIcon name="landmark" size={18} style={{ color: 'var(--color-indigo-700)' }} />,
    },
    {
      id: 'CHARLOTTE_MASON',
      title: 'Abordagem Charlotte Mason',
      desc: 'Foco em Livros Vivos (Living Books), Estudo da Natureza, Narração, Picture Study, Trabalhos Manuais e Formação de Hábitos.',
      icon: <AletheiaIcon name="sprout" size={18} style={{ color: 'var(--color-emerald-600)' }} />,
    },
    {
      id: 'TRADITIONAL',
      title: 'Currículo Tradicional Estruturado',
      desc: 'Disciplinas fundamentais organizadas: Português, Matemática, História, Geografia e Ciências Naturais.',
      icon: <AletheiaIcon name="book-open" size={18} style={{ color: 'var(--color-amber-600)' }} />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aplicar Modelo Pedagógico"
      description="Escolha uma abordagem para gerar disciplinas sugeridas e objetivos de aprendizagem iniciais:"
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="template-form" data-testid="apply-template-btn" isLoading={loading}>
            Aplicar Modelo
          </Button>
        </>
      }
    >
      <form id="template-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {templates.map((t) => (
            <label
              key={t.id}
              data-testid={`template-option-${t.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: `2px solid ${selectedTemplate === t.id ? 'var(--forest)' : 'var(--border-light)'}`,
                backgroundColor: selectedTemplate === t.id ? 'var(--color-indigo-50)' : 'var(--bg-surface)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="pedagogical-template"
                value={t.id}
                checked={selectedTemplate === t.id}
                onChange={() => setSelectedTemplate(t.id)}
                style={{ marginTop: '0.25rem' }}
              />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{t.icon}</span>
                  <span>{t.title}</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </form>
    </Modal>
  );
}
