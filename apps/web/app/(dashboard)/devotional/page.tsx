'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
  CreatePrayerDto,
  DailyDevotionalResponseDto,
  PrayerResponseDto,
  UpsertDailyDevotionalDto,
} from '@aletheia/contracts';
import { DevotionalView } from '../../../src/components/devotional/devotional-view';
import { DevotionalFormModal } from '../../../src/components/devotional/devotional-form-modal';
import { PrayerJournal } from '../../../src/components/devotional/prayer-journal';
import { ProductShell } from '../../../src/components/product-shell';

export interface DevotionalPageProps {
  initialDevotional?: DailyDevotionalResponseDto | null;
  initialPrayers?: PrayerResponseDto[];
  familyId?: string;
  initialDate?: string;
}

export default function DevotionalPage({
  initialDevotional = null,
  initialPrayers = [],
  familyId = 'family-current',
  initialDate,
}: DevotionalPageProps) {
  const getTodayString = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [currentDate, setCurrentDate] = useState<string>(
    initialDate || (initialDevotional?.date ? initialDevotional.date : getTodayString())
  );
  const [devotional, setDevotional] = useState<DailyDevotionalResponseDto | null>(initialDevotional);
  const [prayers, setPrayers] = useState<PrayerResponseDto[]>(initialPrayers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchDevotional = useCallback(
    async (date: string) => {
      try {
        const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/devotionals/by-date?date=${encodeURIComponent(date)}`);
        if (res.ok) {
          const data = await res.json();
          setDevotional(data);
          setLoadError(null);
        } else if (res.status === 404) {
          setDevotional(null);
          setLoadError(null);
        } else {
          setLoadError('Não foi possível carregar o devocional do dia.');
        }
      } catch {
        setLoadError('Não foi possível carregar o devocional do dia. Verifique sua conexão.');
      }
    },
    [familyId]
  );

  const fetchPrayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers`);
      if (res.ok) {
        const data = await res.json();
        setPrayers(data);
      } else {
        setLoadError('Não foi possível carregar o mural de orações.');
      }
    } catch {
      setLoadError('Não foi possível carregar o mural de orações. Verifique sua conexão.');
    }
  }, [familyId]);

  // Initial fetch for prayers if not provided
  useEffect(() => {
    if (initialPrayers.length === 0) {
      fetchPrayers();
    }
  }, [fetchPrayers, initialPrayers.length]);

  // Refetch when date changes (if not using pre-passed initialDevotional on initial mount)
  useEffect(() => {
    if (initialDevotional && initialDevotional.date === currentDate) {
      return;
    }
    fetchDevotional(currentDate);
  }, [currentDate, fetchDevotional, initialDevotional]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
  };

  const handleOpenEdit = () => {
    setIsModalOpen(true);
  };

  const handleSubmitDevotional = async (data: UpsertDailyDevotionalDto) => {
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/devotionals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao salvar devocional.');
    }

    const saved = await res.json();
    setDevotional(saved);
    if (saved.date !== currentDate) {
      setCurrentDate(saved.date);
    }
  };

  const handleCreatePrayer = async (data: CreatePrayerDto) => {
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao salvar oração.');
    }

    const created = await res.json();
    setPrayers((prev) => [created, ...prev]);
  };

  const handleAnswerPrayer = async (id: string, answeredNote?: string) => {
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers/${encodeURIComponent(id)}/answer`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answeredNote }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao registrar oração respondida.');
    }

    const updated = await res.json();
    setPrayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleArchivePrayer = async (id: string) => {
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Falha ao arquivar oração.');
    }

    setPrayers((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductShell currentPath="/devotional">
      <div className="devotional-page-container" style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
            Culto Doméstico & Devocional
          </h1>
          <p className="page-subtitle" style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Cultive a fé em família através da leitura da Bíblia, reflexão, louvor e oração diária.
          </p>
        </div>

        {loadError && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1.5rem' }}>
            {loadError}
          </div>
        )}

        <div className="devotional-page-grid">
          <div>
            <DevotionalView
              currentDate={currentDate}
              devotional={devotional}
              onEdit={handleOpenEdit}
              onDateChange={handleDateChange}
            />
          </div>

          <div>
            <PrayerJournal
              prayers={prayers}
              onCreatePrayer={handleCreatePrayer}
              onAnswerPrayer={handleAnswerPrayer}
              onArchivePrayer={handleArchivePrayer}
            />
          </div>
        </div>

        <DevotionalFormModal
          isOpen={isModalOpen}
          currentDate={currentDate}
          initialData={devotional}
          familyId={familyId}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitDevotional}
        />
      </div>
    </ProductShell>
  );
}
