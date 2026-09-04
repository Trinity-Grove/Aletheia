import React, { useState } from 'react';
import { Button, Input, Modal, Textarea } from '@aletheia/ui';
import type { CreateObjectiveDto } from '@aletheia/contracts';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

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
      setTitle('');
      setDescription('');
      setTargetDate('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Objetivo de Aprendizagem"
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
            Salvar Objetivo
          </Button>
        </>
      }
    >
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
