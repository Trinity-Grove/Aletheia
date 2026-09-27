'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ptBR, type Dictionary } from './dictionaries/pt-BR';
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
  'en-US': ptBR,
  'es-ES': ptBR,
};

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
  const [locale, setLocale] = useState<Locale>('pt-BR');

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dictionary = DICTIONARIES[locale] || ptBR;
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
