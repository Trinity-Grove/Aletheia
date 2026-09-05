import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Textarea } from '@aletheia/ui';
import type { CreateSubjectDto, SubjectResponseDto, UpdateSubjectDto } from '@aletheia/contracts';

export interface SubjectModalProps {
  isOpen: boolean;
  subjectToEdit?: SubjectResponseDto | null | undefined;
  onClose: () => void;
  onSave: (dto: CreateSubjectDto) => Promise<void>;
  onUpdate?: ((subjectId: string, dto: UpdateSubjectDto) => Promise<void>) | undefined;
}

const PRESET_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#0D9488', '#DB2777', '#DC2626'];

export function SubjectModal({ isOpen, subjectToEdit, onClose, onSave, onUpdate }: SubjectModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectToEdit) {
      setName(subjectToEdit.name);
      setColor(subjectToEdit.color || '#2563EB');
      setDescription(subjectToEdit.description || '');
    } else {
      setName('');
      setColor('#2563EB');
      setDescription('');
    }
    setError(null);
  }, [subjectToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (subjectToEdit && onUpdate) {
        await onUpdate(subjectToEdit.id, {
          name: name.trim(),
          color,
          description: description.trim() || undefined,
        });
      } else {
        await onSave({
          name: name.trim(),
          color,
          description: description.trim() || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar disciplina.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subjectToEdit ? 'Editar Disciplina' : 'Nova Disciplina'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="subject-form" data-testid="save-subject-btn" isLoading={loading}>
            {subjectToEdit ? 'Salvar Alterações' : 'Salvar Disciplina'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" data-testid="subject-form-error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

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
