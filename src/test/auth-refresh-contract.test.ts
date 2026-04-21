import { describe, expect, it } from 'vitest'
import { parseRefreshTokenResponse, type RefreshTokenResponse } from '@/lib/api'

describe('parseRefreshTokenResponse', () => {
    describe('new structured JSON contract', () => {
        it('parses RefreshTokenResponse with accessToken', () => {
            const response: RefreshTokenResponse = {
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }
            const result = parseRefreshTokenResponse(response)
            expect(result).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-token')
        })

        it('handles RefreshTokenResponse with empty accessToken', () => {
            const response = {
                accessToken: '',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }
            // Empty string is falsy, so it should fall through to legacy handling
            expect(() => parseRefreshTokenResponse(response)).toThrow('Invalid refresh token response format')
        })
    })

    describe('legacy object format with token field', () => {
        it('parses legacy object format with token field', () => {
            const response = {
                token: 'legacy-token-value',
                expires: 1234567890
            }
            const result = parseRefreshTokenResponse(response)
            expect(result).toBe('legacy-token-value')
        })
    })

    describe('legacy plain string format', () => {
        it('parses plain string token (backward compatibility)', () => {
            const response = 'plain-string-token'
            const result = parseRefreshTokenResponse(response)
            expect(result).toBe('plain-string-token')
        })

        it('trims whitespace from plain string token', () => {
            const response = '  token-with-whitespace  '
            const result = parseRefreshTokenResponse(response)
            expect(result).toBe('token-with-whitespace')
        })
    })

    describe('error handling', () => {
        it('throws error for null response', () => {
            expect(() => parseRefreshTokenResponse(null)).toThrow('Empty refresh token response')
        })

        it('throws error for undefined response', () => {
            expect(() => parseRefreshTokenResponse(undefined)).toThrow('Empty refresh token response')
        })

        it('throws error for empty object', () => {
            expect(() => parseRefreshTokenResponse({})).toThrow('Invalid refresh token response format')
        })

        it('throws error for number response', () => {
            expect(() => parseRefreshTokenResponse(12345)).toThrow('Invalid refresh token response format')
        })

        it('throws error for boolean response', () => {
            expect(() => parseRefreshTokenResponse(true)).toThrow('Invalid refresh token response format')
        })

        it('throws error for array response', () => {
            expect(() => parseRefreshTokenResponse(['token'])).toThrow('Invalid refresh token response format')
        })
    })

    describe('contract migration scenarios', () => {
        it('prefers new accessToken field over legacy token field', () => {
            const response = {
                accessToken: 'new-token',
                token: 'legacy-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }
            const result = parseRefreshTokenResponse(response)
            expect(result).toBe('new-token')
        })

        it('falls back to legacy token when accessToken is missing', () => {
            const response = {
                token: 'fallback-token',
                expires: 1234567890
            }
            const result = parseRefreshTokenResponse(response)
            expect(result).toBe('fallback-token')
        })
    })
})
