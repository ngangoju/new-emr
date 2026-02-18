import type { DashboardNavItem } from '@/lib/authz/policy'

/**
 * Normalizes a search query by:
 * - Trimming leading/trailing whitespace
 * - Collapsing multiple consecutive spaces to a single space
 * - Converting to lowercase
 * - Limiting maximum length
 */
export function normalizeSearchQuery(rawQuery: string): string {
    const MAX_QUERY_LENGTH = 100

    if (!rawQuery || typeof rawQuery !== 'string') {
        return ''
    }

    return rawQuery
        .slice(0, MAX_QUERY_LENGTH)  // Limit length
        .trim()                       // Remove leading/trailing whitespace
        .replace(/\s+/g, ' ')         // Collapse multiple spaces to single space
        .toLowerCase()
}

/**
 * Tokenizes a query string into an array of search tokens
 * Useful for partial matching (e.g., "lab res" matches "Lab Results")
 */
export function tokenizeQuery(query: string): string[] {
    const normalized = normalizeSearchQuery(query)
    if (!normalized) {
        return []
    }
    return normalized.split(' ').filter(token => token.length > 0)
}

/**
 * Checks if all tokens in the query match somewhere in the target string
 * Supports partial word matching
 */
function matchesTokenized(target: string, tokens: string[]): boolean {
    const normalizedTarget = target.toLowerCase()
    return tokens.every(token => normalizedTarget.includes(token))
}

/**
 * Highlights matching portions of the target text
 * Returns the target with matched text wrapped in markers
 */
export function highlightMatch(text: string, query: string): { text: string; isMatch: boolean } {
    const normalizedQuery = normalizeSearchQuery(query)

    if (!normalizedQuery) {
        return { text, isMatch: false }
    }

    const tokens = tokenizeQuery(query)
    const isMatch = matchesTokenized(text, tokens)

    return { text, isMatch }
}

/**
 * Finds the best matching dashboard navigation target for a given query
 * 
 * Features:
 * - Handles queries with spaces (e.g., "lab results", "invoice report")
 * - Handles leading/trailing spaces
 * - Handles multiple consecutive spaces
 * - Token-based matching for partial queries
 * - Searches both title and href
 * 
 * @param rawQuery - The raw search query from user input
 * @param targets - Array of dashboard navigation items to search through
 * @returns The first matching target, or null if no match found
 */
export function findDashboardSearchTarget(
    rawQuery: string,
    targets: readonly DashboardNavItem[],
): DashboardNavItem | null {
    // Handle edge cases
    if (!rawQuery || typeof rawQuery !== 'string') {
        return null
    }

    const query = normalizeSearchQuery(rawQuery)

    // Return null for empty/blank queries after normalization
    if (!query) {
        return null
    }

    const tokens = tokenizeQuery(query)

    // If no valid tokens, return null
    if (tokens.length === 0) {
        return null
    }

    return (
        targets.find((target) => {
            const title = target.title.toLowerCase()
            const href = target.href.toLowerCase()

            // Match if any token appears in title or href
            return tokens.some(token =>
                title.includes(token) || href.includes(token)
            )
        }) ?? null
    )
}

/**
 * Finds all matching dashboard navigation targets for a given query
 * Useful for showing search results in a dropdown
 * 
 * @param rawQuery - The raw search query from user input
 * @param targets - Array of dashboard navigation items to search through
 * @param maxResults - Maximum number of results to return (default: 10)
 * @returns Array of matching targets, sorted by relevance
 */
export function findAllDashboardSearchTargets(
    rawQuery: string,
    targets: readonly DashboardNavItem[],
    maxResults: number = 10,
): DashboardNavItem[] {
    // Handle edge cases
    if (!rawQuery || typeof rawQuery !== 'string') {
        return []
    }

    const query = normalizeSearchQuery(rawQuery)

    // Return empty array for empty/blank queries
    if (!query) {
        return []
    }

    const tokens = tokenizeQuery(query)

    if (tokens.length === 0) {
        return []
    }

    // Find all matches and sort by relevance (exact matches first, then partial)
    const matches = targets
        .map(target => {
            const title = target.title.toLowerCase()
            const href = target.href.toLowerCase()

            // Calculate relevance score
            let score = 0

            // Exact match on query (highest priority)
            if (title === query || href === query) {
                score = 100
            }
            // Query starts with title/href
            else if (title.startsWith(query) || href.startsWith(query)) {
                score = 80
            }
            // All tokens match (high priority)
            else if (matchesTokenized(title, tokens) || matchesTokenized(href, tokens)) {
                score = 60
            }
            // Some tokens match (medium priority)
            else if (tokens.some(token => title.includes(token) || href.includes(token))) {
                score = 40
            }

            return { target, score }
        })
        .filter(match => match.score > 0)
        .sort((a, b) => b.score - a.score)  // Sort by score descending
        .slice(0, maxResults)  // Limit results
        .map(match => match.target)

    return matches
}

