'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select } from '@aletheia/ui';
import type {
  CreateScheduleSlotDto,
  DayOfWeek,
  LearnerSummaryDto,
  ScheduleSlotResponseDto,
  SubjectResponseDto,
  UpdateScheduleSlotDto,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

export interface RoutineSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave(dto: CreateScheduleSlotDto): Promise<void>;
  onUpdate?(slotId: string, dto: UpdateScheduleSlotDto): Promise<void>;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  initialDayOfWeek?: DayOfWeek;
  academicYearId?: string;
  slotToEdit?: ScheduleSlotResponseDto | null | undefined;
}

export const DAYS_OF_WEEK: Array<{ value: DayOfWeek; label: string }> = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export const DAY_OF_WEEK_KEYS: Record<DayOfWeek, string> = {
  1: 'lessons.routineModal.days.monday',
  2: 'lessons.routineModal.days.tuesday',
  3: 'lessons.routineModal.days.wednesday',
  4: 'lessons.routineModal.days.thursday',
  5: 'lessons.routineModal.days.friday',
  6: 'lessons.routineModal.days.saturday',
  7: 'lessons.routineModal.days.sunday',
};

export function RoutineSlotModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  learners,
  subjects,
  initialDayOfWeek = 1,
  academicYearId,
  slotToEdit,
}: RoutineSlotModalProps) {
  const { t } = useLocale();
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(initialDayOfWeek);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [subjectId, setSubjectId] = useState('');
  const [learnerId, setLearnerId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slotToEdit) {
      setTitle(slotToEdit.title);
      setDayOfWeek(slotToEdit.dayOfWeek);
      setStartTime(slotToEdit.startTime);
      setEndTime(slotToEdit.endTime);
      setSubjectId(slotToEdit.subjectId || '');
      setLearnerId(slotToEdit.learnerId || '');
      setLocation(slotToEdit.location || '');
      setDescription(slotToEdit.description || '');
      setColor(slotToEdit.color || '#3B82F6');
    } else {
      setTitle('');
      setDayOfWeek(initialDayOfWeek);
      setStartTime('08:00');
      setEndTime('09:00');
      setSubjectId('');
      setLearnerId('');
      setLocation('');
      setDescription('');
      setColor('#3B82F6');
    }
    setError(null);
  }, [slotToEdit, initialDayOfWeek, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('lessons.routineModal.titleRequiredError'));
      return;
    }
    if (!startTime || !endTime) {
      setError(t('lessons.routineModal.timeRequiredError'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const dto = {
        title: title.trim(),
        dayOfWeek: Number(dayOfWeek) as DayOfWeek,
        startTime,
        endTime,
        subjectId: subjectId || undefined,
        learnerId: learnerId || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        color: color || undefined,
        academicYearId: academicYearId || undefined,
      };
      if (slotToEdit && onUpdate) {
        await onUpdate(slotToEdit.id, dto);
      } else {
        await onSave(dto);
      }
      setTitle('');
      setDescription('');
      setLocation('');
      setSubjectId('');
      setLearnerId('');
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : (slotToEdit ? t('lessons.routineModal.updateError') : t('lessons.routineModal.saveError')),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={slotToEdit ? t('lessons.routineModal.titleEdit') : t('lessons.routineModal.titleNew')}
      maxWidth="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('lessons.routineModal.cancel')}
          </Button>
          <Button type="submit" form="routine-slot-form" data-testid="save-slot-btn" isLoading={loading}>
            {slotToEdit ? t('lessons.routineModal.saveChanges') : t('lessons.routineModal.save')}
          </Button>
        </>
      }
    >
      {error && (
        <Alert variant="error" data-testid="slot-form-error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      <form id="routine-slot-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input
          label={t('lessons.routineModal.activityTitleLabel')}
          data-testid="slot-title-input"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('lessons.routineModal.activityTitlePlaceholder')}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label={t('lessons.routineModal.weekdayLabel')}
            data-testid="slot-day-select"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value) as DayOfWeek)}
            options={DAYS_OF_WEEK.map((d) => ({
              value: String(d.value),
              label: t(DAY_OF_WEEK_KEYS[d.value] || '') || d.label,
            }))}
          />

          <Input
            label={t('lessons.routineModal.accentColorLabel')}
            type="color"
            data-testid="slot-color-input"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label={t('lessons.routineModal.startTimeLabel')}
            type="time"
            data-testid="slot-start-time-input"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label={t('lessons.routineModal.endTimeLabel')}
            type="time"
            data-testid="slot-end-time-input"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label={t('lessons.routineModal.subjectLabel')}
            data-testid="slot-subject-select"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={[
              { value: '', label: t('lessons.routineModal.noneGeneral') },
              ...subjects.map((sub) => ({ value: sub.id, label: sub.name })),
            ]}
          />

          <Select
            label={t('lessons.routineModal.learnerLabel')}
            data-testid="slot-learner-select"
            value={learnerId}
            onChange={(e) => setLearnerId(e.target.value)}
            options={[
              { value: '', label: t('lessons.routineModal.wholeFamily') },
              ...learners.map((l) => ({ value: l.id, label: l.preferredName || l.firstName })),
            ]}
          />
        </div>

        <Input
          label={t('lessons.routineModal.locationLabel')}
          data-testid="slot-location-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('lessons.routineModal.locationPlaceholder')}
        />
      </form>
    </Modal>
  );
}
