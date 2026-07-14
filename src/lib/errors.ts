/**
 * Typed API error surface for EMR UI.
 * Prefer codes over message string-matching for permission / severity handling.
 */

export type EmrErrorCode =
  | 'PERMISSION_DENIED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'SERVER'
  | 'NETWORK'
  | 'UNKNOWN'

export type EmrErrorSeverity = 'field' | 'toast' | 'modal' | 'silent'

export type EmrError = {
  code: EmrErrorCode
  message: string
  severity: EmrErrorSeverity
  status?: number
  fieldErrors?: Record<string, string>
  traceId?: string
  /** When true, blocking modal is appropriate (destructive / non-recoverable) */
  blocking?: boolean
}

export function severityForCode(code: EmrErrorCode, blocking?: boolean): EmrErrorSeverity {
  if (blocking) return 'modal'
  switch (code) {
    case 'PERMISSION_DENIED':
    case 'UNAUTHORIZED':
      return 'silent'
    case 'NOT_FOUND':
      return 'silent'
    case 'RATE_LIMITED':
      return 'toast'
    case 'VALIDATION':
      return 'field'
    case 'CONFLICT':
    case 'SERVER':
      return 'toast'
    case 'NETWORK':
      return 'toast'
    default:
      return 'toast'
  }
}

export function mapHttpStatusToCode(status?: number): EmrErrorCode {
  if (!status) return 'NETWORK'
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'PERMISSION_DENIED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 422 || status === 400) return 'VALIDATION'
  if (status === 429) return 'RATE_LIMITED'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

export function toEmrError(input: {
  status?: number
  message?: string
  code?: string
  details?: unknown
  traceId?: string
  blocking?: boolean
}): EmrError {
  const codeFromBody =
    input.code === 'PERMISSION_DENIED' ||
    input.code === 'UNAUTHORIZED' ||
    input.code === 'NOT_FOUND' ||
    input.code === 'VALIDATION' ||
    input.code === 'RATE_LIMITED' ||
    input.code === 'CONFLICT' ||
    input.code === 'SERVER'
      ? (input.code as EmrErrorCode)
      : undefined

  const code = codeFromBody ?? mapHttpStatusToCode(input.status)
  const fieldErrors =
    input.details && typeof input.details === 'object' && !Array.isArray(input.details)
      ? (input.details as Record<string, string>)
      : undefined

  return {
    code,
    message: input.message || 'Something went wrong',
    severity: severityForCode(code, input.blocking),
    status: input.status,
    fieldErrors,
    traceId: input.traceId,
    blocking: input.blocking,
  }
}
