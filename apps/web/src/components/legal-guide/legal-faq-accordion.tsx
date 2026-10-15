'use client';

import React, { useState } from 'react';
import {
  AletheiaIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@aletheia/ui';
import { useLocale } from '../../lib/i18n/locale-context';

export interface LegalFaqAccordionProps {
  className?: string | undefined;
}

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const;

export function LegalFaqAccordion({ className = '' }: LegalFaqAccordionProps) {
  const { t } = useLocale();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const handleToggle = (key: string) => {
    setOpenItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <Card
      className={`legal-faq-card ${className}`.trim()}
      data-testid="legal-faq-accordion"
    >
      <CardHeader className="legal-faq-header">
        <CardTitle as="h2" className="legal-faq-title">
          {t('legalGuide.faq.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="legal-faq-content">
        <div className="legal-faq-list">
          {FAQ_KEYS.map((key) => {
            const isOpen = openItems.includes(key);
            const questionText = t(`legalGuide.faq.${key}.question`);
            const answerText = t(`legalGuide.faq.${key}.answer`);

            return (
              <div
                key={key}
                className={`legal-faq-item ${
                  isOpen ? 'legal-faq-item--open' : ''
                }`.trim()}
              >
                <button
                  type="button"
                  className="legal-faq-button"
                  onClick={() => handleToggle(key)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${key}`}
                >
                  <span className="legal-faq-question-text">{questionText}</span>
                  <span className="legal-faq-icon" aria-hidden="true">
                    <AletheiaIcon
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                    />
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${key}`}
                    className="legal-faq-answer"
                    data-testid={`faq-answer-${key}`}
                  >
                    <p className="legal-faq-answer-text">{answerText}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
