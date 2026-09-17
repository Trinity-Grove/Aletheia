'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ptBR, type Dictionary } from './dictionaries/pt-BR';
import { enUS } from './dictionaries/en-US';
import { esES } from './dictionaries/es-ES';
import {
  formatDate as formatWithDate,
  formatTime as formatWithTime,
  formatNumber as formatWithNumber,
  formatCurrency as formatWithCurrency,
} from './formatters';

export type Locale = 'pt-BR' | 'en-US' | 'es-ES';

export * from './formatters';

const DICTIONARIES: Record<Locale, Dictionary> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
};

const LOCALE_STORAGE_KEY = 'aletheia_locale';

function isLocale(value: string | null): value is Locale {
  return value === 'pt-BR' || value === 'en-US' || value === 'es-ES';
}

function readDotPath(dictionary: Dictionary, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object' && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dictionary);
  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt-BR');

  // Instant paint from whatever was last chosen on this device; the family's
  // real saved setting (fetched below) reconciles shortly after if it
  // differs -- never blocks first render on a network round trip.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(stored)) setLocaleState(stored);
    } catch {
      // localStorage unavailable -- stay on the pt-BR default.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function reconcileWithFamilySettings() {
      let familyId: string | null = null;
      try {
        familyId = localStorage.getItem('familyId');
      } catch {
        return;
      }
      if (!familyId) return;

      try {
        const res = await fetch(`/api/v1/families/${encodeURIComponent(familyId)}/settings`, {
          credentials: 'include',
        });
        if (!res.ok || cancelled) return;
        const settings = await res.json();
        if (isLocale(settings?.language)) {
          setLocaleState(settings.language);
        }
      } catch {
        // Keep whatever locale is already active -- never block on this.
      }
    }
    void reconcileWithFamilySettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Non-fatal -- the choice just won't survive a reload on this device.
    }

    // When familyId is available, synchronize choice with family settings in background
    try {
      const familyId = localStorage.getItem('familyId');
      if (familyId) {
        void fetch(`/api/v1/families/${encodeURIComponent(familyId)}/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ language: next }),
        }).catch(() => {
          // Background sync failure is non-fatal
        });
      }
    } catch {
      // Ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dictionary = DICTIONARIES[locale];
      // No console usage in this codebase's frontend -- a missing key
      // falls back to itself silently rather than logging, same as the
      // fallback-to-pt-BR lookup right above it.
      const value = readDotPath(dictionary, key) ?? readDotPath(ptBR, key) ?? key;
      return interpolate(value, vars);
    },
    [locale],
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string =>
      formatWithDate(locale, date, options),
    [locale],
  );

  const formatTime = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string =>
      formatWithTime(locale, date, options),
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string =>
      formatWithNumber(locale, value, options),
    [locale],
  );

  const formatCurrency = useCallback(
    (value: number, currency?: string): string =>
      formatWithCurrency(locale, value, currency),
    [locale],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      formatDate,
      formatTime,
      formatNumber,
      formatCurrency,
    }),
    [locale, setLocale, t, formatDate, formatTime, formatNumber, formatCurrency],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// Falls back to a pt-BR-only, no-op-setLocale default instead of throwing --
// component tests render trees without a LocaleProvider ancestor (the same
// pattern useOptionalAuth already follows here), and a hard throw would
// break every test for every component migrated to use this hook.
const fallbackContext: LocaleContextValue = {
  locale: 'pt-BR',
  setLocale: () => {},
  t: (key, vars) => interpolate(readDotPath(ptBR, key) ?? key, vars),
  formatDate: (date, options) => formatWithDate('pt-BR', date, options),
  formatTime: (date, options) => formatWithTime('pt-BR', date, options),
  formatNumber: (val, options) => formatWithNumber('pt-BR', val, options),
  formatCurrency: (val, currency) => formatWithCurrency('pt-BR', val, currency),
};

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext) ?? fallbackContext;
}
