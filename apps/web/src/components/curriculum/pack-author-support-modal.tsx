'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal } from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface PackAuthorSupportModalProps {
  isOpen: boolean;
  authorName: string;
  packName: string;
  pixKey?: string | null | undefined;
  onClose: () => void;
}

export function PackAuthorSupportModal({
  isOpen,
  authorName,
  packName,
  pixKey,
  onClose,
}: PackAuthorSupportModalProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyPix = async () => {
    if (!pixKey) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(pixKey);
        setCopied(true);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setCopied(false);
          copyTimeoutRef.current = null;
        }, 3000);
      }
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('curriculum.marketplace.voluntarySupport.title')}
      maxWidth="md"
    >
      <div
        data-testid="pack-author-support-modal"
        style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0' }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#FEFCE8',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid #FEF08A',
            color: '#854D0E',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            <span>💛</span>
            <span>{t('curriculum.marketplace.voluntarySupport.subtitle') || 'Apoio Comunitário'}</span>
          </div>
          <p style={{ margin: 0 }}>
            {t('curriculum.marketplace.voluntarySupport.description')}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '0.75rem 1rem',
            alignItems: 'baseline',
            backgroundColor: 'var(--bg-canvas, #F8FAFC)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--border-light, #E2E8F0)',
            fontSize: '0.9375rem',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-secondary, #64748B)' }}>
            {t('curriculum.marketplace.voluntarySupport.authorLabel')}
          </span>
          <span style={{ fontWeight: 700, color: 'var(--forest, #1E293B)' }}>
            {authorName}
          </span>

          <span style={{ fontWeight: 600, color: 'var(--text-secondary, #64748B)' }}>
            {t('curriculum.marketplace.voluntarySupport.packLabel')}
          </span>
          <span style={{ color: 'var(--text-primary, #0F172A)' }}>
            {packName}
          </span>
        </div>

        {pixKey && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1rem 1.25rem',
              backgroundColor: '#F0FDF4',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid #BBF7D0',
            }}
          >
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#166534',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {t('curriculum.marketplace.voluntarySupport.pixKeyLabel')}
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <code
                data-testid="author-pix-key"
                style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  backgroundColor: '#DCFCE7',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '4px',
                  color: '#14532D',
                  wordBreak: 'break-all',
                }}
              >
                {pixKey}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyPix}
                data-testid="copy-pix-btn"
                style={{ fontWeight: 600 }}
              >
                {copied
                  ? `✓ ${t('curriculum.marketplace.voluntarySupport.copiedPix')}`
                  : `📋 ${t('curriculum.marketplace.voluntarySupport.copyPixBtn')}`}
              </Button>
            </div>
          </div>
        )}

        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary, #64748B)', fontStyle: 'italic' }}>
          {t('curriculum.marketplace.voluntarySupport.disclaimer')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            data-testid="close-author-support-modal-btn"
          >
            {t('curriculum.marketplace.voluntarySupport.closeBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
