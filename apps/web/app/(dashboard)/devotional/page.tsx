'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, PageHeader } from '@aletheia/ui';
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
import { useLocale } from '../../../src/lib/i18n/locale-context';

export interface DevotionalPageProps {
  initialDevotional?: DailyDevotionalResponseDto | null;
  initialPrayers?: PrayerResponseDto[];
  initialDate?: string;
}

export default function DevotionalPage({
  initialDevotional = null,
  initialPrayers = [],
  initialDate,
}: DevotionalPageProps) {
  const { t } = useLocale();
  // Next.js never passes custom props into a page component — every other
  // dashboard page reads the active family from localStorage instead of
  // accepting it as a prop. This page previously defaulted to the literal
  // string 'family-current', so every fetch it made targeted a
  // nonexistent family and (missing `credentials: 'include'` on top of
  // that) would have been unauthenticated even if it hadn't.
  const [familyId, setFamilyId] = useState<string | null>(null);
  useEffect(() => {
    setFamilyId(localStorage.getItem('familyId'));
  }, []);
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
      if (!familyId) return;
      try {
        const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/devotionals/by-date?date=${encodeURIComponent(date)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setDevotional(data);
          setLoadError(null);
        } else if (res.status === 404) {
          setDevotional(null);
          setLoadError(null);
        } else {
          setLoadError(t('devotional.page.errors.loadDevotional'));
        }
      } catch {
        setLoadError(t('devotional.page.errors.loadDevotionalConnection'));
      }
    },
    [familyId, t]
  );

  const fetchPrayers = useCallback(async () => {
    if (!familyId) return;
    try {
      const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPrayers(data);
      } else {
        setLoadError(t('devotional.page.errors.loadPrayers'));
      }
    } catch {
      setLoadError(t('devotional.page.errors.loadPrayersConnection'));
    }
  }, [familyId, t]);

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
    if (!familyId) throw new Error(t('devotional.page.errors.familyUnauthenticated'));
    // The API models this as an upsert keyed by date, not a create — a
    // second save for the same day edits the existing devotional instead
    // of erroring on a duplicate.
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/devotionals/by-date`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || t('devotional.page.errors.saveDevotional'));
    }

    const saved = await res.json();
    setDevotional(saved);
    if (saved.date !== currentDate) {
      setCurrentDate(saved.date);
    }
  };

  const handleCreatePrayer = async (data: CreatePrayerDto) => {
    if (!familyId) throw new Error(t('devotional.page.errors.familyUnauthenticated'));
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || t('devotional.page.errors.savePrayer'));
    }

    const created = await res.json();
    setPrayers((prev) => [created, ...prev]);
  };

  const handleAnswerPrayer = async (id: string, answeredNote?: string) => {
    if (!familyId) throw new Error(t('devotional.page.errors.familyUnauthenticated'));
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers/${encodeURIComponent(id)}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ answeredNote }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || t('devotional.page.errors.answerPrayer'));
    }

    const updated = await res.json();
    setPrayers((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleArchivePrayer = async (id: string) => {
    if (!familyId) throw new Error(t('devotional.page.errors.familyUnauthenticated'));
    const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/prayers/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || t('devotional.page.errors.archivePrayer'));
    }

    setPrayers((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductShell currentPath="/devotional">
      <div className="page-container devotional-page-container">
        <PageHeader
          title={t('devotional.page.title')}
          description={t('devotional.page.subtitle')}
        />

        {loadError && (
          <Alert variant="error" style={{ marginBottom: '1.5rem' }}>
            {loadError}
          </Alert>
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
