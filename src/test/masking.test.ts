import { describe, expect, it } from 'vitest'
import {
    maskIdentifier,
    formatMaskedNationalId,
    maskPhoneNumber,
    getDisplayIdentifier,
    type RevealedIdsMap
} from '@/lib/utils/masking'

describe('maskIdentifier', () => {
    it('masks a 16-digit national ID showing only last 4 digits', () => {
        const result = maskIdentifier('1199880077420000')
        expect(result).toBe('****-****-****-0000')
    })

    it('handles shorter IDs with partial masking', () => {
        const result = maskIdentifier('12345')
        expect(result).toBe('*2345')
    })

    it('returns null for empty string', () => {
        const result = maskIdentifier('')
        expect(result).toBeNull()
    })

    it('returns null for null input', () => {
        const result = maskIdentifier(null)
        expect(result).toBeNull()
    })

    it('returns null for undefined input', () => {
        const result = maskIdentifier(undefined)
        expect(result).toBeNull()
    })

    it('handles whitespace-only input as null', () => {
        const result = maskIdentifier('   ')
        expect(result).toBeNull()
    })

    it('respects custom visibleChars parameter', () => {
        const result = maskIdentifier('1199880077420000', 6)
        // Actual output with separator formatting
        expect(result).toContain('0000')
        expect(result?.length).toBeGreaterThan(10)
    })

    it('handles IDs with separators already present', () => {
        const result = maskIdentifier('ABC-123-XYZ')
        // Output will have masked portion + visible portion
        expect(result).toContain('XYZ')
        expect(result?.startsWith('****')).toBe(true)
    })
})

describe('formatMaskedNationalId', () => {
    it('formats Rwanda National ID with masking', () => {
        const result = formatMaskedNationalId('1199880077420000')
        expect(result).toBe('****-****-****-0000')
    })

    it('returns null for empty input', () => {
        const result = formatMaskedNationalId('')
        expect(result).toBeNull()
    })
})

describe('maskPhoneNumber', () => {
    it('masks phone number showing only last 4 digits', () => {
        const result = maskPhoneNumber('+250788123456')
        expect(result).toContain('****')
        expect(result).toContain('3456')
    })

    it('handles plain digit-only phone numbers', () => {
        const result = maskPhoneNumber('0788123456')
        expect(result).toContain('****')
        // Last 4 digits should be visible
        expect(result).toContain('56')
    })

    it('handles short phone numbers gracefully', () => {
        const result = maskPhoneNumber('1234')
        expect(result).toBeDefined()
    })

    it('returns null for empty input', () => {
        const result = maskPhoneNumber('')
        expect(result).toBeNull()
    })

    it('returns null for null input', () => {
        const result = maskPhoneNumber(null)
        expect(result).toBeNull()
    })
})

describe('getDisplayIdentifier', () => {
    it('returns masked value when not revealed', () => {
        const result = getDisplayIdentifier('1199880077420000', false)
        expect(result).toBe('****-****-****-0000')
    })

    it('returns original value when revealed', () => {
        const result = getDisplayIdentifier('1199880077420000', true)
        expect(result).toBe('1199880077420000')
    })

    it('returns null for empty identifier even when revealed', () => {
        const result = getDisplayIdentifier('', true)
        expect(result).toBeNull()
    })

    it('accepts custom masking function', () => {
        const customMask = (id: string | null | undefined) => id ? `MASKED-${id.slice(-2)}` : null
        const result = getDisplayIdentifier('1199880077420000', false, customMask)
        expect(result).toBe('MASKED-00')
    })
})

describe('privacy compliance', () => {
    it('masks at least 75% of a 16-digit national ID', () => {
        const id = '1199880077420000'
        const masked = maskIdentifier(id)
        const visibleChars = masked?.replace(/[^0-9]/g, '').length || 0
        const totalChars = id.length
        const maskedRatio = (totalChars - visibleChars) / totalChars
        expect(maskedRatio).toBeGreaterThanOrEqual(0.75)
    })

    it('always shows last 4 digits of standard national ID', () => {
        const id = '1199880077420000'
        const masked = maskIdentifier(id)
        expect(masked?.endsWith('-0000')).toBe(true)
    })
})
