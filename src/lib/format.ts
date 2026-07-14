/**
 * Central money / date formatters (i18n foundation).
 * Replace scattered RWF / toLocaleString call sites over time.
 */

export type MoneyFormatOptions = {
  currency?: string
  locale?: string
  /** When true, omit currency code and show amount only */
  amountOnly?: boolean
}

const DEFAULT_CURRENCY = 'RWF'
const DEFAULT_LOCALE = 'en-RW'

export function formatMoney(
  value: number | string | null | undefined,
  options: MoneyFormatOptions = {},
): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '—'

  const locale = options.locale ?? DEFAULT_LOCALE
  const currency = options.currency ?? DEFAULT_CURRENCY

  if (options.amountOnly) {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n)
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'RWF' ? 0 : 2,
    }).format(n)
  } catch {
    return `${currency} ${n.toLocaleString(locale)}`
  }
}

export type DateFormatOptions = {
  locale?: string
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'full' | 'long' | 'medium' | 'short'
  /** Include time portion */
  withTime?: boolean
}

export function formatDate(
  value: string | number | Date | null | undefined,
  options: DateFormatOptions = {},
): string {
  if (value === null || value === undefined || value === '') return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'

  const locale = options.locale ?? DEFAULT_LOCALE
  if (options.withTime || options.timeStyle) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: options.dateStyle ?? 'medium',
      timeStyle: options.timeStyle ?? 'short',
    }).format(d)
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: options.dateStyle ?? 'medium',
  }).format(d)
}

export function formatRelative(
  value: string | number | Date | null | undefined,
  locale = DEFAULT_LOCALE,
): string {
  if (value === null || value === undefined || value === '') return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'

  const diffSec = Math.round((d.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(diffSec, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  return rtf.format(Math.round(diffSec / 86400), 'day')
}
