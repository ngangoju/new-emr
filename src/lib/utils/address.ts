/**
 * Address type definitions
 */
export interface Address {
    village?: string
    cell?: string
    sector?: string
    district?: string
    province?: string
}

/**
 * Format an address object or string into a readable string
 */
export function formatAddress(address: string | Address | null | undefined): string {
    if (!address) return 'No address provided'

    // If it's already a string, return it
    if (typeof address === 'string') {
        return address || 'No address provided'
    }

    // If it's an object, format it
    const parts: string[] = []

    if (address.village) parts.push(address.village)
    if (address.cell) parts.push(address.cell)
    if (address.sector) parts.push(address.sector)
    if (address.district) parts.push(address.district)
    if (address.province) parts.push(address.province)

    if (parts.length === 0) return 'No address provided'

    return parts.join(', ')
}

/**
 * Format a short address (only district and province)
 */
export function formatShortAddress(address: string | Address | null | undefined): string {
    if (!address) return 'N/A'

    if (typeof address === 'string') {
        // Try to extract last 2 parts (assuming format: village, sector, district, province)
        const parts = address.split(',').map(p => p.trim()).filter(Boolean)
        if (parts.length >= 2) {
            return parts.slice(-2).join(', ')
        }
        return address
    }

    const parts: string[] = []
    if (address.district) parts.push(address.district)
    if (address.province) parts.push(address.province)

    if (parts.length === 0) return 'N/A'
    return parts.join(', ')
}

/**
 * Parse a comma-separated address string into an Address object
 */
export function parseAddress(addressString: string): Address | null {
    if (!addressString || typeof addressString !== 'string') return null

    const parts = addressString.split(',').map(p => p.trim()).filter(Boolean)

    if (parts.length === 0) return null

    // Assuming order: village, cell, sector, district, province
    const address: Address = {}

    if (parts.length >= 5) {
        address.village = parts[0]
        address.cell = parts[1]
        address.sector = parts[2]
        address.district = parts[3]
        address.province = parts[4]
    } else if (parts.length === 4) {
        address.village = parts[0]
        address.sector = parts[1]
        address.district = parts[2]
        address.province = parts[3]
    } else if (parts.length === 3) {
        address.sector = parts[0]
        address.district = parts[1]
        address.province = parts[2]
    } else if (parts.length === 2) {
        address.district = parts[0]
        address.province = parts[1]
    } else {
        address.district = parts[0]
    }

    return address
}

/**
 * Get address display name from location ID
 * This is a placeholder - in production, you'd fetch from an API
 */
export function getLocationName(locationId: string | number | null | undefined): string {
    if (!locationId) return 'Unknown'

    // This would normally call an API or use a cached lookup table
    // For now, just return a formatted string
    return `Location ${locationId}`
}
