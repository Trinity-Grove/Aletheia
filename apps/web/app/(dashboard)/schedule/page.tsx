'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AletheiaIcon } from '@aletheia/ui';
import type {
  CompleteLessonDto,
  CreateLessonPlanDto,
  CreateScheduleSlotDto,
  DailyAgendaDto,
  DailyAgendaItemDto,
  DayOfWeek,
  LearnerSummaryDto,
  ObjectiveResponseDto,
  RescheduleLessonDto,
  ScheduleSlotResponseDto,
  SubjectResponseDto,
} from '@aletheia/contracts';
import { ProductShell } from '../../../src/components/product-shell';
import { DailyAgendaView } from '../../../src/components/lessons/daily-agenda-view';
import { LessonFormModal } from '../../../src/components/lessons/lesson-form-modal';
import { RescheduleLessonItem, RescheduleModal } from '../../../src/components/lessons/reschedule-modal';
import { CompleteLessonItem, CompleteLessonModal } from '../../../src/components/lessons/complete-lesson-modal';
import { WeeklyRoutineGrid } from '../../../src/components/lessons/weekly-routine-grid';
import { RoutineSlotModal } from '../../../src/components/lessons/routine-slot-modal';

export default function SchedulePage() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [learners, setLearners] = useState<LearnerSummaryDto[]>([]);
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectResponseDto[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveResponseDto[]>([]);

  const [activeTab, setActiveTab] = useState<'agenda' | 'routine'>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]!;
  });

  const [agenda, setAgenda] = useState<DailyAgendaDto>({
    date: selectedDate,
    dayOfWeek: 1,
    items: [],
  });
  const [slots, setSlots] = useState<ScheduleSlotResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [slotDayOfWeek, setSlotDayOfWeek] = useState<DayOfWeek>(1);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<RescheduleLessonItem | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [completeItem, setCompleteItem] = useState<CompleteLessonItem | null>(null);

  // Initial Load: token, family, learners, subjects, objectives
  useEffect(() => {
    async function loadBaseData() {
      try {
        const token = localStorage.getItem('token');
        const storedFamilyId = localStorage.getItem('familyId');
        if (!token || !storedFamilyId) {
          setLoading(false);
          return;
        }
        setFamilyId(storedFamilyId);

        // Learners
        const learnersRes = await fetch(`/api/v1/families/${storedFamilyId}/learners`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (learnersRes.ok) {
          const lData = await learnersRes.json();
          setLearners(lData);
        }

        // Subjects
        const subjectsRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (subjectsRes.ok) {
          const sData = await subjectsRes.json();
          setSubjects(sData);
        }

        // Objectives
        const objectivesRes = await fetch(`/api/v1/families/${storedFamilyId}/curriculum/objectives`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (objectivesRes.ok) {
          const oData = await objectivesRes.json();
          setObjectives(oData);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadBaseData();
  }, []);

  // Load Agenda whenever date, learner, or familyId changes
  const fetchAgenda = useCallback(async () => {
    if (!familyId) return;
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ date: selectedDate });
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/schedule/agenda?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgenda(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, selectedDate, activeLearnerId]);

  // Load Slots whenever learner or familyId changes
  const fetchSlots = useCallback(async () => {
    if (!familyId) return;
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeLearnerId) {
        params.append('learnerId', activeLearnerId);
      }
      const res = await fetch(`/api/v1/families/${familyId}/schedule/slots?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch {
      // ignore
    }
  }, [familyId, activeLearnerId]);

  useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Actions
  const handleCreateLesson = async (dto: CreateLessonPlanDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao criar plano de lição');
    }
    await fetchAgenda();
  };

  const handleReschedule = async (lessonId: string, dto: RescheduleLessonDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/lessons/${lessonId}/reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao reagendar lição');
    }
    await fetchAgenda();
  };

  const handleCompleteLesson = async (
    lessonId: string,
    dto: CompleteLessonDto,
    learnerId?: string
  ) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const url = learnerId
      ? `/api/v1/families/${familyId}/lessons/${lessonId}/complete?learnerId=${learnerId}`
      : `/api/v1/families/${familyId}/lessons/${lessonId}/complete`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao concluir lição');
    }
    await fetchAgenda();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchAgenda();
    }
  };

  const handleCreateSlot = async (dto: CreateScheduleSlotDto) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/schedule/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao criar bloco de rotina');
    }
    await fetchSlots();
    await fetchAgenda();
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!familyId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/families/${familyId}/schedule/slots/${slotId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchSlots();
      await fetchAgenda();
    }
  };

  const handleOpenReschedule = (item: DailyAgendaItemDto) => {
    setRescheduleItem({
      id: item.id,
      title: item.title,
      date: selectedDate,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
    });
    setIsRescheduleModalOpen(true);
  };

  const handleOpenComplete = (item: DailyAgendaItemDto) => {
    setCompleteItem({
      id: item.id,
      title: item.title,
      durationMinutes: item.lessonPlan?.durationMinutes || 45,
      learners: item.lessonPlan?.learners || item.learnerIds.map((id) => ({ learnerId: id })),
    });
    setIsCompleteModalOpen(true);
  };

  const handleOpenAddSlot = (day?: DayOfWeek) => {
    setSlotDayOfWeek(day || 1);
    setIsSlotModalOpen(true);
  };

  return (
    <ProductShell
      learners={learners}
      activeLearnerId={activeLearnerId}
      onSelectLearner={setActiveLearnerId}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Top Header and Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Agenda & Rotina de Aprendizagem
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Acompanhe o cronograma diário, marque lições concluídas e planeje a rotina semanal da família.
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--sage-soft)',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <button
              type="button"
              data-testid="tab-agenda"
              onClick={() => setActiveTab('agenda')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeTab === 'agenda' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'agenda' ? 'var(--forest)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'agenda' ? 700 : 500,
                fontSize: '0.875rem',
                boxShadow: activeTab === 'agenda' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AletheiaIcon name="calendar" size="sm" />
              <span>Agenda Diária (Checklist)</span>
            </button>
            <button
              type="button"
              data-testid="tab-routine"
              onClick={() => setActiveTab('routine')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: activeTab === 'routine' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'routine' ? 'var(--forest)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'routine' ? 700 : 500,
                fontSize: '0.875rem',
                boxShadow: activeTab === 'routine' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AletheiaIcon name="calendar-range" size="sm" />
              <span>Rotina Semanal</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Carregando agenda e rotina...
          </div>
        ) : activeTab === 'agenda' ? (
          <DailyAgendaView
            agenda={agenda}
            selectedDate={selectedDate}
            learners={learners}
            activeLearnerId={activeLearnerId}
            onDateChange={setSelectedDate}
            onOpenCreateLesson={() => setIsLessonModalOpen(true)}
            onOpenCreateSlot={() => handleOpenAddSlot(1)}
            onOpenCompleteLesson={handleOpenComplete}
            onOpenRescheduleLesson={handleOpenReschedule}
            onDeleteLesson={handleDeleteLesson}
            onDeleteSlot={handleDeleteSlot}
          />
        ) : (
          <WeeklyRoutineGrid
            slots={slots}
            learners={learners}
            subjects={subjects}
            onAddSlot={handleOpenAddSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        )}

        {/* Modals */}
        <LessonFormModal
          isOpen={isLessonModalOpen}
          onClose={() => setIsLessonModalOpen(false)}
          onSave={handleCreateLesson}
          learners={learners}
          subjects={subjects}
          objectives={objectives}
          initialDate={selectedDate}
        />

        <RoutineSlotModal
          isOpen={isSlotModalOpen}
          onClose={() => setIsSlotModalOpen(false)}
          onSave={handleCreateSlot}
          learners={learners}
          subjects={subjects}
          initialDayOfWeek={slotDayOfWeek}
        />

        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          lesson={rescheduleItem}
          onClose={() => setIsRescheduleModalOpen(false)}
          onReschedule={handleReschedule}
        />

        <CompleteLessonModal
          isOpen={isCompleteModalOpen}
          lesson={completeItem}
          onClose={() => setIsCompleteModalOpen(false)}
          onComplete={handleCompleteLesson}
        />
      </div>
    </ProductShell>
  );
}
