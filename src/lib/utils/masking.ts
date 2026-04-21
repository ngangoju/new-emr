/**
 * Utility functions for masking sensitive identifiers in the UI
 * Implements privacy-by-design principles for EMR patient data
 */

/**
 * Masks a sensitive identifier, showing only the last 4 digits
 * Examples:
 *   - "1199880077420000" → "****-****-****-0000"
 *   - "ABC-123-XYZ" → "****-****-XYZ"
 *   - "12345" → "****-12345" (short IDs show more)
 *   - "" or null → null
 *
 * @param identifier - The identifier to mask (national ID, SSN, etc.)
 * @param visibleChars - Number of characters to show at the end (default: 4)
 * @returns Masked string or null if input is empty/null
 */
export function maskIdentifier(
    identifier: string | null | undefined,
    visibleChars: number = 4
): string | null {
    if (!identifier || identifier.trim() === '') {
        return null
    }

    const trimmed = identifier.trim()

    // If identifier is shorter than visibleChars + 2, show more of it
    if (trimmed.length <= visibleChars + 2) {
        const maskLength = Math.max(1, trimmed.length - visibleChars)
        return '*'.repeat(maskLength) + trimmed.slice(maskLength)
    }

    // For longer identifiers, show only last N characters
    const maskedPortion = trimmed.slice(0, -visibleChars)
    const visiblePortion = trimmed.slice(-visibleChars)

    // Add separator every 4 characters for readability
    const maskedWithSeparators = maskedPortion
        .replace(/./g, '*')
        .replace(/(.{4})/g, '$1-')
        .replace(/-$/, '')

    return maskedWithSeparators + '-' + visiblePortion
}

/**
 * Formats a national ID with masking for display in operational views
 * Rwanda National ID format: 1199880077420000 (16 digits)
 * Masked format: ****-****-****-0000
 *
 * @param nationalId - The national ID to format and mask
 * @returns Formatted and masked national ID or null
 */
export function formatMaskedNationalId(nationalId: string | null | undefined): string | null {
    return maskIdentifier(nationalId, 4)
}

/**
 * Masks a phone number, showing only last 4 digits
 * Example: "+250788123456" → "****-****-3456"
 *
 * @param phone - The phone number to mask
 * @returns Masked phone number or null
 */
export function maskPhoneNumber(phone: string | null | undefined): string | null {
    if (!phone || phone.trim() === '') {
        return null
    }

    const trimmed = phone.trim()
    const digitsOnly = trimmed.replace(/\D/g, '')

    // If we have at least 4 digits, mask all but last 4
    if (digitsOnly.length >= 4) {
        const visible = digitsOnly.slice(-4)
        const masked = '*'.repeat(digitsOnly.length - 4)
        // Format as ****-****-XXXX
        const formatted = (masked + visible).replace(/(.{4})/g, '$1-').replace(/-$/, '')
        return formatted
    }

    // For very short numbers, just mask half
    const midPoint = Math.floor(trimmed.length / 2)
    return '*'.repeat(midPoint) + trimmed.slice(midPoint)
}

/**
 * React hook state helper for click-to-reveal functionality
 * Usage: const [revealedIds, toggleReveal] = useRevealedIds();
 * Then: toggleReveal(patientId) to toggle reveal state
 */
export type RevealedIdsMap = Record<string, boolean>

/**
 * Creates a toggle function for managing revealed IDs state
 * @param currentMap - Current revealed IDs map
 * @param setMap - State setter function
 * @returns Toggle function
 */
export function createRevealToggle(
    currentMap: RevealedIdsMap,
    setMap: (map: RevealedIdsMap) => void
) {
    return (id: string) => {
        setMap({
            ...currentMap,
            [id]: !currentMap[id],
        })
    }
}

/**
 * Gets the display value for an identifier based on reveal state
 * @param identifier - The actual identifier value
 * @param isRevealed - Whether the identifier should be shown unmasked
 * @param maskFn - Optional custom masking function (defaults to maskIdentifier)
 * @returns Original or masked identifier
 */
export function getDisplayIdentifier(
    identifier: string | null | undefined,
    isRevealed: boolean,
    maskFn: (id: string | null | undefined) => string | null = maskIdentifier
): string | null {
    if (!identifier) return null
    if (isRevealed) return identifier
    return maskFn(identifier)
}
