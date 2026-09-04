import React, { useState } from 'react';
import { Button, Input, Modal, Textarea } from '@aletheia/ui';
import type { CreateSubjectDto } from '@aletheia/contracts';

export interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateSubjectDto) => Promise<void>;
}

const PRESET_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#0D9488', '#DB2777', '#DC2626'];

export function SubjectModal({ isOpen, onClose, onSave }: SubjectModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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
      setName('');
      setDescription('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova Disciplina"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="subject-form" data-testid="save-subject-btn" isLoading={loading}>
            Salvar Disciplina
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label="Nome da Disciplina *"
          data-testid="subject-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Latim, História Medieval, Astronomia"
        />

        <div className="ui-form-group">
          <label className="ui-form-label">Cor de Destaque</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Selecionar cor ${c}`}
                aria-pressed={color === c}
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: c,
                  border: color === c ? '3px solid var(--text-primary)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <Textarea
          label="Descrição e Escopo"
          rows={3}
          data-testid="subject-desc-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Objetivos gerais, livros-base e metodologia adotada..."
        />
      </form>
    </Modal>
  );
}
