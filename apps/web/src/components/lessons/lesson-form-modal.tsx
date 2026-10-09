'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Input, Modal, Select, Textarea } from '@aletheia/ui';
import type {
  CreateLessonPlanDto,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface LessonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave(dto: CreateLessonPlanDto): Promise<void>;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  objectives?: ObjectiveResponseDto[];
  initialDate?: string;
  initialAcademicYearId?: string;
}

export function LessonFormModal({
  isOpen,
  onClose,
  onSave,
  learners,
  subjects,
  objectives = [],
  initialDate,
  initialAcademicYearId,
}: LessonFormModalProps) {
  const { t } = useLocale();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [date, setDate] = useState(
    initialDate || new Date().toISOString().split('T')[0] || ''
  );
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>(() => {
    const first = learners[0];
    return first ? [first.id] : [];
  });
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [materials, setMaterials] = useState('');
  const [homework, setHomework] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const first = subjects[0];
    if (first && !subjectId) {
      setSubjectId(first.id);
    }
  }, [subjects, subjectId]);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    const first = learners[0];
    if (first && selectedLearnerIds.length === 0) {
      setSelectedLearnerIds([first.id]);
    }
  }, [learners, selectedLearnerIds]);

  if (!isOpen) return null;

  const toggleLearner = (learnerId: string) => {
    setSelectedLearnerIds((prev) =>
      prev.includes(learnerId) ? prev.filter((id) => id !== learnerId) : [...prev, learnerId]
    );
  };

  const toggleObjective = (objectiveId: string) => {
    setSelectedObjectiveIds((prev) =>
      prev.includes(objectiveId) ? prev.filter((id) => id !== objectiveId) : [...prev, objectiveId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('lessons.formModal.titleRequiredError'));
      return;
    }
    if (!subjectId) {
      setError(t('lessons.formModal.subjectRequiredError'));
      return;
    }
    if (selectedLearnerIds.length === 0) {
      setError(t('lessons.formModal.learnerRequiredError'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        subjectId,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        learnerIds: selectedLearnerIds,
        objectiveIds: selectedObjectiveIds,
        academicYearId: initialAcademicYearId || undefined,
        description: description.trim() || undefined,
        materials: materials.trim() || undefined,
        homework: homework.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset
      setTitle('');
      setDescription('');
      setMaterials('');
      setHomework('');
      setNotes('');
      setSelectedObjectiveIds([]);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('lessons.formModal.saveError'));
    } finally {
      setLoading(false);
    }
  };

  // Filter objectives matching selected subject (or show all available)
  const availableObjectives = objectives.filter(
    (obj) => !subjectId || obj.subjectId === subjectId
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('lessons.formModal.newTitle')}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('lessons.formModal.cancel')}
          </Button>
          <Button type="submit" form="lesson-form" data-testid="save-lesson-btn" isLoading={loading}>
            {t('lessons.formModal.save')}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" data-testid="lesson-form-error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      <form id="lesson-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Title & Subject */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label={t('lessons.formModal.titleLabel')}
            data-testid="lesson-title-input"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('lessons.formModal.titlePlaceholder')}
          />

          <Select
            label={t('lessons.formModal.subjectLabel')}
            data-testid="lesson-subject-select"
            required
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjects.map((sub) => ({ value: sub.id, label: sub.name }))}
          />
        </div>

        {/* Date, Start Time, End Time, Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
          <Input
            label={t('lessons.formModal.dateLabel')}
            type="date"
            data-testid="lesson-date-input"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Input
            label={t('lessons.formModal.startTimeLabel')}
            type="time"
            data-testid="lesson-start-time-input"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <Input
            label={t('lessons.formModal.endTimeLabel')}
            type="time"
            data-testid="lesson-end-time-input"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          <Input
            label={t('lessons.formModal.durationLabel')}
            type="number"
            data-testid="lesson-duration-input"
            min={1}
            max={1440}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </div>

        {/* Multi-Learner Selection */}
        <div>
          <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {t('lessons.formModal.learnersLabel')}
          </span>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {learners.map((learner) => (
              <Checkbox
                key={learner.id}
                data-testid={`learner-checkbox-${learner.id}`}
                label={learner.preferredName || learner.firstName}
                checked={selectedLearnerIds.includes(learner.id)}
                onChange={() => toggleLearner(learner.id)}
              />
            ))}
          </div>
        </div>

        {/* Objectives Linkage */}
        {availableObjectives.length > 0 && (
          <div>
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('lessons.formModal.linkObjectivesLabel')}
            </span>
            <div
              style={{
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
              }}
            >
              {availableObjectives.map((obj) => (
                <Checkbox
                  key={obj.id}
                  data-testid={`objective-checkbox-${obj.id}`}
                  label={obj.title}
                  checked={selectedObjectiveIds.includes(obj.id)}
                  onChange={() => toggleObjective(obj.id)}
                />
              ))}
            </div>
          </div>
        )}

        <Textarea
          label={t('lessons.formModal.descriptionLabel')}
          rows={2}
          data-testid="lesson-desc-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('lessons.formModal.descriptionPlaceholder')}
        />

        {/* Materials & Homework */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label={t('lessons.formModal.materialsLabel')}
            data-testid="lesson-materials-input"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder={t('lessons.formModal.materialsPlaceholder')}
          />
          <Input
            label={t('lessons.formModal.assignmentLabel')}
            data-testid="lesson-homework-input"
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            placeholder={t('lessons.formModal.assignmentPlaceholder')}
          />
        </div>

        <Textarea
          label={t('lessons.formModal.pedagogicalNotesLabel')}
          rows={2}
          data-testid="lesson-notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('lessons.formModal.pedagogicalNotesPlaceholder')}
        />
      </form>
    </Modal>
  );
}
