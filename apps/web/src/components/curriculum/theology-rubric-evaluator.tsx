'use client';

import React, { useState } from 'react';
import {
  SEMINARY_THEOLOGY_RUBRIC_DEFINITION,
  type SeminaryTheologyRubric,
  type SeminaryRubricCriterion,
} from '@aletheia/contracts';
import { Button, Card } from '@aletheia/ui';

export interface SeminaryCriterionEvaluation {
  criterionCode: string;
  score: number; // 1 to 4
  weight: number;
}

export interface SeminaryEvaluationResult {
  scores: SeminaryCriterionEvaluation[];
  weightedScore: number; // 0 to 10
  notes?: string | undefined;
  includeInPortfolio: boolean;
}

export interface TheologyRubricEvaluatorProps {
  rubric?: SeminaryTheologyRubric;
  onSaveEvaluation: (result: SeminaryEvaluationResult) => Promise<void> | void;
  readOnly?: boolean;
}

const MASTERY_LEVELS = [
  { level: 1, label: 'Inicial', shortDesc: 'Compreensão rudimentar ou com lacunas conceituais' },
  { level: 2, label: 'Em Desenvolvimento', shortDesc: 'Compreensão básica com aplicação parcial' },
  { level: 3, label: 'Proficiente', shortDesc: 'Domínio sólido, fundamentação consistente e rigor' },
  { level: 4, label: 'Avançado', shortDesc: 'Excepcional profundidade, erudição e síntese madura' },
] as const;

function calculateWeightedScore(
  criteria: SeminaryRubricCriterion[],
  scores: Record<string, number>
): number {
  const rawSum = criteria.reduce((sum, crit) => {
    const score = scores[crit.code] ?? 3;
    return sum + crit.weight * score;
  }, 0);
  return Math.round((rawSum * 2.5 + Number.EPSILON) * 10) / 10;
}

export function TheologyRubricEvaluator({
  rubric = SEMINARY_THEOLOGY_RUBRIC_DEFINITION,
  onSaveEvaluation,
  readOnly = false,
}: TheologyRubricEvaluatorProps) {
  const criteria = rubric.criteria;

  // Initial score default: 3 (Proficiente) for each criterion
  const [scores, setScores] = useState<Record<string, number>>(() =>
    criteria.reduce<Record<string, number>>((acc, crit) => {
      acc[crit.code] = 3;
      return acc;
    }, {})
  );

  const [includeInPortfolio, setIncludeInPortfolio] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const weightedScore = calculateWeightedScore(criteria, scores);

  const handleScoreChange = (criterionCode: string, level: number) => {
    if (readOnly) return;
    setScores((prev) => ({
      ...prev,
      [criterionCode]: level,
    }));
  };

  const handleSave = async () => {
    if (readOnly || isSaving) return;

    const evaluationResult: SeminaryEvaluationResult = {
      scores: criteria.map((c) => ({
        criterionCode: c.code,
        score: scores[c.code] ?? 3,
        weight: c.weight,
      })),
      weightedScore,
      notes: notes.trim() ? notes.trim() : undefined,
      includeInPortfolio,
    };

    try {
      setIsSaving(true);
      await onSaveEvaluation(evaluationResult);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      data-testid="theology-rubric-evaluator"
      style={{
        padding: '1.75rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--gold-dark)',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
            }}
          >
            {rubric.code}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--forest)',
            }}
          >
            {rubric.name}
          </h3>
          {rubric.description && (
            <p
              style={{
                margin: '0.35rem 0 0 0',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              {rubric.description}
            </p>
          )}
        </div>

        {/* Real-time Weighted Score Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(56, 102, 65, 0.08)',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(56, 102, 65, 0.2)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--forest)',
              letterSpacing: '0.04em',
            }}
          >
            Nota Ponderada Final
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
            <span
              data-testid="weighted-score-display"
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--forest)',
                lineHeight: 1,
              }}
            >
              {weightedScore.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              / 10.0
            </span>
          </div>
        </div>
      </div>

      {/* Criteria Evaluation List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {criteria.map((criterion) => {
          const currentScore = scores[criterion.code] ?? 3;
          const percentageWeight = Math.round(criterion.weight * 100);

          return (
            <div
              key={criterion.code}
              data-testid={`criterion-card-${criterion.code}`}
              style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'rgba(0, 0, 0, 0.015)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--forest)',
                    }}
                  >
                    {criterion.name}
                  </h4>
                  {criterion.description && (
                    <p
                      style={{
                        margin: '0.2rem 0 0 0',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {criterion.description}
                    </p>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(56, 102, 65, 0.1)',
                    color: 'var(--forest)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Peso: {percentageWeight}% ({criterion.weight})
                </span>
              </div>

              {/* 4 Mastery Level Selection Buttons */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {MASTERY_LEVELS.map(({ level, label, shortDesc }) => {
                  const isSelected = currentScore === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      data-testid={`criterion-level-${criterion.code}-${level}`}
                      disabled={readOnly}
                      onClick={() => handleScoreChange(criterion.code, level)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '2px solid var(--forest)'
                          : '1px solid var(--border-light)',
                        backgroundColor: isSelected
                          ? 'rgba(56, 102, 65, 0.12)'
                          : 'var(--bg-surface)',
                        color: isSelected ? 'var(--forest)' : 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: readOnly ? 'default' : 'pointer',
                        opacity: readOnly ? 0.75 : 1,
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {level}: {label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: isSelected ? 'var(--forest)' : 'var(--text-secondary)',
                          lineHeight: 1.25,
                        }}
                      >
                        {shortDesc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Portfolio Checkbox & Notes Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1.25rem',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: readOnly ? 'default' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <input
            type="checkbox"
            data-testid="portfolio-checkbox"
            checked={includeInPortfolio}
            onChange={(e) => setIncludeInPortfolio(e.target.checked)}
            disabled={readOnly}
            style={{ width: '1.1rem', height: '1.1rem', cursor: readOnly ? 'default' : 'pointer' }}
          />
          Incluir no Portfólio Teológico
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label
            htmlFor="evaluation-notes"
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Parecer Teológico & Observações Analíticas (opcional)
          </label>
          <textarea
            id="evaluation-notes"
            data-testid="evaluation-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={readOnly}
            placeholder="Aponte considerações sobre a metodologia exegética, consistência dogmática e uso de fontes primárias..."
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* Save Action */}
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <Button
            type="button"
            variant="primary"
            data-testid="save-evaluation-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Gravando Avaliação...' : 'Salvar Avaliação da Rubrica'}
          </Button>
        </div>
      )}
    </Card>
  );
}
