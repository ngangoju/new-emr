/**
 * Lightweight i18n foundation (en now; rw/fr dictionaries later).
 * Prefer next-intl migration when routing locales are introduced.
 */
import en from './messages/en.json'

export type MessageTree = typeof en

const catalogs: Record<string, MessageTree> = {
  en,
}

let currentLocale = 'en'

export function setLocale(locale: string) {
  if (catalogs[locale]) currentLocale = locale
}

export function getLocale() {
  return currentLocale
}

function dig(obj: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return undefined
    }
  }
  return typeof cur === 'string' ? cur : undefined
}

export function t(key: string, fallback?: string): string {
  const catalog = catalogs[currentLocale] ?? en
  return dig(catalog, key) ?? fallback ?? key
}
