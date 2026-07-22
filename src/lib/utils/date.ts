import { format as dateFnsFormat, formatDistanceToNow, parseISO, isValid } from 'date-fns'

/**
 * Safely parse a date from various input formats
 */
export function safelyParseDate(date: string | Date | null | undefined): Date | null {
    if (!date) return null

    try {
        if (date instanceof Date) {
            return isValid(date) ? date : null
        }

        const parsed = typeof date === 'string' ? parseISO(date) : new Date(date)
        return isValid(parsed) ? parsed : null
    } catch {
        return null
    }
}

/**
 * Format a date consistently across the application
 */
export function formatDate(
    date: string | Date | null | undefined,
    formatStr: string = 'MMM dd, yyyy'
): string {
    const parsed = safelyParseDate(date)
    if (!parsed) return 'N/A'

    try {
        return dateFnsFormat(parsed, formatStr)
    } catch {
        return 'Invalid date'
    }
}

/**
 * Format a date and time
 */
export function formatDateTime(
    date: string | Date | null | undefined,
    formatStr: string = 'MMM dd, yyyy HH:mm'
): string {
    return formatDate(date, formatStr)
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
    const parsed = safelyParseDate(date)
    if (!parsed) return 'N/A'

    try {
        return formatDistanceToNow(parsed, { addSuffix: true })
    } catch {
        return 'Invalid date'
    }
}

/**
 * Format date for input fields (yyyy-MM-dd)
 */
export function formatInputDate(date: string | Date | null | undefined): string {
    const parsed = safelyParseDate(date)
    if (!parsed) return ''

    try {
        return dateFnsFormat(parsed, 'yyyy-MM-dd')
    } catch {
        return ''
    }
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date | null | undefined): number {
    const parsed = safelyParseDate(dateOfBirth)
    if (!parsed) return 0

    const today = new Date()
    let age = today.getFullYear() - parsed.getFullYear()
    const monthDiff = today.getMonth() - parsed.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
        age--
    }

    return age
}

/**
 * Format age for display in patient tables.
 * Returns the calculated age as a string like "32", or "—" for null/invalid DOBs.
 */
export function formatPatientAge(dateOfBirth: string | Date | null | undefined): string {
    if (!dateOfBirth) return '—'
    const parsed = safelyParseDate(dateOfBirth)
    if (!parsed) return '—'
    const age = calculateAge(dateOfBirth)
    return String(age)
}


/**
 * Format a date range
 */
export function formatDateRange(
    start: string | Date | null | undefined,
    end: string | Date | null | undefined,
    formatStr: string = 'MMM dd, yyyy'
): string {
    const startDate = formatDate(start, formatStr)
    const endDate = formatDate(end, formatStr)

    if (startDate === 'N/A' && endDate === 'N/A') return 'N/A'
    if (startDate === 'N/A') return `Until ${endDate}`
    if (endDate === 'N/A') return `From ${startDate}`

    return `${startDate} - ${endDate}`
}
