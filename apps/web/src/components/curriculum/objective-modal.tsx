import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Textarea } from '@aletheia/ui';
import type { CreateObjectiveDto, ObjectiveResponseDto, UpdateObjectiveDto } from '@aletheia/contracts';

export interface ObjectiveModalProps {
  isOpen: boolean;
  subjectId: string;
  subjectName: string;
  learnerId: string;
  academicYearId: string;
  objectiveToEdit?: ObjectiveResponseDto | null | undefined;
  onClose: () => void;
  onSave: (dto: CreateObjectiveDto) => Promise<void>;
  onUpdate?: ((objectiveId: string, dto: UpdateObjectiveDto) => Promise<void>) | undefined;
}

export function ObjectiveModal({
  isOpen,
  subjectId,
  subjectName,
  learnerId,
  academicYearId,
  objectiveToEdit,
  onClose,
  onSave,
  onUpdate,
}: ObjectiveModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (objectiveToEdit) {
      setTitle(objectiveToEdit.title);
      setDescription(objectiveToEdit.description || '');
      setTargetDate(objectiveToEdit.targetDate || '');
    } else {
      setTitle('');
      setDescription('');
      setTargetDate('');
    }
    setError(null);
  }, [objectiveToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (objectiveToEdit && onUpdate) {
        await onUpdate(objectiveToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate || undefined,
        });
      } else {
        await onSave({
          learnerId,
          subjectId,
          academicYearId,
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar objetivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={objectiveToEdit ? 'Editar Objetivo de Aprendizagem' : 'Novo Objetivo de Aprendizagem'}
      description={
        <>
          Disciplina: <strong>{subjectName}</strong>
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="objective-form" data-testid="save-objective-btn" isLoading={loading}>
            {objectiveToEdit ? 'Salvar Alterações' : 'Salvar Objetivo'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" data-testid="objective-form-error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      <form id="objective-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label="Meta / Objetivo *"
          data-testid="objective-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Dominar declinações latinas da 1ª e 2ª classe"
        />

        <Textarea
          label="Critérios de Conclusão / Detalhes"
          rows={2}
          data-testid="objective-desc-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Evidências esperadas de domínio..."
        />

        <Input
          label="Data Alvo (Opcional)"
          type="date"
          data-testid="objective-date-input"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </form>
    </Modal>
  );
}
