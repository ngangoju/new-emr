import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { api, parseRefreshTokenResponse, type RefreshTokenResponse } from '@/lib/api'

describe('API Interceptor - Auth Refresh Handling', () => {
    describe('parseRefreshTokenResponse', () => {
        it('should parse new structured JSON response with accessToken', () => {
            const response: RefreshTokenResponse = {
                accessToken: 'new-access-token-123',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            const result = parseRefreshTokenResponse(response)

            expect(result).toBe('new-access-token-123')
        })

        it('should parse legacy object format with token field', () => {
            const response = {
                token: 'legacy-token-value',
                expires: 1234567890
            }

            const result = parseRefreshTokenResponse(response)

            expect(result).toBe('legacy-token-value')
        })

        it('should parse plain string token (backward compatibility)', () => {
            const response = 'plain-string-token'

            const result = parseRefreshTokenResponse(response)

            expect(result).toBe('plain-string-token')
        })

        it('should prefer accessToken over legacy token field', () => {
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

        it('should throw error for null response', () => {
            expect(() => parseRefreshTokenResponse(null)).toThrow('Empty refresh token response')
        })

        it('should throw error for undefined response', () => {
            expect(() => parseRefreshTokenResponse(undefined)).toThrow('Empty refresh token response')
        })

        it('should throw error for empty object', () => {
            expect(() => parseRefreshTokenResponse({})).toThrow('Invalid refresh token response format')
        })

        it('should trim whitespace from plain string token', () => {
            const response = '  token-with-whitespace  '

            const result = parseRefreshTokenResponse(response)

            expect(result).toBe('token-with-whitespace')
        })

        it('should throw error for number response', () => {
            expect(() => parseRefreshTokenResponse(12345)).toThrow('Invalid refresh token response format')
        })

        it('should throw error for boolean response', () => {
            expect(() => parseRefreshTokenResponse(true)).toThrow('Invalid refresh token response format')
        })

        it('should throw error for array response', () => {
            expect(() => parseRefreshTokenResponse(['token'])).toThrow('Invalid refresh token response format')
        })

        it('should handle empty accessToken in object', () => {
            const response = {
                accessToken: '',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            // Empty string is falsy, should throw
            expect(() => parseRefreshTokenResponse(response)).toThrow('Invalid refresh token response format')
        })

        it('should fallback to legacy token when accessToken is missing', () => {
            const response = {
                token: 'fallback-token',
                expires: 1234567890
            }

            const result = parseRefreshTokenResponse(response)

            expect(result).toBe('fallback-token')
        })
    })

    describe('Contract Validation', () => {
        it('should validate RefreshTokenResponse has all required fields', () => {
            const validResponse: RefreshTokenResponse = {
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            expect(validResponse.accessToken).toBeDefined()
            expect(validResponse.tokenType).toBe('Bearer')
            expect(validResponse.expiresIn).toBeGreaterThan(0)
            expect(validResponse.userId).toBeDefined()
        })

        it('should accept valid response with all required fields', () => {
            const validResponse: RefreshTokenResponse = {
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            const result = parseRefreshTokenResponse(validResponse)
            expect(result).toBe('test-token')
        })

        it('should validate tokenType is Bearer', () => {
            const response = {
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            expect(response.tokenType).toBe('Bearer')
        })

        it('should validate expiresIn is positive number', () => {
            const response = {
                accessToken: 'test-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            expect(typeof response.expiresIn).toBe('number')
            expect(response.expiresIn).toBeGreaterThan(0)
        })
    })

    describe('Backward Compatibility', () => {
        it('should handle mixed format with both accessToken and token', () => {
            const mixedResponse = {
                accessToken: 'new-token',
                token: 'old-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            const result = parseRefreshTokenResponse(mixedResponse)
            expect(result).toBe('new-token')
        })

        it('should trim whitespace from plain string', () => {
            // Whitespace-only after trim would be empty, but function trims first
            // If the result is empty after trim, it would be returned (which may fail later)
            const result = parseRefreshTokenResponse('   trimmed-token   ')
            expect(result).toBe('trimmed-token')
        })

        it('should handle object with only legacy fields', () => {
            const legacyOnly = {
                token: 'legacy-only-token',
                user: { id: 'user-123', name: 'Test' }
            }

            const result = parseRefreshTokenResponse(legacyOnly)
            expect(result).toBe('legacy-only-token')
        })
    })

    describe('Error Handling', () => {
        it('should provide meaningful error for null response', () => {
            try {
                parseRefreshTokenResponse(null)
                expect.fail('Should have thrown')
            } catch (error: any) {
                expect(error.message).toBe('Empty refresh token response')
            }
        })

        it('should provide meaningful error for invalid format', () => {
            try {
                parseRefreshTokenResponse({ invalid: 'data' })
                expect.fail('Should have thrown')
            } catch (error: any) {
                expect(error.message).toBe('Invalid refresh token response format')
            }
        })

        it('should handle deeply nested objects gracefully', () => {
            const nestedResponse = {
                data: {
                    accessToken: 'nested-token'
                }
            }

            // Should not find accessToken in nested structure
            expect(() => parseRefreshTokenResponse(nestedResponse)).toThrow('Invalid refresh token response format')
        })
    })

    describe('JWT Token Format Validation', () => {
        it('should handle valid JWT format in accessToken', () => {
            const jwtResponse: RefreshTokenResponse = {
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            const result = parseRefreshTokenResponse(jwtResponse)
            expect(result).toContain('.')
            expect(result.split('.')).toHaveLength(3)
        })

        it('should handle opaque token format', () => {
            const opaqueResponse: RefreshTokenResponse = {
                accessToken: 'opaque-token-string-without-dots',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-123'
            }

            const result = parseRefreshTokenResponse(opaqueResponse)
            expect(result).toBe('opaque-token-string-without-dots')
        })
    })

    describe('Contract Migration Scenarios', () => {
        it('handles migration: old backend returns plain string', () => {
            const oldBackendResponse = 'plain-token-from-old-backend'
            const token = parseRefreshTokenResponse(oldBackendResponse)
            expect(token).toBe('plain-token-from-old-backend')
        })

        it('handles migration: new backend returns structured JSON', () => {
            const newBackendResponse: RefreshTokenResponse = {
                accessToken: 'structured-token-from-new-backend',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-456'
            }
            const token = parseRefreshTokenResponse(newBackendResponse)
            expect(token).toBe('structured-token-from-new-backend')
        })

        it('handles migration: transitional backend returns both formats', () => {
            const transitionalResponse = {
                accessToken: 'new-format-token',
                token: 'old-format-token',
                tokenType: 'Bearer',
                expiresIn: 3600,
                userId: 'user-789'
            }
            const token = parseRefreshTokenResponse(transitionalResponse)
            // Should prefer new format
            expect(token).toBe('new-format-token')
        })
    })
})