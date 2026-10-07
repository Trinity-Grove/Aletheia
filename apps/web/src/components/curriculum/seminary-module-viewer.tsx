'use client';

import React, { useState } from 'react';
import { Button, Card } from '@aletheia/ui';
import {
  SEMINARY_CYCLES_METADATA,
  type SeminaryDiscipline,
} from '@aletheia/contracts';
import { TheologicalLensCard } from './theological-lens-card';
import {
  SeminaryPaperSubmissionModal,
  type SeminaryPaperSubmissionData,
} from './seminary-paper-submission-modal';
import { useLocale } from '../../lib/i18n/locale-context';

const DEFAULT_CYCLE = SEMINARY_CYCLES_METADATA[0]!;
const DEFAULT_DISCIPLINE = DEFAULT_CYCLE.disciplines[0]!;

export interface SeminaryModuleViewerProps {
  preferredTraditionCode?: string | null | undefined;
  onSelectEvidenceSubmission?(discipline: SeminaryDiscipline): void;
  onSubmitPaper?(data: SeminaryPaperSubmissionData): Promise<void>;
}

export function SeminaryModuleViewer({
  preferredTraditionCode,
  onSelectEvidenceSubmission,
  onSubmitPaper,
}: SeminaryModuleViewerProps) {
  const { t } = useLocale();

  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

  const [activeCycleNumber, setActiveCycleNumber] = useState<number>(1);
  const activeCycle =
    SEMINARY_CYCLES_METADATA.find((c) => c.cycle === activeCycleNumber) ?? DEFAULT_CYCLE;

  const [selectedDisciplineCode, setSelectedDisciplineCode] = useState<string>(
    DEFAULT_DISCIPLINE.code
  );

  const activeDiscipline: SeminaryDiscipline =
    activeCycle.disciplines.find((d) => d.code === selectedDisciplineCode) ??
    activeCycle.disciplines[0] ??
    DEFAULT_DISCIPLINE;

  const handleCycleChange = (cycleNum: number) => {
    setActiveCycleNumber(cycleNum);
    const targetCycle = SEMINARY_CYCLES_METADATA.find((c) => c.cycle === cycleNum);
    const firstDiscipline = targetCycle?.disciplines[0];
    if (firstDiscipline) {
      setSelectedDisciplineCode(firstDiscipline.code);
    }
  };

  const isEschatologyMillennium =
    activeDiscipline.code === 'THEO.ADV.ESCHATOLOGY_MILLENNIUM';
  const isApocalypseModels =
    activeDiscipline.code === 'THEO.ADV.APOCALYPSE_MODELS';

  return (
    <div
      data-testid="seminary-module-viewer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1.5rem',
        }}
      >
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--gold-dark)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '0.5rem',
          }}
        >
          {t('curriculum.seminary.title')}
        </div>
        <h2
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--forest)',
          }}
        >
          {t('curriculum.seminary.title')}
        </h2>
        <p
          style={{
            margin: 0,
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            maxWidth: '850px',
            lineHeight: 1.5,
          }}
        >
          {t('curriculum.seminary.subtitle')}
        </p>
      </div>

      {/* Cycle Selector Tabs */}
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {SEMINARY_CYCLES_METADATA.map((c) => {
            const isActive = c.cycle === activeCycleNumber;
            const cycleTitle = t(`curriculum.seminary.cycles.cycle${c.cycle}Title`);
            return (
              <button
                key={c.cycle}
                data-testid={`cycle-tab-${c.cycle}`}
                onClick={() => handleCycleChange(c.cycle)}
                type="button"
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: isActive
                    ? '2px solid var(--forest)'
                    : '1px solid var(--border-light)',
                  backgroundColor: isActive
                    ? 'rgba(56, 102, 65, 0.08)'
                    : 'var(--bg-surface)',
                  color: isActive ? 'var(--forest)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isActive ? 'var(--forest)' : 'var(--text-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {t('curriculum.seminary.cycleLabel', { cycle: c.cycle })}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.925rem',
                    lineHeight: 1.3,
                  }}
                >
                  {cycleTitle}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.35rem',
                  }}
                >
                  {t('curriculum.seminary.disciplineCount', {
                    count: c.disciplines.length,
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Cycle Content Grid: Sidebar of disciplines + Details Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Disciplines Sidebar List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            padding: '0.75rem',
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.5rem 0.25rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
            }}
          >
            {t(`curriculum.seminary.cycles.cycle${activeCycle.cycle}Title`)}
          </div>
          {activeCycle.disciplines.map((discipline) => {
            const isSelected = discipline.code === activeDiscipline.code;
            return (
              <button
                key={discipline.code}
                data-testid={`discipline-item-${discipline.code}`}
                onClick={() => setSelectedDisciplineCode(discipline.code)}
                type="button"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected
                    ? '1.5px solid var(--forest)'
                    : '1px solid transparent',
                  backgroundColor: isSelected
                    ? 'rgba(56, 102, 65, 0.08)'
                    : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'var(--forest)' : 'var(--text-primary)',
                  }}
                >
                  {discipline.name}
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {discipline.competencyCode}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Discipline Details */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Main Card with Discipline Overview */}
          <Card
            style={{
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <span
                  data-testid="competency-badge"
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: 'var(--forest)',
                    backgroundColor: 'rgba(56, 102, 65, 0.1)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {activeDiscipline.competencyCode}
                </span>
                <h3
                  data-testid="active-discipline-title"
                  style={{
                    margin: 0,
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'var(--forest)',
                  }}
                >
                  {activeDiscipline.name}
                </h3>
              </div>

              {/* Submit paper button */}
              <Button
                data-testid="submit-paper-btn"
                variant="primary"
                onClick={() => {
                  setIsSubmissionModalOpen(true);
                  if (onSelectEvidenceSubmission) {
                    onSelectEvidenceSubmission(activeDiscipline);
                  }
                }}
              >
                {t('curriculum.seminary.submitPaperBtn')} 📤
              </Button>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.95rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
              }}
            >
              {activeDiscipline.description}
            </p>

            {/* Topics Section */}
            <div>
              <h4
                style={{
                  margin: '0 0 0.65rem 0',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--forest)',
                }}
              >
                {t('curriculum.seminary.topicsLabel')}
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                {activeDiscipline.topics.map((topic, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: 1.45,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary Readings Section */}
            {activeDiscipline.primaryReadings &&
              activeDiscipline.primaryReadings.length > 0 && (
                <div>
                  <h4
                    style={{
                      margin: '0 0 0.65rem 0',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--forest)',
                    }}
                  >
                    {t('curriculum.seminary.readingsLabel')}
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    {activeDiscipline.primaryReadings.map((reading, idx) => (
                      <li
                        key={idx}
                        style={{
                          fontSize: '0.875rem',
                          lineHeight: 1.45,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <em>{reading}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Suggested Evidence Formats */}
            {activeDiscipline.suggestedEvidenceTypes &&
              activeDiscipline.suggestedEvidenceTypes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t('curriculum.seminary.suggestedEvidenceLabel')}:
                  </span>
                  {activeDiscipline.suggestedEvidenceTypes.map((typeCode) => (
                    <span
                      key={typeCode}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {typeCode}
                    </span>
                  ))}
                </div>
              )}
          </Card>

          {/* Millennium Schools Matrix (Only when active is THEO.ADV.ESCHATOLOGY_MILLENNIUM) */}
          {isEschatologyMillennium && (
            <div
              data-testid="millennial-schools-section"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: '1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--gold-dark)',
                  letterSpacing: '0.05em',
                  marginBottom: '0.35rem',
                }}
              >
                {t('curriculum.seminary.eschatologySchoolsTitle')}
              </div>
              <h4
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--forest)',
                }}
              >
                {t('curriculum.seminary.eschatologySchoolsTitle')}
              </h4>
              <p
                style={{
                  margin: '0 0 1.25rem 0',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}
              >
                {t('curriculum.seminary.eschatologySchoolsDescription')}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.millennialSchools.historicPremillennialism')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.millennialSchools.historicPremillennialismDesc')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.millennialSchools.dispensationalPremillennialism')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.millennialSchools.dispensationalPremillennialismDesc')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.millennialSchools.amillennialism')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.millennialSchools.amillennialismDesc')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.millennialSchools.postmillennialism')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.millennialSchools.postmillennialismDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Apocalypse Models Section (Only when active is THEO.ADV.APOCALYPSE_MODELS) */}
          {isApocalypseModels && (
            <div
              data-testid="apocalypse-models-section"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: '1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--gold-dark)',
                  letterSpacing: '0.05em',
                  marginBottom: '0.35rem',
                }}
              >
                {t('curriculum.seminary.apocalypseModelsTitle')}
              </div>
              <h4
                style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--forest)',
                }}
              >
                {t('curriculum.seminary.apocalypseModelsTitle')}
              </h4>
              <p
                style={{
                  margin: '0 0 1.25rem 0',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                }}
              >
                {t('curriculum.seminary.apocalypseModelsDescription')}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.apocalypseModels.preterist')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.apocalypseModels.preteristDesc')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.apocalypseModels.historicist')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.apocalypseModels.historicistDesc')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.apocalypseModels.idealist')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.apocalypseModels.idealistDesc')}
                  </p>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'rgba(0,0,0,0.01)',
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--forest)', marginBottom: '0.35rem' }}>
                    {t('curriculum.seminary.apocalypseModels.futurist')}
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {t('curriculum.seminary.apocalypseModels.futuristDesc')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contextual Theological Lens Card */}
          <TheologicalLensCard
            preferredTraditionCode={preferredTraditionCode}
            disciplineCode={activeDiscipline.code}
            disciplineName={activeDiscipline.name}
          />
        </div>
      </div>

      {/* Seminary Paper Submission Modal */}
      <SeminaryPaperSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        discipline={activeDiscipline}
        onSubmit={async (data) => {
          if (onSubmitPaper) {
            await onSubmitPaper(data);
          }
        }}
      />
    </div>
  );
}
