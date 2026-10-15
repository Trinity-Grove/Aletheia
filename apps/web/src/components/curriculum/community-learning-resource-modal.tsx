'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Card } from '@aletheia/ui';
import type {
  CreateFamilyLearningResourceDto,
  FamilyLearningResourceResponseDto,
  FamilyLearningResourceType,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';

interface CommunityLearningResourceModalProps {
  isOpen: boolean;
  familyId: string;
  resource: FamilyLearningResourceResponseDto | null;
  onClose(): void;
  onSaved(resource: FamilyLearningResourceResponseDto): void;
}

function contentToFields(resource: FamilyLearningResourceResponseDto | null) {
  const content = resource?.content;
  if (!content || content.kind === 'MATERIAL') {
    return {
      type: resource?.resourceType ?? 'MATERIAL' as FamilyLearningResourceType,
      materials: content?.kind === 'MATERIAL' ? content.items.map((item) => item.value).join('\n') : '',
      objective: '',
      duration: '45',
      steps: '',
      homework: '',
      slots: '',
    };
  }
  if (content.kind === 'LESSON_PLAN') {
    return {
      type: 'LESSON_PLAN' as FamilyLearningResourceType,
      materials: content.materials.join('\n'),
      objective: content.objective ?? '',
      duration: String(content.durationMinutes),
      steps: content.steps.map((step) => step.title).join('\n'),
      homework: content.homework ?? '',
      slots: '',
    };
  }
  return {
    type: 'CHRONOGRAM' as FamilyLearningResourceType,
    materials: '',
    objective: '',
    duration: '45',
    steps: '',
    homework: '',
    slots: content.slots.map((slot) => `${slot.dayOfWeek},${slot.startTime},${slot.endTime},${slot.title}`).join('\n'),
  };
}

export function CommunityLearningResourceModal({
  isOpen,
  familyId,
  resource,
  onClose,
  onSaved,
}: CommunityLearningResourceModalProps) {
  const { t } = useLocale();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [resourceType, setResourceType] = useState<FamilyLearningResourceType>('MATERIAL');
  const [materials, setMaterials] = useState('');
  const [objective, setObjective] = useState('');
  const [duration, setDuration] = useState('45');
  const [steps, setSteps] = useState('');
  const [homework, setHomework] = useState('');
  const [slots, setSlots] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fields = contentToFields(resource);
    setTitle(resource?.title ?? '');
    setDescription(resource?.description ?? '');
    setSubject(resource?.subject ?? '');
    setResourceType(fields.type);
    setMaterials(fields.materials);
    setObjective(fields.objective);
    setDuration(fields.duration);
    setSteps(fields.steps);
    setHomework(fields.homework);
    setSlots(fields.slots);
    setVisibility(resource?.visibility ?? 'PRIVATE');
    setError(null);
  }, [isOpen, resource]);

  if (!isOpen) return null;

  const buildContent = () => {
    if (resourceType === 'MATERIAL') {
      return {
        kind: 'MATERIAL' as const,
        items: materials.split('\n').map((value) => value.trim()).filter(Boolean).map((value) => ({
          type: 'TEXT' as const,
          title: value.slice(0, 160),
          value,
        })),
      };
    }
    if (resourceType === 'LESSON_PLAN') {
      return {
        kind: 'LESSON_PLAN' as const,
        objective: objective.trim() || null,
        durationMinutes: Number(duration),
        materials: materials.split('\n').map((value) => value.trim()).filter(Boolean),
        steps: steps.split('\n').map((value) => value.trim()).filter(Boolean).map((value) => ({ title: value })),
        homework: homework.trim() || null,
      };
    }
    return {
      kind: 'CHRONOGRAM' as const,
      cadence: 'WEEKLY' as const,
      slots: slots.split('\n').map((line) => line.split(',').map((part) => part.trim())).filter((parts) => parts.length >= 4).map(([day, startTime, endTime, ...titleParts]) => ({
        dayOfWeek: Number(day),
        startTime,
        endTime,
        title: titleParts.join(', '),
      })),
    };
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError(t('curriculum.communityResources.titleRequired'));
      return;
    }
    const content = buildContent();
    if (content.items?.length === 0 || content.steps?.length === 0 || content.slots?.length === 0) {
      setError(t('curriculum.communityResources.contentRequired'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateFamilyLearningResourceDto = {
        resourceType,
        title: title.trim(),
        description: description.trim() || null,
        subject: subject.trim() || null,
        content,
        visibility,
      } as CreateFamilyLearningResourceDto;
      const response = await fetch(
        resource
          ? `/api/v1/families/${familyId}/learning-resources/${resource.id}`
          : `/api/v1/families/${familyId}/learning-resources`,
        {
          method: resource ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error('save-resource');
      onSaved(await response.json() as FamilyLearningResourceResponseDto);
      onClose();
    } catch {
      setError(t('curriculum.communityResources.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="community-resource-modal" role="dialog" aria-modal="true" aria-labelledby="community-resource-modal-title">
      <Card className="community-resource-modal__panel">
        <div className="community-resource-modal__header">
          <h2 id="community-resource-modal-title">{resource ? t('curriculum.communityResources.editTitle') : t('curriculum.communityResources.createTitle')}</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>{t('curriculum.communityResources.cancel')}</Button>
        </div>
        {error && <Alert variant="error" data-testid="learning-resource-form-error">{error}</Alert>}
        <div className="community-resource-modal__form">
          <label htmlFor="learning-resource-type">{t('curriculum.communityResources.typeLabel')}</label>
          <select id="learning-resource-type" value={resourceType} onChange={(event) => setResourceType(event.target.value as FamilyLearningResourceType)} disabled={Boolean(resource)}>
            <option value="MATERIAL">{t('curriculum.communityResources.typeMaterial')}</option>
            <option value="LESSON_PLAN">{t('curriculum.communityResources.typeLessonPlan')}</option>
            <option value="CHRONOGRAM">{t('curriculum.communityResources.typeChronogram')}</option>
          </select>
          <label htmlFor="learning-resource-title">{t('curriculum.communityResources.titleLabel')}</label>
          <input id="learning-resource-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          <label htmlFor="learning-resource-description">{t('curriculum.communityResources.descriptionLabel')}</label>
          <textarea id="learning-resource-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
          <label htmlFor="learning-resource-subject">{t('curriculum.communityResources.subjectLabel')}</label>
          <input id="learning-resource-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />

          {resourceType === 'MATERIAL' && (
            <>
              <label htmlFor="learning-resource-materials">{t('curriculum.communityResources.materialsLabel')}</label>
              <textarea id="learning-resource-materials" aria-label={t('curriculum.communityResources.materialsLabel')} value={materials} onChange={(event) => setMaterials(event.target.value)} rows={6} placeholder={t('curriculum.communityResources.materialsPlaceholder')} />
            </>
          )}
          {resourceType === 'LESSON_PLAN' && (
            <>
              <label htmlFor="learning-resource-objective">{t('curriculum.communityResources.objectiveLabel')}</label>
              <textarea id="learning-resource-objective" value={objective} onChange={(event) => setObjective(event.target.value)} rows={2} />
              <label htmlFor="learning-resource-duration">{t('curriculum.communityResources.durationLabel')}</label>
              <input id="learning-resource-duration" type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} />
              <label htmlFor="learning-resource-steps">{t('curriculum.communityResources.stepsLabel')}</label>
              <textarea id="learning-resource-steps" value={steps} onChange={(event) => setSteps(event.target.value)} rows={5} placeholder={t('curriculum.communityResources.stepsPlaceholder')} />
              <label htmlFor="learning-resource-materials">{t('curriculum.communityResources.materialsLabel')}</label>
              <textarea id="learning-resource-materials" value={materials} onChange={(event) => setMaterials(event.target.value)} rows={3} />
              <label htmlFor="learning-resource-homework">{t('curriculum.communityResources.homeworkLabel')}</label>
              <textarea id="learning-resource-homework" value={homework} onChange={(event) => setHomework(event.target.value)} rows={2} />
            </>
          )}
          {resourceType === 'CHRONOGRAM' && (
            <>
              <label htmlFor="learning-resource-slots">{t('curriculum.communityResources.slotsLabel')}</label>
              <textarea id="learning-resource-slots" value={slots} onChange={(event) => setSlots(event.target.value)} rows={6} placeholder={t('curriculum.communityResources.slotsPlaceholder')} />
            </>
          )}

          <label htmlFor="learning-resource-visibility">{t('curriculum.communityResources.visibilityLabel')}</label>
          <select id="learning-resource-visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as 'PRIVATE' | 'PUBLIC')}>
            <option value="PRIVATE">{t('curriculum.communityResources.privateOption')}</option>
            <option value="PUBLIC">{t('curriculum.communityResources.publicOption')}</option>
          </select>
          <p className="community-resource-modal__help">{t('curriculum.communityResources.visibilityHelp')}</p>
          <Button data-testid="save-learning-resource-button" variant="primary" onClick={() => void handleSave()} isLoading={saving}>
            {t('curriculum.communityResources.save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
