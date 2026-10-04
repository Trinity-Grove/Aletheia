'use client';

import React from 'react';
import { Alert, Button, Modal } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface AiConsentNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSettings?: () => void;
}

export function AiConsentNoticeModal({
  isOpen,
  onClose,
  onGoToSettings,
}: AiConsentNoticeModalProps) {
  const { t } = useLocale();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('lessons.aiAssistant.consentNoticeTitle')}
      maxWidth="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <Button
            variant="secondary"
            data-testid="ai-consent-close-btn"
            onClick={onClose}
          >
            {t('lessons.aiAssistant.closeButton')}
          </Button>
          <Button
            variant="primary"
            data-testid="ai-consent-settings-link"
            onClick={() => {
              if (onGoToSettings) {
                onGoToSettings();
              } else if (typeof window !== 'undefined') {
                window.location.href = '/settings';
              }
            }}
          >
            {t('lessons.aiAssistant.goToConsentButton')}
          </Button>
        </div>
      }
    >
      <div
        data-testid="ai-consent-notice-modal"
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <Alert variant="warning" title={t('lessons.aiAssistant.consentNoticeTitle')}>
          {t('lessons.aiAssistant.consentNoticeDescription')}
        </Alert>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {t('lessons.aiAssistant.coppaBadge')}
        </p>
      </div>
    </Modal>
  );
}
