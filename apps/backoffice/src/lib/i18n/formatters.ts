export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-ES';

const DEFAULT_CURRENCY_BY_LOCALE: Record<SupportedLocale, string> = {
  'pt-BR': 'BRL',
  'en-US': 'USD',
  'es-ES': 'EUR',
};

function toValidDate(date: Date | string | number): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

export function formatDate(
  locale: SupportedLocale,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = toValidDate(date);
  if (isNaN(d.getTime())) return String(date);
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function formatTime(
  locale: SupportedLocale,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = toValidDate(date);
  if (isNaN(d.getTime())) return String(date);
  const opts: Intl.DateTimeFormatOptions = options ?? { hour: '2-digit', minute: '2-digit' };
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

export function formatNumber(
  locale: SupportedLocale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  if (typeof value !== 'number' || isNaN(value)) return String(value);
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(
  locale: SupportedLocale,
  value: number,
  currency?: string,
): string {
  if (typeof value !== 'number' || isNaN(value)) return String(value);
  const resolvedCurrency = currency || DEFAULT_CURRENCY_BY_LOCALE[locale] || 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: resolvedCurrency,
  }).format(value);
}
