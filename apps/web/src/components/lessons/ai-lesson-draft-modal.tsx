'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Textarea,
} from '@aletheia/ui';
import type {
  AiLessonPlanDraftResponseDto,
  AiUsageQuotaResponseDto,
  GenerateLessonPlanDraftRequestDto,
  LearnerSummaryDto,
  LessonPlanDraftContent,
  LessonPlanDraftStep,
  ReviewAiSuggestionRequestDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { useLocale } from '../../lib/i18n/locale-context';
import { AiConsentNoticeModal } from './ai-consent-notice-modal';

export interface AiLessonDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  learners: LearnerSummaryDto[];
  subjects: SubjectResponseDto[];
  initialLearnerId?: string | null;
  initialSubjectId?: string | null;
  initialDate?: string;
  onLessonCreated?: (lessonPlanId?: string) => void;
}

export function AiLessonDraftModal({
  isOpen,
  onClose,
  familyId,
  learners,
  subjects,
  initialLearnerId,
  initialSubjectId,
  initialDate,
  onLessonCreated,
}: AiLessonDraftModalProps) {
  const { t } = useLocale();

  // Mode: CONFIG or REVIEW
  const [mode, setMode] = useState<'CONFIG' | 'REVIEW'>('CONFIG');

  // Form State: Config
  const [learnerId, setLearnerId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [instructions, setInstructions] = useState<string>('');

  // Quota & Consent State
  const [quota, setQuota] = useState<AiUsageQuotaResponseDto | null>(null);
  const [isConsentNoticeOpen, setIsConsentNoticeOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review State
  const [suggestionId, setSuggestionId] = useState<string>('');
  const [originalDraft, setOriginalDraft] = useState<LessonPlanDraftContent | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftSummary, setDraftSummary] = useState<string>('');
  const [draftMaterials, setDraftMaterials] = useState<string>('');
  const [draftDate, setDraftDate] = useState<string>('');
  const [draftSteps, setDraftSteps] = useState<LessonPlanDraftStep[]>([]);
  const [draftAssessment, setDraftAssessment] = useState<string>('');

  // Fetch quota
  const fetchQuota = useCallback(async () => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/v1/families/${familyId}/ai/quota`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // Non-fatal
    }
  }, [familyId]);

  // Reset or initialize state when opening
  useEffect(() => {
    if (isOpen) {
      setMode('CONFIG');
      setLearnerId(initialLearnerId || (learners[0]?.id ?? ''));
      setSubjectId(initialSubjectId || (subjects[0]?.id ?? ''));
      setTopic('');
      setDurationMinutes(45);
      setInstructions('');
      setErrorMessage(null);
      setDraftDate(initialDate || new Date().toISOString().split('T')[0]!);
      void fetchQuota();
    }
  }, [isOpen, initialLearnerId, initialSubjectId, initialDate, learners, subjects, fetchQuota]);

  // Handle draft generation
  const handleGenerateDraft = async () => {
    if (!familyId || !learnerId || !subjectId || !topic.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);

    const subjectObj = subjects.find((s) => s.id === subjectId);
    const subjectName = subjectObj ? subjectObj.name : 'Geral';

    const payload: GenerateLessonPlanDraftRequestDto = {
      learnerId,
      subject: subjectName,
      topic: topic.trim(),
      durationMinutes: Number(durationMinutes) || 45,
      additionalInstructions: instructions.trim() || undefined,
    };

    try {
      const res = await fetch(`/api/v1/families/${familyId}/ai/lesson-plan-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        if (
          errData?.code === 'CONSENT_REQUIRED' ||
          (typeof errData?.message === 'string' && errData.message.includes('consent'))
        ) {
          setIsConsentNoticeOpen(true);
          return;
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData?.message || t('lessons.aiAssistant.genericError'));
        return;
      }

      const data: AiLessonPlanDraftResponseDto = await res.json();

      setSuggestionId(data.suggestionId);
      setOriginalDraft(data.draft);
      setDraftTitle(data.draft.title);
      setDraftSummary(data.draft.summary);
      setDraftMaterials(
        Array.isArray(data.draft.materials) ? data.draft.materials.join(', ') : '',
      );
      setDraftSteps(data.draft.steps || []);
      setDraftAssessment(data.draft.assessmentObservations || '');
      setMode('REVIEW');
    } catch {
      setErrorMessage(t('lessons.aiAssistant.genericError'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle step field changes
  const handleStepChange = (
    index: number,
    field: keyof LessonPlanDraftStep,
    value: string | number,
  ) => {
    setDraftSteps((prev) => {
      const copy = [...prev];
      const step = { ...copy[index]! };
      if (field === 'durationMinutes') {
        step.durationMinutes = Number(value) || 0;
      } else if (field === 'title') {
        step.title = String(value);
      } else if (field === 'instructions') {
        step.instructions = String(value);
      } else if (field === 'narrationPrompt') {
        step.narrationPrompt = String(value);
      }
      copy[index] = step;
      return copy;
    });
  };

  // Handle Approve & Schedule
  const handleApproveDraft = async () => {
    if (!familyId || !suggestionId) return;

    setIsReviewing(true);
    setErrorMessage(null);

    const materialsArray = draftMaterials
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const finalContent: LessonPlanDraftContent = {
      title: draftTitle.trim(),
      summary: draftSummary.trim(),
      materials: materialsArray,
      steps: draftSteps,
      assessmentObservations: draftAssessment.trim() || undefined,
    };

    const isModified =
      !originalDraft ||
      draftTitle !== originalDraft.title ||
      draftSummary !== originalDraft.summary ||
      materialsArray.join(',') !== (originalDraft.materials || []).join(',') ||
      draftAssessment !== (originalDraft.assessmentObservations || '') ||
      JSON.stringify(draftSteps) !== JSON.stringify(originalDraft.steps);

    const action = isModified ? 'MODIFY' : 'ACCEPT';

    // Format scheduledDate as ISO string to satisfy z.string().datetime()
    const isoDate = draftDate
      ? new Date(`${draftDate}T00:00:00.000Z`).toISOString()
      : undefined;

    const payload: ReviewAiSuggestionRequestDto = {
      action,
      scheduledDate: isoDate,
      subjectId: subjectId || undefined,
      finalContent: action === 'MODIFY' ? finalContent : undefined,
    };

    try {
      const res = await fetch(
        `/api/v1/families/${familyId}/ai/suggestions/${suggestionId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErrorMessage(errData?.message || t('lessons.aiAssistant.genericError'));
        return;
      }

      const resData = await res.json();
      const createdPlanId =
        resData.lessonPlan?.id ||
        (typeof resData.lessonPlan === 'string' ? resData.lessonPlan : undefined);

      onLessonCreated?.(createdPlanId);
      onClose();
    } catch {
      setErrorMessage(t('lessons.aiAssistant.genericError'));
    } finally {
      setIsReviewing(false);
    }
  };

  // Handle Discard / Reject Draft
  const handleRejectDraft = async () => {
    if (!familyId || !suggestionId) {
      onClose();
      return;
    }

    setIsReviewing(true);
    setErrorMessage(null);

    const payload: ReviewAiSuggestionRequestDto = {
      action: 'REJECT',
    };

    try {
      await fetch(`/api/v1/families/${familyId}/ai/suggestions/${suggestionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    } catch {
      // Non-fatal on discard
    } finally {
      setIsReviewing(false);
      onClose();
    }
  };

  // Remaining Quota Calculation
  const remainingTokens = quota
    ? Math.max(0, quota.tokensLimit - quota.tokensUsed)
    : 0;
  const remainingRequests = quota
    ? Math.max(0, quota.requestsLimit - quota.requestsUsed)
    : 0;
  const isQuotaExceeded =
    quota && (quota.tokensUsed >= quota.tokensLimit || quota.requestsUsed >= quota.requestsLimit);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          mode === 'CONFIG'
            ? t('lessons.aiAssistant.configTitle')
            : t('lessons.aiAssistant.reviewTitle')
        }
        description={
          mode === 'CONFIG' ? t('lessons.aiAssistant.configSubtitle') : undefined
        }
        maxWidth="xl"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMessage && (
            <Alert variant="error" role="alert">
              {errorMessage}
            </Alert>
          )}

          {mode === 'CONFIG' ? (
            /* CONFIG FORM */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Privacy Reassurance Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: 'var(--sage-soft)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <Badge variant="emerald">COPPA / LGPD</Badge>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {t('lessons.aiAssistant.coppaBadge')}
                </span>
              </div>

              {/* Learner Select */}
              <Select
                data-testid="ai-learner-select"
                label={t('lessons.aiAssistant.learnerLabel')}
                value={learnerId}
                onChange={(e) => setLearnerId(e.target.value)}
                options={learners.map((l) => ({
                  value: l.id,
                  label: l.preferredName || `${l.firstName} ${l.lastName}`.trim(),
                }))}
              />

              {/* Subject Select */}
              <Select
                data-testid="ai-subject-select"
                label={t('lessons.aiAssistant.subjectLabel')}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                options={subjects.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
              />

              {/* Topic Input */}
              <Input
                data-testid="ai-topic-input"
                label={t('lessons.aiAssistant.topicLabel')}
                placeholder={t('lessons.aiAssistant.topicPlaceholder')}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />

              {/* Duration Input */}
              <Input
                type="number"
                data-testid="ai-duration-input"
                label={t('lessons.aiAssistant.durationLabel')}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={5}
                max={240}
              />

              {/* Additional Instructions */}
              <Textarea
                data-testid="ai-instructions-textarea"
                label={t('lessons.aiAssistant.instructionsLabel')}
                placeholder={t('lessons.aiAssistant.instructionsPlaceholder')}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />

              {/* Quota Indicator */}
              <div
                data-testid="ai-quota-indicator"
                style={{
                  fontSize: '0.8125rem',
                  color: isQuotaExceeded ? 'var(--color-rose-700)' : 'var(--text-secondary)',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: isQuotaExceeded ? 'var(--color-rose-50)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {isQuotaExceeded
                  ? t('lessons.aiAssistant.quotaExceeded', {
                      date: quota?.resetAt ? quota.resetAt.slice(0, 10) : '',
                    })
                  : t('lessons.aiAssistant.quotaRemaining', {
                      tokens: remainingTokens,
                      requests: remainingRequests,
                    })}
              </div>

              {/* Config Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                }}
              >
                <Button variant="secondary" onClick={onClose}>
                  {t('lessons.aiAssistant.closeButton')}
                </Button>
                <Button
                  data-testid="ai-generate-draft-btn"
                  variant="primary"
                  onClick={handleGenerateDraft}
                  disabled={isGenerating || !topic.trim() || !learnerId || !subjectId}
                >
                  {isGenerating
                    ? t('lessons.aiAssistant.generating')
                    : t('lessons.aiAssistant.generateButton')}
                </Button>
              </div>
            </div>
          ) : (
            /* REVIEW FORM */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Human Review Required Reassurance */}
              <Alert variant="info" title="Revisão Humana Obrigatória">
                {t('lessons.aiAssistant.reviewNotice')}
              </Alert>

              {/* Draft Title */}
              <Input
                data-testid="ai-draft-title"
                label={t('lessons.aiAssistant.titleLabel')}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
              />

              {/* Draft Summary */}
              <Textarea
                data-testid="ai-draft-summary"
                label={t('lessons.aiAssistant.summaryLabel')}
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                rows={3}
              />

              {/* Draft Materials */}
              <Input
                data-testid="ai-draft-materials"
                label={t('lessons.aiAssistant.materialsLabel')}
                value={draftMaterials}
                onChange={(e) => setDraftMaterials(e.target.value)}
              />

              {/* Scheduled Date */}
              <Input
                type="date"
                data-testid="ai-draft-date"
                label={t('lessons.aiAssistant.dateLabel')}
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
              />

              {/* Steps List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {t('lessons.aiAssistant.stepsTitle')}
                </h3>

                {draftSteps.map((step, idx) => (
                  <div
                    key={idx}
                    data-testid={`ai-draft-step-${idx}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {t('lessons.aiAssistant.step', { number: step.order || idx + 1 })}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '0.75rem' }}>
                      <Input
                        data-testid={`ai-draft-step-${idx}-title`}
                        label={t('lessons.aiAssistant.titleLabel')}
                        value={step.title}
                        onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                      />
                      <Input
                        type="number"
                        data-testid={`ai-draft-step-${idx}-duration`}
                        label={t('lessons.aiAssistant.durationLabel')}
                        value={step.durationMinutes}
                        onChange={(e) => handleStepChange(idx, 'durationMinutes', e.target.value)}
                      />
                    </div>

                    <Textarea
                      data-testid={`ai-draft-step-${idx}-instructions`}
                      label={t('lessons.aiAssistant.stepInstructions')}
                      value={step.instructions}
                      onChange={(e) => handleStepChange(idx, 'instructions', e.target.value)}
                      rows={2}
                    />

                    <Input
                      data-testid={`ai-draft-step-${idx}-narration`}
                      label={t('lessons.aiAssistant.stepNarration')}
                      value={step.narrationPrompt || ''}
                      onChange={(e) => handleStepChange(idx, 'narrationPrompt', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Assessment Observations */}
              <Textarea
                data-testid="ai-draft-assessment"
                label={t('lessons.aiAssistant.assessmentLabel')}
                value={draftAssessment}
                onChange={(e) => setDraftAssessment(e.target.value)}
                rows={2}
              />

              {/* Review Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginTop: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <Button
                  data-testid="ai-back-config-btn"
                  variant="secondary"
                  onClick={() => setMode('CONFIG')}
                  disabled={isReviewing}
                >
                  {t('lessons.aiAssistant.backButton')}
                </Button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button
                    data-testid="ai-reject-draft-btn"
                    variant="danger"
                    onClick={handleRejectDraft}
                    disabled={isReviewing}
                  >
                    {isReviewing
                      ? t('lessons.aiAssistant.rejecting')
                      : t('lessons.aiAssistant.rejectButton')}
                  </Button>
                  <Button
                    data-testid="ai-approve-schedule-btn"
                    variant="primary"
                    onClick={handleApproveDraft}
                    disabled={isReviewing}
                  >
                    {isReviewing
                      ? t('lessons.aiAssistant.approving')
                      : t('lessons.aiAssistant.approveButton')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Parental Consent Notice Modal */}
      <AiConsentNoticeModal
        isOpen={isConsentNoticeOpen}
        onClose={() => setIsConsentNoticeOpen(false)}
      />
    </>
  );
}
