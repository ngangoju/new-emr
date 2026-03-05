import type { ConsultationMedication } from '@/hooks/api/useConsultations'
import type { DrugRequestItem } from '@/types/pharmacy'

function toSafeString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
}

function toSafeQuantity(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.floor(value)
    }
    return 1
}

export function mapConsultationMedicationToDrugRequestItem(
    med: Pick<
        ConsultationMedication,
        | 'id'
        | 'formularyId'
        | 'drugName'
        | 'dose'
        | 'route'
        | 'frequency'
        | 'duration'
        | 'indication'
        | 'allergyOverrideReason'
    >
): DrugRequestItem {
    return {
        drugId: med.formularyId || med.id,
        drugName: med.drugName,
        quantity: 1,
        notes: med.indication,
        dose: med.dose,
        route: med.route,
        frequency: med.frequency,
        duration: med.duration,
        allergyOverrideReason: med.allergyOverrideReason,
    }
}

export function normalizeDrugRequestItem(raw: unknown): DrugRequestItem {
    if (!raw || typeof raw !== 'object') {
        return {
            drugId: 'legacy-unknown',
            drugName: 'Legacy medication entry',
            quantity: 1,
            notes: 'Legacy record',
        }
    }

    const candidate = raw as Record<string, unknown>

    const drugId =
        toSafeString(candidate.drugId) ||
        toSafeString(candidate.formularyId) ||
        toSafeString(candidate.id) ||
        'legacy-unknown'

    const drugName = toSafeString(candidate.drugName) || 'Legacy medication entry'
    const quantity = toSafeQuantity(candidate.quantity)

    const notes = toSafeString(candidate.notes) || toSafeString(candidate.indication)

    return {
        drugId,
        drugName,
        quantity,
        notes,
        dose: toSafeString(candidate.dose),
        route: toSafeString(candidate.route),
        frequency: toSafeString(candidate.frequency),
        duration: toSafeString(candidate.duration),
        allergyOverrideReason: toSafeString(candidate.allergyOverrideReason),
    }
}

export function normalizeDrugRequestItems(items: unknown): DrugRequestItem[] {
    if (!items) return []

    const asArray = Array.isArray(items)
        ? items
        : typeof items === 'string'
            ? (() => {
                try {
                    const parsed = JSON.parse(items)
                    return Array.isArray(parsed) ? parsed : []
                } catch {
                    return []
                }
            })()
            : []

    return asArray.map(normalizeDrugRequestItem)
}

export function formatDrugRequestItemContext(item: DrugRequestItem): string {
    const drugName = toSafeString(item.drugName) || 'Legacy medication entry'
    const dose = toSafeString(item.dose)
    const route = toSafeString(item.route)
    const frequency = toSafeString(item.frequency)
    const duration = toSafeString(item.duration)

    if (dose && route && frequency && duration) {
        return `${drugName} ${dose} ${route} ${frequency} × ${duration}`
    }

    const legacyNotes = toSafeString(item.notes)
    if (legacyNotes) {
        return `${drugName} ${legacyNotes}`
    }

    return `${drugName} (legacy record)`
}

