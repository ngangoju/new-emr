import { describe, expect, it } from 'vitest'

import {
    findDashboardSearchTarget,
    findAllDashboardSearchTargets,
    normalizeSearchQuery,
    tokenizeQuery,
    highlightMatch,
} from '@/lib/utils/dashboardSearch'

describe('normalizeSearchQuery', () => {
    it('returns empty string for null/undefined input', () => {
        expect(normalizeSearchQuery(null as any)).toBe('')
        expect(normalizeSearchQuery(undefined as any)).toBe('')
    })

    it('trims leading and trailing whitespace', () => {
        expect(normalizeSearchQuery('  patients  ')).toBe('patients')
    })

    it('collapses multiple consecutive spaces to single space', () => {
        expect(normalizeSearchQuery('lab    results')).toBe('lab results')
    })

    it('converts to lowercase', () => {
        expect(normalizeSearchQuery('PATIENTS')).toBe('patients')
    })

    it('handles mixed case with spaces', () => {
        expect(normalizeSearchQuery('  Lab   Results  ')).toBe('lab results')
    })

    it('limits query length to 100 characters', () => {
        const longQuery = 'a'.repeat(150)
        expect(normalizeSearchQuery(longQuery).length).toBe(100)
    })

    it('handles empty string after trimming', () => {
        expect(normalizeSearchQuery('   ')).toBe('')
    })
})

describe('tokenizeQuery', () => {
    it('returns empty array for empty input', () => {
        expect(tokenizeQuery('')).toEqual([])
        expect(tokenizeQuery('   ')).toEqual([])
    })

    it('splits query into tokens', () => {
        expect(tokenizeQuery('lab results')).toEqual(['lab', 'results'])
    })

    it('filters out empty tokens from multiple spaces', () => {
        expect(tokenizeQuery('lab    results')).toEqual(['lab', 'results'])
    })

    it('handles single word queries', () => {
        expect(tokenizeQuery('patients')).toEqual(['patients'])
    })
})

describe('highlightMatch', () => {
    it('returns isMatch false for empty query', () => {
        const result = highlightMatch('Patients', '')
        expect(result.isMatch).toBe(false)
    })

    it('detects match for single token', () => {
        const result = highlightMatch('Patients', 'pat')
        expect(result.isMatch).toBe(true)
    })

    it('detects match for multiple tokens', () => {
        const result = highlightMatch('Lab Results', 'lab results')
        expect(result.isMatch).toBe(true)
    })

    it('returns isMatch false when no match', () => {
        const result = highlightMatch('Patients', 'xyz')
        expect(result.isMatch).toBe(false)
    })
})

describe('findDashboardSearchTarget', () => {
    const targets = [
        { title: 'Patients', href: '/dashboard/doctor/patients' },
        { title: 'Lab Results', href: '/dashboard/lab' },
        { title: 'Cash Close', href: '/dashboard/cashier/close' },
        { title: 'Pharmacy', href: '/dashboard/pharmacy' },
        { title: 'Medical Records', href: '/dashboard/doctor/records' },
    ] as const

    it('returns null for blank input after trimming', () => {
        expect(findDashboardSearchTarget('   ', targets)).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(findDashboardSearchTarget('', targets)).toBeNull()
    })

    it('matches title with inner spaces preserved', () => {
        const target = findDashboardSearchTarget('lab results', targets)
        expect(target?.href).toBe('/dashboard/lab')
    })

    it('matches by href segment', () => {
        const target = findDashboardSearchTarget('cashier/close', targets)
        expect(target?.title).toBe('Cash Close')
    })

    it('handles leading/trailing spaces in query', () => {
        const target = findDashboardSearchTarget('  patients  ', targets)
        expect(target?.href).toBe('/dashboard/doctor/patients')
    })

    it('handles multiple consecutive spaces in query', () => {
        const target = findDashboardSearchTarget('lab    results', targets)
        expect(target?.href).toBe('/dashboard/lab')
    })

    it('matches partial word in title', () => {
        const target = findDashboardSearchTarget('pat', targets)
        expect(target?.href).toBe('/dashboard/doctor/patients')
    })

    it('matches partial word in href', () => {
        const target = findDashboardSearchTarget('doctor/rec', targets)
        expect(target?.href).toBe('/dashboard/doctor/records')
    })

    it('returns null when no match found', () => {
        const target = findDashboardSearchTarget('xyz123', targets)
        expect(target).toBeNull()
    })

    it('handles case-insensitive matching', () => {
        const target = findDashboardSearchTarget('LAB RESULTS', targets)
        expect(target?.href).toBe('/dashboard/lab')
    })

    it('matches multi-word query across title', () => {
        const target = findDashboardSearchTarget('medical records', targets)
        expect(target?.href).toBe('/dashboard/doctor/records')
    })

    it('returns null for null/undefined input', () => {
        expect(findDashboardSearchTarget(null as any, targets)).toBeNull()
        expect(findDashboardSearchTarget(undefined as any, targets)).toBeNull()
    })
})

describe('findAllDashboardSearchTargets', () => {
    const targets = [
        { title: 'Patients', href: '/dashboard/doctor/patients' },
        { title: 'Lab Results', href: '/dashboard/lab' },
        { title: 'Cash Close', href: '/dashboard/cashier/close' },
        { title: 'Pharmacy', href: '/dashboard/pharmacy' },
        { title: 'Billing', href: '/dashboard/billing' },
        { title: 'Medical Records', href: '/dashboard/doctor/records' },
    ] as const

    it('returns empty array for blank input', () => {
        expect(findAllDashboardSearchTargets('   ', targets)).toEqual([])
    })

    it('returns all matches sorted by relevance', () => {
        const results = findAllDashboardSearchTargets('lab', targets)
        expect(results.length).toBeGreaterThan(0)
        // Exact match should come first
        expect(results[0]?.title).toBe('Lab Results')
    })

    it('limits results by maxResults parameter', () => {
        const results = findAllDashboardSearchTargets('a', targets, 2)
        expect(results.length).toBe(2)
    })

    it('returns matches for partial token', () => {
        const results = findAllDashboardSearchTargets('rec', targets)
        expect(results.length).toBeGreaterThan(0)
    })

    it('returns empty array when no matches', () => {
        const results = findAllDashboardSearchTargets('xyz123', targets)
        expect(results).toEqual([])
    })

    it('handles space-separated tokens', () => {
        const results = findAllDashboardSearchTargets('lab result', targets)
        expect(results.some(r => r.href === '/dashboard/lab')).toBe(true)
    })

    it('prioritizes exact matches over partial matches', () => {
        const results = findAllDashboardSearchTargets('patients', targets)
        expect(results[0]?.href).toBe('/dashboard/doctor/patients')
    })
})

