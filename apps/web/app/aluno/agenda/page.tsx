'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button } from '@aletheia/ui';
import {
  LearnerProgressView,
  LearnerEvidenceModal,
  LearnerReflectionModal,
  type LearnerTrackedCompetency,
  type LearnerAgendaItem,
  type LearnerAgendaData,
  type LessonReflectionData,
} from '../../../src/components/learner-portal';
import { useLocale } from '../../../src/lib/i18n/locale-context';

function getTodayIsoString(): string {
  return new Date().toISOString().slice(0, 10);
}

function shiftIsoDate(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const dt = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekDaysForDate(centerDateStr: string, todayStr: string): Array<{
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}> {
  const parts = centerDateStr.split('-').map(Number);
  const current = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  const currentDay = current.getDay();
  // Monday is index 1; if current is Sunday (0), distance to Monday is -6
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const dayAbbreviations = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dayNum}`;
    return {
      date: dateStr,
      dayName: dayAbbreviations[i] ?? '',
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    };
  });
}

export default function LearnerAgendaPage() {
  const { t, formatDate } = useLocale();
  const router = useRouter();

  const [learnerId, setLearnerId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'agenda' | 'progress'>('agenda');

  // Date Navigation State
  const todayStr = getTodayIsoString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Agenda State
  const [agenda, setAgenda] = useState<LearnerAgendaData | null>(null);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [agendaError, setAgendaError] = useState<string | null>(null);

  // Reflection Modal State
  const [selectedLessonForReflection, setSelectedLessonForReflection] = useState<LearnerAgendaItem | null>(null);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);

  // Progress State
  const [trackings, setTrackings] = useState<LearnerTrackedCompetency[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Evidence Modal State
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [selectedTrackingIdForEvidence, setSelectedTrackingIdForEvidence] = useState<string | null>(null);

  // Global Celebration / Notification
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('learner_session');
      if (!stored) {
        router.replace('/aluno/login');
        return;
      }
      const parsed = JSON.parse(stored);
      if (!parsed?.learnerId) {
        router.replace('/aluno/login');
        return;
      }
      setLearnerId(parsed.learnerId);
      setDisplayName(parsed.displayName || t('learnerPortal.header.defaultLearnerName'));
      void loadAgenda(parsed.learnerId);
    } catch {
      router.replace('/aluno/login');
    }
  }, []);

  const loadAgenda = async (id: string, dateStr?: string) => {
    try {
      setLoadingAgenda(true);
      setAgendaError(null);
      const url = dateStr
        ? `/api/v1/learner-access/learners/${id}/agenda?date=${dateStr}`
        : `/api/v1/learner-access/learners/${id}/agenda`;

      const res = await fetch(url, {
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('learner_session');
        router.replace('/aluno/login');
        return;
      }
      if (!res.ok) {
        throw new Error(t('learnerPortal.agenda.errorLoad'));
      }
      const data = await res.json();
      setAgenda(data);
      if (data?.date) {
        setSelectedDate(data.date);
      } else if (dateStr) {
        setSelectedDate(dateStr);
      }
    } catch (err: unknown) {
      setAgendaError(err instanceof Error ? err.message : t('learnerPortal.agenda.errorGeneral'));
    } finally {
      setLoadingAgenda(false);
    }
  };

  const loadProgress = async (id: string) => {
    try {
      setLoadingProgress(true);
      setProgressError(null);
      const res = await fetch(`/api/v1/learner-access/learners/${id}/progress?status=ACTIVE`, {
        credentials: 'include',
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('learner_session');
        router.replace('/aluno/login');
        return;
      }
      if (!res.ok) {
        throw new Error(t('learnerPortal.progress.errorLoad'));
      }
      const data = await res.json();
      setTrackings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setProgressError(err instanceof Error ? err.message : t('learnerPortal.progress.errorGeneral'));
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleTabChange = (tab: 'agenda' | 'progress') => {
    setActiveTab(tab);
    if (tab === 'progress' && learnerId) {
      void loadProgress(learnerId);
    }
  };

  const handlePrevDay = () => {
    const prev = shiftIsoDate(selectedDate, -1);
    setSelectedDate(prev);
    if (learnerId) {
      void loadAgenda(learnerId, prev);
    }
  };

  const handleNextDay = () => {
    const next = shiftIsoDate(selectedDate, 1);
    setSelectedDate(next);
    if (learnerId) {
      void loadAgenda(learnerId, next);
    }
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
    if (learnerId) {
      void loadAgenda(learnerId, todayStr);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (learnerId) {
      void loadAgenda(learnerId, dateStr);
    }
  };

  const handleOpenEvidenceModal = (trackingId?: string) => {
    setSelectedTrackingIdForEvidence(trackingId ?? null);
    setIsEvidenceModalOpen(true);
  };

  const handleEvidenceSuccess = (message: string) => {
    setCelebrationMsg(message);
    if (learnerId) {
      void loadProgress(learnerId);
    }
    setTimeout(() => {
      setCelebrationMsg((current) => (current === message ? null : current));
    }, 6000);
  };

  const handleOpenReflectionModal = (item: LearnerAgendaItem) => {
    setSelectedLessonForReflection(item);
    setIsReflectionModalOpen(true);
  };

  const handleConfirmReflection = async (reflectionData: LessonReflectionData) => {
    if (!selectedLessonForReflection) return;
    await handleCompleteLesson(selectedLessonForReflection, reflectionData);
    setIsReflectionModalOpen(false);
    setSelectedLessonForReflection(null);
  };

  const handleCompleteLesson = async (
    item: LearnerAgendaItem,
    reflection?: LessonReflectionData
  ) => {
    const targetLessonId = item.lessonPlanId || item.id;
    try {
      setCompletingId(targetLessonId);
      setAgendaError(null);

      let reflectionNote = '';
      if (reflection?.isOralNarration) {
        reflectionNote += `[${t('learnerPortal.agenda.oralNarrationDone')}] `;
      }
      if (reflection?.characterHabit) {
        reflectionNote += `[${t('learnerPortal.agenda.habitTag', { habit: reflection.characterHabit })}] `;
      }
      if (reflection?.notes?.trim()) {
        reflectionNote += reflection.notes.trim();
      }

      const payload = reflectionNote.trim()
        ? { notes: reflectionNote.trim(), actualDurationMinutes: reflection?.actualDurationMinutes }
        : {};

      const res = await fetch(
        `/api/v1/learner-access/learners/${learnerId}/lessons/${targetLessonId}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Fastify rejects a JSON request with an empty body (400).
          body: JSON.stringify(payload),
          credentials: 'include',
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || t('learnerPortal.agenda.errorComplete'));
      }

      setAgenda((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.lessonPlanId === targetLessonId || it.id === targetLessonId
              ? {
                  ...it,
                  isCompleted: true,
                  reflectionNotes: reflectionNote.trim() || it.reflectionNotes || null,
                  hadOralNarration: reflection?.isOralNarration ?? it.hadOralNarration ?? false,
                }
              : it
          ),
        };
      });

      const successMsg = reflectionNote.trim()
        ? t('learnerPortal.agenda.celebrationReflection', {
            name: displayName,
            title: item.title,
          })
        : t('learnerPortal.agenda.celebrationSuccess', {
            name: displayName,
            title: item.title,
          });

      setCelebrationMsg(successMsg);
      setTimeout(() => {
        setCelebrationMsg((current) => (current === successMsg ? null : current));
      }, 5000);
    } catch (err: unknown) {
      setAgendaError(err instanceof Error ? err.message : t('learnerPortal.agenda.errorComplete'));
    } finally {
      setCompletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/learner-access/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('learner_session');
      router.push('/aluno/login');
    }
  };

  const completedCount = agenda?.items?.filter((i) => i.isCompleted).length ?? 0;
  const totalCount = agenda?.items?.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const weekDays = getWeekDaysForDate(selectedDate, todayStr);

  return (
    <div
      data-testid="learner-agenda-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Learner Top Header */}
      <header
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-light)',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--forest)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.125rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--gold-dark)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {t('learnerPortal.header.portalBadge')}
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--forest)' }}>
              {displayName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            type="button"
            variant="secondary"
            data-testid="header-open-evidence-btn"
            onClick={() => handleOpenEvidenceModal()}
            style={{ fontSize: '0.875rem' }}
          >
            {t('learnerPortal.header.sendWorkButton')}
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid var(--border-light)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t('learnerPortal.header.logout')}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '52rem', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {celebrationMsg && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert variant="success" data-testid="celebration-alert">
              {celebrationMsg}
            </Alert>
          </div>
        )}

        {/* Tab Navigation Selector */}
        <div
          role="tablist"
          aria-label={t('learnerPortal.header.navAriaLabel')}
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid var(--border-light)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'agenda'}
            data-testid="tab-agenda"
            onClick={() => handleTabChange('agenda')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'agenda' ? '3px solid var(--forest)' : '3px solid transparent',
              color: activeTab === 'agenda' ? 'var(--forest)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              transition: 'all 0.15s ease',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📅</span> {t('learnerPortal.tabs.agenda')}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'progress'}
            data-testid="tab-progress"
            onClick={() => handleTabChange('progress')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              border: 'none',
              borderBottom: activeTab === 'progress' ? '3px solid var(--forest)' : '3px solid transparent',
              color: activeTab === 'progress' ? 'var(--forest)' : 'var(--text-secondary)',
              backgroundColor: 'transparent',
              transition: 'all 0.15s ease',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>🌱</span> {t('learnerPortal.tabs.progress')}
          </button>
        </div>

        {/* Tab 1: Minha Agenda */}
        {activeTab === 'agenda' && (
          <div data-testid="tab-panel-agenda">
            {agendaError && (
              <div style={{ marginBottom: '1.5rem' }}>
                <Alert variant="error">{agendaError}</Alert>
              </div>
            )}

            {/* Week & Day Navigation Strip */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    data-testid="prev-day-btn"
                    aria-label={t('learnerPortal.agenda.previousDay')}
                    onClick={handlePrevDay}
                    style={{
                      border: '1px solid var(--border-light)',
                      background: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.4rem 0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ← {t('learnerPortal.agenda.previousDay')}
                  </button>

                  <button
                    type="button"
                    data-testid="today-btn"
                    aria-label={t('learnerPortal.agenda.today')}
                    onClick={handleToday}
                    style={{
                      border: '1px solid var(--border-light)',
                      background: selectedDate === todayStr ? 'var(--forest)' : 'none',
                      color: selectedDate === todayStr ? '#ffffff' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.4rem 0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {t('learnerPortal.agenda.today')}
                  </button>

                  <button
                    type="button"
                    data-testid="next-day-btn"
                    aria-label={t('learnerPortal.agenda.nextDay')}
                    onClick={handleNextDay}
                    style={{
                      border: '1px solid var(--border-light)',
                      background: 'none',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.4rem 0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t('learnerPortal.agenda.nextDay')} →
                  </button>
                </div>

                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--forest)' }}>
                  {formatDate(new Date(`${selectedDate}T12:00:00Z`), {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>

              {/* Day-of-week pills */}
              <div
                data-testid="weekday-selector"
                role="tablist"
                aria-label={t('learnerPortal.agenda.weekNav')}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '0.375rem',
                }}
              >
                {weekDays.map((w) => {
                  const isSelected = w.date === selectedDate;
                  return (
                    <button
                      key={w.date}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      aria-current={isSelected ? 'date' : undefined}
                      data-testid={`agenda-day-${w.date}`}
                      onClick={() => handleSelectDate(w.date)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem 0.25rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--forest)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected
                          ? 'var(--forest)'
                          : w.isToday
                          ? 'var(--sage-soft)'
                          : 'var(--bg-canvas)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          opacity: isSelected ? 0.9 : 0.7,
                        }}
                      >
                        {w.dayName}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {w.dayNumber}
                      </span>
                      {w.isToday && !isSelected && (
                        <span
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--forest)',
                            marginTop: '2px',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress & Welcome banner */}
            <section
              style={{
                backgroundColor: 'var(--forest)',
                color: '#ffffff',
                padding: '1.75rem',
                borderRadius: 'var(--radius-xl)',
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t('learnerPortal.agenda.todayTitle')}
                </h1>
                <p style={{ margin: '0.375rem 0 1.25rem 0', opacity: 0.85, fontSize: '0.9375rem' }}>
                  {agenda?.date
                    ? formatDate(new Date(`${agenda.date}T12:00:00Z`), {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })
                    : t('learnerPortal.agenda.loadingLessons')}
                </p>

                {totalCount > 0 && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8125rem',
                        marginBottom: '0.375rem',
                        fontWeight: 600,
                      }}
                    >
                      <span>{t('learnerPortal.agenda.dailyProgress')}</span>
                      <span>
                        {t('learnerPortal.agenda.progressRatio', {
                          completed: completedCount,
                          total: totalCount,
                          percent: progressPercent,
                        })}
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderRadius: 'var(--radius-full)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          backgroundColor: 'var(--gold)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Lessons List */}
            <section>
              {loadingAgenda ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  {t('learnerPortal.agenda.loadingActivities')}
                </div>
              ) : !agenda || !agenda.items || agenda.items.length === 0 ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--forest)', fontSize: '1.25rem' }}>
                    {t('learnerPortal.agenda.emptyTitle')}
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                    {t('learnerPortal.agenda.emptySubtitle')}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(agenda.items || []).map((item) => {
                    const lessonKey = item.lessonPlanId || item.id;
                    const isCompleted = Boolean(item.isCompleted);
                    const isWorking = completingId === lessonKey;
                    const duration = item.durationMinutes;

                    return (
                      <article
                        key={item.id}
                        data-testid={`agenda-lesson-card-${lessonKey}`}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid',
                          borderColor: isCompleted ? 'var(--sage)' : 'var(--border-light)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1.5rem',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.2s ease',
                          opacity: isCompleted ? 0.9 : 1,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.375rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            {item.subjectName && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: item.subjectColor ? `${item.subjectColor}20` : 'var(--sage-soft)',
                                  color: item.subjectColor || 'var(--forest)',
                                }}
                              >
                                {item.subjectName}
                              </span>
                            )}

                            {item.startTime && (
                              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                              </span>
                            )}

                            {duration && (
                              <span
                                data-testid={`lesson-duration-${lessonKey}`}
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  backgroundColor: 'var(--bg-canvas)',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: 'var(--radius-full)',
                                  border: '1px solid var(--border-light)',
                                }}
                              >
                                ⏱️ {t('learnerPortal.agenda.durationMinutes', { minutes: duration })}
                              </span>
                            )}

                            {/* Friendly Status Badge */}
                            {isCompleted ? (
                              <span
                                data-testid={`lesson-status-completed-${lessonKey}`}
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'var(--sage-soft)',
                                  color: 'var(--forest)',
                                }}
                              >
                                ✓ {t('learnerPortal.agenda.completedBadge')}
                              </span>
                            ) : (
                              <span
                                data-testid={`lesson-status-pending-${lessonKey}`}
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                  color: 'var(--gold-dark)',
                                }}
                              >
                                ⏳ {t('learnerPortal.agenda.statusPending')}
                              </span>
                            )}
                          </div>

                          <h2
                            style={{
                              margin: 0,
                              fontSize: '1.125rem',
                              fontWeight: 600,
                              color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {item.title}
                          </h2>

                          {/* Character Habits Tags */}
                          {item.characterHabits && item.characterHabits.length > 0 && (
                            <div
                              data-testid={`lesson-habits-${lessonKey}`}
                              style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.375rem' }}
                            >
                              {item.characterHabits.map((habit) => (
                                <span
                                  key={habit}
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--forest)',
                                    backgroundColor: 'rgba(40, 80, 50, 0.08)',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: 'var(--radius-full)',
                                  }}
                                >
                                  🌱 {t('learnerPortal.agenda.habitTag', { habit })}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Reflection note if completed */}
                          {item.reflectionNotes && (
                            <div
                              data-testid={`lesson-reflection-note-${lessonKey}`}
                              style={{
                                fontSize: '0.8125rem',
                                color: 'var(--text-secondary)',
                                fontStyle: 'italic',
                                marginTop: '0.5rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: 'var(--bg-canvas)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: '3px solid var(--forest)',
                              }}
                            >
                              {t('learnerPortal.agenda.yourReflection', { text: item.reflectionNotes })}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isCompleted ? (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                backgroundColor: 'var(--sage-soft)',
                                color: 'var(--forest)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                              }}
                            >
                              <span>✓</span> {t('learnerPortal.agenda.completedBadge')}
                            </div>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                data-testid={`reflect-lesson-btn-${lessonKey}`}
                                disabled={isWorking}
                                onClick={() => handleOpenReflectionModal(item)}
                                style={{ fontSize: '0.875rem', fontWeight: 600 }}
                              >
                                {t('learnerPortal.agenda.reflectButton')}
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                data-testid={`complete-lesson-btn-${lessonKey}`}
                                isLoading={isWorking}
                                onClick={() => handleCompleteLesson(item)}
                                style={{
                                  minWidth: '8.5rem',
                                  height: '2.5rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}
                              >
                                {t('learnerPortal.agenda.completeButton')}
                              </Button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 2: Meu Progresso */}
        {activeTab === 'progress' && (
          <div data-testid="tab-panel-progress">
            <LearnerProgressView
              learnerId={learnerId}
              trackings={trackings}
              loading={loadingProgress}
              error={progressError}
              onOpenEvidenceModal={handleOpenEvidenceModal}
            />
          </div>
        )}
      </main>

      {/* Lesson Reflection & Narration Modal */}
      {selectedLessonForReflection && (
        <LearnerReflectionModal
          isOpen={isReflectionModalOpen}
          onClose={() => {
            setIsReflectionModalOpen(false);
            setSelectedLessonForReflection(null);
          }}
          lessonTitle={selectedLessonForReflection.title}
          lessonId={selectedLessonForReflection.lessonPlanId || selectedLessonForReflection.id}
          learnerName={displayName}
          initialHabits={selectedLessonForReflection.characterHabits}
          onConfirm={handleConfirmReflection}
          isSubmitting={completingId === (selectedLessonForReflection.lessonPlanId || selectedLessonForReflection.id)}
        />
      )}

      {/* Evidence Submission Modal */}
      <LearnerEvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        learnerId={learnerId}
        trackings={trackings}
        initialTrackingId={selectedTrackingIdForEvidence}
        onSuccess={handleEvidenceSuccess}
      />
    </div>
  );
}
