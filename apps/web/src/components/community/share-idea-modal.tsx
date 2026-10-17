'use client';

import React, { useEffect, useState } from 'react';
import type { CommunityIdeaTheme } from '@aletheia/contracts';
import { Alert, AletheiaIcon, Button, Checkbox, Input, Modal, Select, Textarea } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface ShareIdeaModalProps {
  isOpen: boolean;
  onClose(): void;
  onSubmit(data: {
    name: string;
    description: string;
    theme: CommunityIdeaTheme;
    materials: string[];
    ageMin: number;
    ageMax: number;
    estimatedDurationMinutes: number;
    supervisionRequired: boolean;
  }): Promise<void> | void;
  isSubmitting?: boolean | undefined;
}

export function ShareIdeaModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ShareIdeaModalProps) {
  const { t } = useLocale();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<CommunityIdeaTheme>('NATURE_STUDY');
  const [materials, setMaterials] = useState('');
  const [ageMin, setAgeMin] = useState(5);
  const [ageMax, setAgeMax] = useState(12);
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(45);
  const [supervisionRequired, setSupervisionRequired] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setTheme('NATURE_STUDY');
      setMaterials('');
      setAgeMin(5);
      setAgeMax(12);
      setEstimatedDurationMinutes(45);
      setSupervisionRequired(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) return;

    const parsedMaterials = materials
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const normalizedAgeMin = Math.min(ageMin, ageMax);
    const normalizedAgeMax = Math.max(ageMin, ageMax);

    void onSubmit({
      name: trimmedName,
      description: trimmedDescription,
      theme,
      materials: parsedMaterials,
      ageMin: normalizedAgeMin,
      ageMax: normalizedAgeMax,
      estimatedDurationMinutes,
      supervisionRequired,
    });
  };

  const themeOptions: Array<{ value: CommunityIdeaTheme; label: string }> = [
    { value: 'NATURE_STUDY', label: t('community.themes.natureStudy') },
    { value: 'LIVING_BOOKS', label: t('community.themes.livingBooks') },
    { value: 'HANDICRAFT', label: t('community.themes.handicraft') },
    { value: 'SEASONAL_HISTORY', label: t('community.themes.seasonalHistory') },
    { value: 'FAMILY_PROJECTS', label: t('community.themes.familyProjects') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('community.shareModal.title')}
      description={t('community.shareModal.subtitle')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="community-modal-form" data-testid="share-idea-form">
        <div className="community-modal-privacy">
          <Alert variant="info" icon={<AletheiaIcon name="shield-check" size={18} />}>
            <span>{t('community.shareModal.privacyNotice')}</span>
          </Alert>
        </div>

        <Input
          label={t('community.shareModal.nameLabel')}
          placeholder={t('community.shareModal.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
        />

        <Textarea
          label={t('community.shareModal.descriptionLabel')}
          placeholder={t('community.shareModal.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          required
        />

        <Select
          label={t('community.shareModal.themeLabel')}
          options={themeOptions}
          value={theme}
          onChange={(e) => setTheme(e.target.value as CommunityIdeaTheme)}
          disabled={isSubmitting}
        />

        <Input
          label={t('community.shareModal.materialsLabel')}
          placeholder={t('community.shareModal.materialsPlaceholder')}
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          disabled={isSubmitting}
        />

        <div className="community-modal-row">
          <Input
            type="number"
            min={1}
            max={18}
            label={t('community.shareModal.ageMinLabel')}
            value={ageMin}
            onChange={(e) => setAgeMin(Number(e.target.value) || 0)}
            disabled={isSubmitting}
            required
          />

          <Input
            type="number"
            min={1}
            max={18}
            label={t('community.shareModal.ageMaxLabel')}
            value={ageMax}
            onChange={(e) => setAgeMax(Number(e.target.value) || 0)}
            disabled={isSubmitting}
            required
          />
        </div>

        <Input
          type="number"
          min={5}
          max={360}
          label={t('community.shareModal.durationLabel')}
          value={estimatedDurationMinutes}
          onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value) || 0)}
          disabled={isSubmitting}
          required
        />

        <Checkbox
          label={t('community.shareModal.supervisionLabel')}
          checked={supervisionRequired}
          onChange={(e) => setSupervisionRequired(e.target.checked)}
          disabled={isSubmitting}
        />

        <div className="community-modal-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('community.shareModal.cancelBtn')}
          </Button>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || !name.trim() || !description.trim()}
          >
            {isSubmitting ? t('community.shareModal.submitting') : t('community.shareModal.submitBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
