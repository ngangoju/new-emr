import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, formatRelative } from '@/lib/format'
import { mapHttpStatusToCode, severityForCode, toEmrError } from '@/lib/errors'
import { statusToTone } from '@/components/shared/StatusBadge'

describe('formatMoney', () => {
  it('formats RWF amounts via Intl', () => {
    const out = formatMoney(1500, { currency: 'RWF', locale: 'en-RW' })
    expect(out).toMatch(/1[,.\s]?500|RWF|Fr/)
    expect(out).not.toBe('—')
  })

  it('returns em dash for invalid values', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
    expect(formatMoney(Number.NaN)).toBe('—')
  })

  it('amountOnly omits currency styling dependency', () => {
    const out = formatMoney(42, { amountOnly: true, locale: 'en-US' })
    expect(out).toContain('42')
  })
})

describe('formatDate', () => {
  it('formats ISO dates', () => {
    const out = formatDate('2026-01-15T12:00:00Z', { locale: 'en-US', dateStyle: 'medium' })
    expect(out).not.toBe('—')
    expect(out.toLowerCase()).toMatch(/jan|2026|15/)
  })
})

describe('formatRelative', () => {
  it('returns a relative string for recent times', () => {
    const out = formatRelative(new Date(Date.now() - 30_000), 'en')
    expect(out).not.toBe('—')
  })
})

describe('toEmrError', () => {
  it('maps 403 to PERMISSION_DENIED with silent severity', () => {
    const err = toEmrError({ status: 403, message: 'nope' })
    expect(err.code).toBe('PERMISSION_DENIED')
    expect(err.severity).toBe('silent')
  })

  it('maps 500 to SERVER toast', () => {
    const err = toEmrError({ status: 500, message: 'boom' })
    expect(err.code).toBe('SERVER')
    expect(severityForCode(err.code)).toBe('toast')
  })

  it('uses typed body code when present', () => {
    const err = toEmrError({ status: 400, code: 'VALIDATION', message: 'bad' })
    expect(err.code).toBe('VALIDATION')
    expect(mapHttpStatusToCode(429)).toBe('RATE_LIMITED')
  })
})

describe('statusToTone', () => {
  it('maps clinical statuses to semantic tones', () => {
    expect(statusToTone('COMPLETED')).toBe('success')
    expect(statusToTone('PENDING')).toBe('pending')
    expect(statusToTone('CANCELLED')).toBe('critical')
    expect(statusToTone('ON_HOLD')).toBe('warning')
  })
})
