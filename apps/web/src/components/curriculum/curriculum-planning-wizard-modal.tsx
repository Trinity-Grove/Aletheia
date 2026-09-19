'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal } from '@aletheia/ui';
import type {
  ApplySuggestedRoutineDto,
  SuggestedRoutineResponseDto,
  SuggestRoutineInputDto,
} from '@aletheia/contracts';

export interface CurriculumPlanningWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  learnerId?: string | null | undefined;
  academicYearId?: string | null | undefined;
  onSuccess?: (() => void) | undefined;
}

type WizardStep = 1 | 2 | 3;

interface PedagogicalModelOption {
  code: string;
  name: string;
  tagline: string;
  description: string;
  lessonPacing: string;
  icon: string;
}

const PEDAGOGICAL_MODELS: PedagogicalModelOption[] = [
  {
    code: 'CHARLOTTE_MASON',
    name: 'Charlotte Mason',
    tagline: 'Educação pela atmosfera, disciplina de hábitos e livros vivos',
    description:
      'Prioriza lições curtas e intensas (15-25 min), narração oral imediata, apreciação da natureza e literatura nobre, sem sobrecarga ou decoreba mecânica.',
    lessonPacing: 'Lições curtas de 15 a 25 min • Alternância rápida de estímulos',
    icon: '🌿',
  },
  {
    code: 'CLASSICAL',
    name: 'Clássico (Trívio)',
    tagline: 'Formação da mente ordenada através das três etapas do Trívio',
    description:
      'Estrutura rigorosa baseada em Gramática (memorização e regras nos primeiros anos), Lógica (conexão causal na juventude) e Retórica (expressão persuasiva).',
    lessonPacing: 'Blocos de 40 a 45 min • Memorização e leitura intensiva de clássicos',
    icon: '🏛️',
  },
  {
    code: 'MONTESSORI',
    name: 'Montessori / Unit Studies',
    tagline: 'Autonomia do educando, exploração sensorial e investigação temática',
    description:
      'Favorece períodos ininterruptos de trabalho independente com materiais auto-corretivos, experimentos de vida prática e projetos integrados por tema.',
    lessonPacing: 'Ciclos estendidos de 45 a 60 min • Autonomia e ritmo individual',
    icon: '🧩',
  },
  {
    code: 'TRADITIONAL',
    name: 'Tradicional Estruturado',
    tagline: 'Currículo sequencial com disciplinas bem delimitadas e apostilas',
    description:
      'Abordagem objetiva e direta com matriz curricular clara (Matemática, Língua Portuguesa, História, Ciências) e avaliações periódicas programadas.',
    lessonPacing: 'Aulas de 30 a 40 min • Exercícios dirigidos e livros didáticos',
    icon: '📚',
  },
];

export function CurriculumPlanningWizardModal({
  isOpen,
  onClose,
  familyId,
  learnerId,
  academicYearId,
  onSuccess,
}: CurriculumPlanningWizardModalProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedModel, setSelectedModel] = useState<string>('CHARLOTTE_MASON');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizRecommendation, setQuizRecommendation] = useState<string | null>(null);

  // Step 3 Configuration
  const [startHour, setStartHour] = useState('08:30');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState(25);
  const [includeDevotional, setIncludeDevotional] = useState(true);
  const [fridaysForProjects, setFridaysForProjects] = useState(true);

  // Suggested Routine state
  const [suggestedRoutine, setSuggestedRoutine] = useState<SuggestedRoutineResponseDto | null>(null);
  const [loadingRoutine, setLoadingRoutine] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-adjust default duration when model changes
  useEffect(() => {
    if (selectedModel === 'CLASSICAL') {
      setLessonDurationMinutes(45);
    } else if (selectedModel === 'MONTESSORI') {
      setLessonDurationMinutes(50);
    } else {
      setLessonDurationMinutes(25);
    }
  }, [selectedModel]);

  // Fetch suggested routine whenever entering step 3 or changing routine params
  useEffect(() => {
    if (step !== 3 || !familyId) return;

    let cancelled = false;
    setLoadingRoutine(true);
    setError(null);

    const input: SuggestRoutineInputDto = {
      pedagogicalModelCode: selectedModel,
      startHour,
      lessonDurationMinutes,
      includeDevotional,
      fridaysForProjects,
    };

    fetch(`/api/v1/families/${familyId}/schedule/suggest-routine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao gerar sugestão de rotina semanal.');
        return res.json();
      })
      .then((data: SuggestedRoutineResponseDto) => {
        if (!cancelled) setSuggestedRoutine(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingRoutine(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, familyId, selectedModel, startHour, lessonDurationMinutes, includeDevotional, fridaysForProjects]);

  const handleApproveAndActivate = async () => {
    if (!familyId || !suggestedRoutine) return;
    try {
      setSaving(true);
      setError(null);

      // 1. Apply pedagogical template to populate curriculum subjects & starter objectives
      if (learnerId && academicYearId) {
        await fetch(`/api/v1/families/${familyId}/curriculum/templates/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            learnerId,
            academicYearId,
            template: selectedModel,
          }),
        });
      }

      // 2. Apply suggested routine slots into weekly schedule
      const applyPayload: ApplySuggestedRoutineDto = {
        learnerId: learnerId || undefined,
        academicYearId: academicYearId || undefined,
        replaceExisting: true,
        slots: suggestedRoutine.slots,
      };

      const routineRes = await fetch(`/api/v1/families/${familyId}/schedule/apply-suggested-routine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(applyPayload),
      });

      if (!routineRes.ok) {
        const errData = await routineRes.json().catch(() => ({}));
        throw new Error(errData.message || 'Falha ao salvar a grade semanal sugerida.');
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar planejamento familiar.');
    } finally {
      setSaving(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Passo 1: Filosofia & Diagnóstico Familiar';
      case 2:
        return 'Passo 2: Blocos de Aprendizagem & Guia Didático';
      case 3:
        return 'Passo 3: Geração Inteligente da Grade Semanal';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return 'Identifique a abordagem pedagógica que melhor reflete o ritmo e a vocação da sua família.';
      case 2:
        return 'Compreenda a progressão por blocos temporais e aprenda como ministrar cada lição com confiança.';
      case 3:
        return 'Revise e ative com 1 clique a rotina semanal balanceada com devocional, disciplinas e hábitos.';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getStepTitle()}
      description={getStepDescription()}
      maxWidth="xl"
      footer={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as WizardStep)} disabled={saving}>
                ⬅ Voltar
              </Button>
            ) : (
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Passo {step} de 3
            </span>
            {step < 3 ? (
              <Button
                variant="primary"
                data-testid="wizard-next-btn"
                onClick={() => setStep((s) => (s + 1) as WizardStep)}
              >
                Avançar ➔
              </Button>
            ) : (
              <Button
                variant="primary"
                data-testid="approve-and-activate-routine-btn"
                isLoading={saving}
                disabled={loadingRoutine || !suggestedRoutine}
                onClick={handleApproveAndActivate}
              >
                ✨ Ativar Planejamento & Grade Semanal
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <Alert variant="error">{error}</Alert>}

        {/* STEP 1: Filosofia & Diagnóstico */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Optional Diagnostic Quiz Toggle */}
            <div
              style={{
                backgroundColor: 'var(--color-indigo-50)',
                border: '1px solid var(--color-indigo-100)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🧭</span>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--color-indigo-900)' }}>
                    Iniciando no Ensino Domiciliar?
                  </strong>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--color-indigo-700)' }}>
                  Faça nosso diagnóstico rápido de 1 minuto para descobrir a abordagem ideal para seus filhos.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                data-testid="toggle-diagnostic-quiz-btn"
                onClick={() => setIsQuizOpen(!isQuizOpen)}
                style={{ fontSize: '0.8125rem', fontWeight: 600 }}
              >
                {isQuizOpen ? 'Fechar Diagnóstico' : 'Fazer Diagnóstico 🧭'}
              </Button>
            </div>

            {/* Quiz Content */}
            {isQuizOpen && (
              <div
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--forest)', fontWeight: 700 }}>
                  Diagnóstico Familiar Rápido
                </h4>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    1. Qual ritmo melhor descreve a dinâmica da sua família?
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      type="button"
                      data-testid="quiz-q1-cm"
                      onClick={() => {
                        setSelectedModel('CHARLOTTE_MASON');
                        setQuizRecommendation('CHARLOTTE_MASON');
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${selectedModel === 'CHARLOTTE_MASON' ? 'var(--forest)' : 'var(--border-light)'}`,
                        backgroundColor: selectedModel === 'CHARLOTTE_MASON' ? 'var(--color-indigo-50)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      🌿 <strong>Ritmo Suave & Vivo:</strong> Lições curtas e variadas, muito tempo livre na natureza e leitura de livros vivos em voz alta.
                    </button>

                    <button
                      type="button"
                      data-testid="quiz-q1-classical"
                      onClick={() => {
                        setSelectedModel('CLASSICAL');
                        setQuizRecommendation('CLASSICAL');
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${selectedModel === 'CLASSICAL' ? 'var(--forest)' : 'var(--border-light)'}`,
                        backgroundColor: selectedModel === 'CLASSICAL' ? 'var(--color-indigo-50)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      🏛️ <strong>Estrutura Metódica:</strong> Foco em memorização rigorosa de fatos e gramática, debates ordenados e cânone clássico.
                    </button>

                    <button
                      type="button"
                      data-testid="quiz-q1-montessori"
                      onClick={() => {
                        setSelectedModel('MONTESSORI');
                        setQuizRecommendation('MONTESSORI');
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${selectedModel === 'MONTESSORI' ? 'var(--forest)' : 'var(--border-light)'}`,
                        backgroundColor: selectedModel === 'MONTESSORI' ? 'var(--color-indigo-50)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      🧩 <strong>Autonomia Prática:</strong> Projetos manuais com materiais concretos, liberdade de escolha e imersão temática prolongada.
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Model Selection Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '1rem' }}>
              {PEDAGOGICAL_MODELS.map((m) => {
                const isSelected = selectedModel === m.code;
                const isRecommended = quizRecommendation === m.code;

                return (
                  <div
                    key={m.code}
                    data-testid={`model-card-${m.code}`}
                    onClick={() => setSelectedModel(m.code)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${isSelected ? 'var(--forest)' : 'var(--border-light)'}`,
                      backgroundColor: isSelected ? 'var(--color-indigo-50)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.75rem' }}>{m.icon}</span>
                        {isRecommended && (
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              backgroundColor: 'var(--sage-soft)',
                              color: 'var(--forest)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                            }}
                          >
                            ⭐ Recomendado
                          </span>
                        )}
                      </div>

                      <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.0625rem', color: 'var(--forest)', fontWeight: 700 }}>
                        {m.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold-dark)', marginBottom: '0.5rem' }}>
                        {m.tagline}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {m.description}
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: '1rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-light)',
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      ⏱️ {m.lessonPacing}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Blocos de Aprendizagem & Guia "Como Ensinar" */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                backgroundColor: 'var(--sage-soft)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--forest)',
                fontSize: '0.875rem',
                lineHeight: '1.5',
              }}
            >
              💡 <strong>Como a progressão funciona:</strong> Os objetivos do ano não são entregues em uma lista caótica. Eles são organizados em <strong>blocos temporais sequenciais</strong>. Cada bloco contém seu próprio <strong>cartão metodológico</strong> para orientar você, pai ou mãe, na aplicação diária.
            </div>

            {/* Block 1 */}
            <div
              style={{
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-canvas)',
                  borderBottom: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--forest)' }}>
                    Bloco 1: Fundamentos, Atenção & Hábitos Iniciais
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Semanas 1 a 10 • Estabelecimento da rotina e foco cognitivo
                  </span>
                </div>
                <Badge variant="indigo">Semanas 1–10</Badge>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Methodological Guide Card */}
                <div
                  style={{
                    backgroundColor: 'var(--color-indigo-50)',
                    border: '1px solid var(--color-indigo-100)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>📖</span>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--color-indigo-900)' }}>
                      Como Ensinar este Bloco (Guia Prático para os Pais)
                    </strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Método Principal:</span>
                      <strong style={{ color: 'var(--forest)' }}>
                        {selectedModel === 'CLASSICAL' ? 'Recitação Mnemônica & Gramática Oral' : selectedModel === 'MONTESSORI' ? 'Trabalho Autônomo com Material Concreto' : 'Narração Oral Charlotte Mason'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Ritmo Recomendado:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {selectedModel === 'CLASSICAL' ? 'Lições diárias de 40 a 45 min' : 'Lições curtas de 15 a 20 min'}
                      </strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Orientação aos Pais:</span>
                      <span style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>
                        Peça à criança para recontar a lição imediatamente após a leitura em voz alta, sem interrupções. Valorize o esforço de atenção total e registre as palavras originais no diário.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sample Objectives */}
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Metas Inclusas no Bloco:
                  </strong>
                  <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <li>Desenvolver capacidade de atenção sustentada de 15 minutos em leituras vivas.</li>
                    <li>Narrar oralmente um episódio histórico ou conto moral com início, meio e fim.</li>
                    <li>Registrar observação da natureza com desenho representativo semanal.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Block 2 */}
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                padding: '1.25rem',
                opacity: 0.9,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--forest)' }}>
                    Bloco 2: Aprofundamento Temático & Registro Pessoal
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Semanas 11 a 24 • Ampliação vocabular, cópia elegante e exploração científica
                  </span>
                </div>
                <Badge variant="slate">Semanas 11–24</Badge>
              </div>
            </div>

            {/* Block 3 */}
            <div
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                padding: '1.25rem',
                opacity: 0.9,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--forest)' }}>
                    Bloco 3: Síntese, Portfólio & Conexões Amplas
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Semanas 25 a 36 • Apresentações orais, projetos práticos de ofício e celebração
                  </span>
                </div>
                <Badge variant="slate">Semanas 25–36</Badge>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Geração Inteligente da Grade Semanal */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Preferences Controls */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Início da Rotina Matinal
                </label>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Duração das Lições
                </label>
                <select
                  value={lessonDurationMinutes}
                  onChange={(e) => setLessonDurationMinutes(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value={20}>20 minutos (Charlotte Mason inicial)</option>
                  <option value={25}>25 minutos (Padrão balanceado)</option>
                  <option value={40}>40 minutos (Clássico / Fundamental)</option>
                  <option value={50}>50 minutos (Ciclo Montessori / Imersão)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeDevotional}
                    onChange={(e) => setIncludeDevotional(e.target.checked)}
                  />
                  <span>Devocional Matinal (15 min)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fridaysForProjects}
                    onChange={(e) => setFridaysForProjects(e.target.checked)}
                  />
                  <span>Sextas de Campo & Ofícios</span>
                </label>
              </div>
            </div>

            {/* Generated Preview */}
            {loadingRoutine ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Calculando grade semanal balanceada...
              </div>
            ) : suggestedRoutine ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    backgroundColor: 'var(--color-indigo-50)',
                    padding: '0.875rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-indigo-100)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-indigo-900)', fontWeight: 600 }}>
                    ⚡ {suggestedRoutine.pedagogicalRationale}
                  </div>
                  <Badge variant="indigo">
                    ⏱️ {suggestedRoutine.totalInstructionalHoursWeekly} horas de instrução semanal
                  </Badge>
                </div>

                {/* Day-by-Day Grid Preview */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {[1, 2, 3, 4, 5].map((dayNum) => {
                    const daySlots = suggestedRoutine.slots.filter((s) => s.dayOfWeek === dayNum);
                    const dayNames = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

                    return (
                      <div
                        key={dayNum}
                        style={{
                          backgroundColor: 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <strong style={{ fontSize: '0.8125rem', color: 'var(--forest)' }}>
                          {dayNames[dayNum]}
                        </strong>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          {daySlots.map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                padding: '0.375rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-surface)',
                                borderLeft: `3px solid ${slot.subjectColor || '#3B82F6'}`,
                                fontSize: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.125rem',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {slot.subjectName}
                              </div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
                                {slot.startTime} – {slot.endTime}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
