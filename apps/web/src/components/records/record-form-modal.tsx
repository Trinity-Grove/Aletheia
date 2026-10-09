'use client';

import React, { useEffect, useState } from 'react';
import { AletheiaIcon, Alert, Button, Checkbox, Input, Modal, Select, Textarea } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';
import type {
  CreateLearningRecordDto,
  LearningRecordResponseDto,
  LearnerSummaryDto,
  SubjectResponseDto,
  ObjectiveResponseDto,
  LearningRecordType,
  MasteryLevel,
  AssessmentMethod,
} from '@aletheia/contracts';
import {
  ASSESSMENT_LABELS,
  ASSESSMENT_KEY_MAP,
  MASTERY_CONFIG,
  MASTERY_KEY_MAP,
  RECORD_TYPE_LABELS,
  RECORD_TYPE_KEY_MAP,
} from './record-card';

export interface RecordFormModalProps {
  isOpen: boolean;
  onClose(): void;
  onSave(dto: CreateLearningRecordDto): Promise<void>;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  objectives: ObjectiveResponseDto[];
  recordToEdit?: LearningRecordResponseDto | null | undefined;
  initialDate?: string;
  defaultLearnerId?: string | null | undefined;
}

export function RecordFormModal({
  isOpen,
  onClose,
  onSave,
  learners,
  subjects,
  objectives,
  recordToEdit,
  initialDate,
  defaultLearnerId,
}: RecordFormModalProps) {
  const { t } = useLocale();
  const [learnerId, setLearnerId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [type, setType] = useState<LearningRecordType>('PLANNED_LESSON');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]!);
  const [durationMinutes, setDurationMinutes] = useState<string>('45');
  const [masteryLevel, setMasteryLevel] = useState<MasteryLevel>('DEVELOPING');
  const [assessmentMethod, setAssessmentMethod] = useState<AssessmentMethod>('OBSERVATION');
  const [strengths, setStrengths] = useState('');
  const [areasForGrowth, setAreasForGrowth] = useState('');
  const [characterHabitGrowth, setCharacterHabitGrowth] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordToEdit) {
      setLearnerId(recordToEdit.learnerId);
      setSubjectId(recordToEdit.subjectId || '');
      setType(recordToEdit.type);
      setTitle(recordToEdit.title);
      setDescription(recordToEdit.description || '');
      setDate(recordToEdit.date);
      setDurationMinutes(recordToEdit.durationMinutes ? String(recordToEdit.durationMinutes) : '');
      setMasteryLevel(recordToEdit.masteryLevel);
      setAssessmentMethod(recordToEdit.assessmentMethod);
      setStrengths(recordToEdit.strengths || '');
      setAreasForGrowth(recordToEdit.areasForGrowth || '');
      setCharacterHabitGrowth(recordToEdit.characterHabitGrowth || '');
      setNotes(recordToEdit.notes || '');
      setSelectedObjectiveIds(recordToEdit.objectives?.map((o) => o.objectiveId) || []);
    } else {
      const fallbackLearnerId = defaultLearnerId || (learners.length > 0 ? learners[0]!.id : '');
      setLearnerId(fallbackLearnerId);
      setSubjectId(subjects.length > 0 ? subjects[0]!.id : '');
      setType('PLANNED_LESSON');
      setTitle('');
      setDescription('');
      setDate(initialDate || new Date().toISOString().split('T')[0]!);
      setDurationMinutes('45');
      setMasteryLevel('DEVELOPING');
      setAssessmentMethod('OBSERVATION');
      setStrengths('');
      setAreasForGrowth('');
      setCharacterHabitGrowth('');
      setNotes('');
      setSelectedObjectiveIds([]);
    }
    setError(null);
  }, [recordToEdit, isOpen, initialDate, defaultLearnerId, learners, subjects]);

  const toggleObjective = (id: string) => {
    setSelectedObjectiveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredObjectives = objectives.filter(
    (obj) => (!learnerId || obj.learnerId === learnerId) && (!subjectId || obj.subjectId === subjectId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerId) {
      setError(t('records.formModal.selectLearnerError'));
      return;
    }
    if (!title.trim()) {
      setError(t('records.formModal.enterTitleError'));
      return;
    }
    if (!date) {
      setError(t('records.formModal.enterDateError'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const parsedDuration = durationMinutes ? parseInt(durationMinutes, 10) : undefined;

      const dto: CreateLearningRecordDto = {
        learnerId,
        subjectId: subjectId || undefined,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        durationMinutes: Number.isNaN(parsedDuration) ? undefined : parsedDuration,
        masteryLevel,
        assessmentMethod,
        strengths: strengths.trim() || undefined,
        areasForGrowth: areasForGrowth.trim() || undefined,
        characterHabitGrowth: characterHabitGrowth.trim() || undefined,
        notes: notes.trim() || undefined,
        objectiveIds: selectedObjectiveIds,
      };

      await onSave(dto);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('records.formModal.saveError');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recordToEdit ? t('records.formModal.editTitle') : t('records.formModal.newTitle')}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" data-testid="cancel-record-btn" onClick={onClose} disabled={submitting}>
            {t('records.formModal.cancelBtn')}
          </Button>
          <Button type="submit" form="record-form" data-testid="save-record-btn" isLoading={submitting}>
            {recordToEdit ? t('records.formModal.saveChangesBtn') : t('records.formModal.saveBtn')}
          </Button>
        </>
      }
    >
      <form id="record-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <Alert variant="error" data-testid="record-form-error">
            {error}
          </Alert>
        )}

        {/* Learner & Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label={t('records.formModal.learnerLabel')}
            data-testid="record-learner-select"
            value={learnerId}
            onChange={(e) => setLearnerId(e.target.value)}
            options={[
              { value: '', label: t('records.formModal.learnerPlaceholder') },
              ...learners.map((l) => ({ value: l.id, label: l.preferredName || l.firstName })),
            ]}
          />

          <Select
            label={t('records.formModal.typeLabel')}
            data-testid="record-type-select"
            value={type}
            onChange={(e) => setType(e.target.value as LearningRecordType)}
            options={Object.entries(RECORD_TYPE_LABELS).map(([key, item]) => {
              const transKey = RECORD_TYPE_KEY_MAP[key as LearningRecordType];
              return { value: key, label: transKey ? t(`records.recordTypes.${transKey}` as any) : item.label };
            })}
          />
        </div>

        <Input
          label={t('records.formModal.titleLabel')}
          data-testid="record-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('records.formModal.titlePlaceholder')}
        />

        {/* Subject & Date & Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem' }}>
          <Select
            label={t('records.formModal.subjectLabel')}
            data-testid="record-subject-select"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={[
              { value: '', label: t('records.formModal.subjectPlaceholder') },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          <Input
            label={t('records.formModal.dateLabel')}
            type="date"
            data-testid="record-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Input
            label={t('records.formModal.durationLabel')}
            type="number"
            data-testid="record-duration-input"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            min="1"
            max="1440"
            placeholder={t('records.formModal.durationPlaceholder')}
          />
        </div>

        <Textarea
          label={t('records.formModal.descriptionLabel')}
          data-testid="record-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={t('records.formModal.descriptionPlaceholder')}
        />

        {/* Mastery Level & Assessment Method */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label={t('records.formModal.masteryLabel')}
            data-testid="record-mastery-select"
            value={masteryLevel}
            onChange={(e) => setMasteryLevel(e.target.value as MasteryLevel)}
            options={Object.entries(MASTERY_CONFIG).map(([lvl, conf]) => {
              const transKey = MASTERY_KEY_MAP[lvl as MasteryLevel];
              return { value: lvl, label: transKey ? t(`records.mastery.${transKey}` as any) : conf.label };
            })}
          />

          <Select
            label={t('records.formModal.assessmentLabel')}
            data-testid="record-assessment-select"
            value={assessmentMethod}
            onChange={(e) => setAssessmentMethod(e.target.value as AssessmentMethod)}
            options={Object.entries(ASSESSMENT_LABELS).map(([k, label]) => {
              const transKey = ASSESSMENT_KEY_MAP[k as AssessmentMethod];
              return { value: k, label: transKey ? t(`records.assessmentMethods.${transKey}` as any) : label };
            })}
          />
        </div>

        {/* Qualitative Insights: Strengths & Growth */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Textarea
            label={t('records.formModal.strengthsLabel')}
            data-testid="record-strengths-input"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={2}
            placeholder={t('records.formModal.strengthsPlaceholder')}
          />

          <Textarea
            label={t('records.formModal.growthLabel')}
            data-testid="record-growth-input"
            value={areasForGrowth}
            onChange={(e) => setAreasForGrowth(e.target.value)}
            rows={2}
            placeholder={t('records.formModal.growthPlaceholder')}
          />
        </div>

        <Input
          label={t('records.formModal.habitLabel')}
          data-testid="record-habit-input"
          value={characterHabitGrowth}
          onChange={(e) => setCharacterHabitGrowth(e.target.value)}
          placeholder={t('records.formModal.habitPlaceholder')}
        />

        {/* Objectives Checkboxes */}
        {filteredObjectives.length > 0 && (
          <div>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem',
              }}
            >
              <AletheiaIcon name="sparkles" size={14} />
              <span>{t('records.formModal.objectivesLabel')}</span>
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid var(--border-light)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {filteredObjectives.map((obj) => (
                <Checkbox
                  key={obj.id}
                  data-testid={`record-objective-checkbox-${obj.id}`}
                  checked={selectedObjectiveIds.includes(obj.id)}
                  onChange={() => toggleObjective(obj.id)}
                  label={obj.title}
                />
              ))}
            </div>
          </div>
        )}

        <Textarea
          label={t('records.formModal.notesLabel')}
          data-testid="record-notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={t('records.formModal.notesPlaceholder')}
        />
      </form>
    </Modal>
  );
}
