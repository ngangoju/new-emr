import { describe, expect, it } from 'vitest'
import {
  mapHttpStatusToCode,
  severityForCode,
  toEmrError,
  type EmrErrorCode,
} from '@/lib/errors'

/**
 * The legacy free-text `isPermissionFeedback` string-matching suppression has
 * been removed (Phase 0/1: typed error codes only). These tests lock the
 * new contract: permission/authorization failures are surfaced via typed codes
 * and resolved to `silent` severity (no error popup), while real failures are
 * `toast`/`modal`.
 */

describe('error code mapping', () => {
  it('maps HTTP 403 to PERMISSION_DENIED', () => {
    expect(mapHttpStatusToCode(403)).toBe('PERMISSION_DENIED')
  })
  it('maps HTTP 401 to UNAUTHORIZED', () => {
    expect(mapHttpStatusToCode(401)).toBe('UNAUTHORIZED')
  })
  it('maps 5xx to SERVER', () => {
    expect(mapHttpStatusToCode(500)).toBe('SERVER')
  })
})

describe('severity for permission failures is silent (no popup)', () => {
  it('PERMISSION_DENIED resolves to silent', () => {
    expect(severityForCode('PERMISSION_DENIED')).toBe('silent')
  })
  it('UNAUTHORIZED resolves to silent', () => {
    expect(severityForCode('UNAUTHORIZED')).toBe('silent')
  })
})

describe('typed error field-level vs toast severity', () => {
  it('VALIDATION resolves to field severity', () => {
    expect(toEmrError({ status: 422, message: 'Invalid input' }).severity).toBe('field')
  })
  it('SERVER resolves to toast severity (non-blocking)', () => {
    expect(toEmrError({ status: 500, message: 'Boom' }).severity).toBe('toast')
  })
  it('blocking flag forces modal severity', () => {
    const e = toEmrError({ status: 409, message: 'Conflict', blocking: true })
    expect(e.severity).toBe('modal')
    expect(e.blocking).toBe(true)
  })
  it('carries a typed code for downstream handling', () => {
    const e = toEmrError({ status: 403, message: 'Forbidden' })
    expect(e.code).toBe<EmrErrorCode>('PERMISSION_DENIED')
    expect(e.severity).toBe('silent')
  })
})
