/**
 * Smart Bar Parser — clinical command line grammar
 *
 * Parses shorthand clinical commands into structured data:
 *   bp 120/80 hr 72 t 37.1 rr 18 o2 99   → vitals
 *   rx amoxicillin 500mg tid 5d           → prescription draft
 *   lab cbc lfts urea                      → lab order
 *   note <free text>                        → note
 */

export interface ParsedVitals {
    type: 'vitals'
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    respiratoryRate?: number
    spo2?: number
}

export interface ParsedPrescription {
    type: 'prescription'
    drug?: string
    dose?: string
    frequency?: string
    duration?: string
}

export interface ParsedLabOrder {
    type: 'lab'
    tests: string[]
}

export interface ParsedNote {
    type: 'note'
    text: string
}

export type ParsedCommand = ParsedVitals | ParsedPrescription | ParsedLabOrder | ParsedNote

/** Alias for CommandPalette integration */
export type SmartBarResult = ParsedCommand

/** Detect the command type from the input prefix */
export function detectCommandType(input: string): ParsedCommand['type'] | null {
    const trimmed = input.trim().toLowerCase()
    if (trimmed.startsWith('bp ') || trimmed.startsWith('vitals ')) return 'vitals'
    if (trimmed.startsWith('rx ')) return 'prescription'
    if (trimmed.startsWith('lab ')) return 'lab'
    if (trimmed.startsWith('note ')) return 'note'
    return null
}

/** Parse a vitals command: `bp 120/80 hr 72 t 37.1 rr 18 o2 99` */
function parseVitals(input: string): ParsedVitals {
    const result: ParsedVitals = { type: 'vitals' }
    const tokens = input.trim().toLowerCase().split(/\s+/)

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i]
        if (tok === 'bp' || tok === 'vitals') continue
        if (tok === 'hr' && i + 1 < tokens.length) {
            result.heartRate = parseInt(tokens[++i], 10) || undefined
        } else if (tok === 't' && i + 1 < tokens.length) {
            result.temperature = parseFloat(tokens[++i]) || undefined
        } else if (tok === 'rr' && i + 1 < tokens.length) {
            result.respiratoryRate = parseInt(tokens[++i], 10) || undefined
        } else if (tok === 'o2' && i + 1 < tokens.length) {
            result.spo2 = parseInt(tokens[++i], 10) || undefined
        } else if (/^\d+\/\d+$/.test(tok)) {
            result.bloodPressure = tok
        }
    }
    return result
}

/** Parse a prescription command: `rx amoxicillin 500mg tid 5d` */
function parsePrescription(input: string): ParsedPrescription {
    const parts = input.trim().replace(/^rx\s+/i, '').split(/\s+/)
    const result: ParsedPrescription = { type: 'prescription' }

    if (parts.length > 0) result.drug = parts[0]
    if (parts.length > 1) result.dose = parts[1]

    // Find frequency (bid, tid, qid, qd, q4h, prn, etc.)
    const freqIdx = parts.findIndex(p => /^(bid|tid|qid|qd|q\d+h|prn|qd|od|stat)$/i.test(p))
    if (freqIdx >= 0) {
        result.frequency = parts[freqIdx]
        // Duration is the next token if it ends with d/w/m
        if (freqIdx + 1 < parts.length && /^\d+[dwm]$/i.test(parts[freqIdx + 1])) {
            result.duration = parts[freqIdx + 1]
        }
    }

    return result
}

/** Parse a lab order command: `lab cbc lfts urea` */
function parseLabOrder(input: string): ParsedLabOrder {
    const parts = input.trim().replace(/^lab\s+/i, '').split(/\s+/)
    return {
        type: 'lab',
        tests: parts.filter(p => p.length > 0)
    }
}

/** Parse a note command: `note patient reports chest pain` */
function parseNote(input: string): ParsedNote {
    return {
        type: 'note',
        text: input.trim().replace(/^note\s+/i, '')
    }
}

/** Main entry point — parse a raw input string into structured command */
export function parseSmartBarCommand(input: string): ParsedCommand | null {
    const trimmed = input.trim()
    if (!trimmed) return null

    const type = detectCommandType(trimmed)
    if (!type) return null

    switch (type) {
        case 'vitals': return parseVitals(trimmed)
        case 'prescription': return parsePrescription(trimmed)
        case 'lab': return parseLabOrder(trimmed)
        case 'note': return parseNote(trimmed)
    }
}

/** Human-readable summary of parsed command for the preview card */
export function summarizeParsedCommand(cmd: ParsedCommand): string {
    switch (cmd.type) {
        case 'vitals': {
            const parts: string[] = []
            if (cmd.bloodPressure) parts.push(`BP ${cmd.bloodPressure}`)
            if (cmd.heartRate) parts.push(`HR ${cmd.heartRate}`)
            if (cmd.temperature) parts.push(`T ${cmd.temperature}°C`)
            if (cmd.respiratoryRate) parts.push(`RR ${cmd.respiratoryRate}`)
            if (cmd.spo2) parts.push(`SpO₂ ${cmd.spo2}%`)
            return parts.join(' · ')
        }
        case 'prescription': {
            const parts: string[] = []
            if (cmd.drug) parts.push(cmd.drug)
            if (cmd.dose) parts.push(cmd.dose)
            if (cmd.frequency) parts.push(cmd.frequency)
            if (cmd.duration) parts.push(cmd.duration)
            return parts.join(' · ')
        }
        case 'lab':
            return `Tests: ${cmd.tests.join(', ')}`
        case 'note':
            return cmd.text.length > 60 ? cmd.text.substring(0, 60) + '...' : cmd.text
    }
}

/** Alias for CommandPalette integration — parses and returns null if not a smart bar command */
export function parseSmartBarInput(input: string): SmartBarResult | null {
    return parseSmartBarCommand(input)
}

/** Alias for backward compatibility with CommandPalette import */
export { parseSmartBarCommand as parseSmartBar }
