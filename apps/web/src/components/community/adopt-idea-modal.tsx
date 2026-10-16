'use client';

import React, { useEffect, useState } from 'react';
import type { CommunityActivityResponseDto } from '@aletheia/contracts';
import { Button, Modal, Select } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface AdoptIdeaModalProps {
  isOpen: boolean;
  idea: CommunityActivityResponseDto | null;
  learners?: Array<{ id: string; name: string }> | undefined;
  onClose(): void;
  onConfirm(data: {
    ideaId: string;
    learnerId?: string | undefined;
  }): Promise<void> | void;
  isAdopting?: boolean | undefined;
}

export function AdoptIdeaModal({
  isOpen,
  idea,
  learners,
  onClose,
  onConfirm,
  isAdopting = false,
}: AdoptIdeaModalProps) {
  const { t } = useLocale();
  const [selectedLearnerId, setSelectedLearnerId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedLearnerId('');
    }
  }, [isOpen, idea]);

  if (!isOpen || !idea) return null;

  const handleConfirm = () => {
    if (isAdopting) return;
    void onConfirm({
      ideaId: idea.id,
      learnerId: selectedLearnerId ? selectedLearnerId : undefined,
    });
  };

  const learnerOptions = [
    { value: '', label: t('community.adoptModal.allLearnersOption') },
    ...(learners?.map((learner) => ({
      value: learner.id,
      label: learner.name,
    })) ?? []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('community.adoptModal.title')}
      description={t('community.adoptModal.subtitle')}
      maxWidth="md"
    >
      <div className="community-modal-form" data-testid="adopt-idea-modal">
        <div className="community-modal-summary">
          <h4 className="community-modal-summary__title">{idea.name}</h4>
          {idea.description && (
            <p className="community-modal-summary__description">{idea.description}</p>
          )}
        </div>

        {learners && learners.length > 0 && (
          <Select
            label={t('community.adoptModal.learnerSelectLabel')}
            options={learnerOptions}
            value={selectedLearnerId}
            onChange={(e) => setSelectedLearnerId(e.target.value)}
            disabled={isAdopting}
          />
        )}

        <div className="community-modal-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isAdopting}
          >
            {t('community.adoptModal.cancelBtn')}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            isLoading={isAdopting}
            disabled={isAdopting}
          >
            {isAdopting ? t('community.adoptModal.adopting') : t('community.adoptModal.confirmBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
