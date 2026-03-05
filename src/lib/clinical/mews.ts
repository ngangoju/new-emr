export type AvpuLevel = 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE'

export interface MewsVitalsInput {
    respiratoryRate?: number
    heartRate?: number
    bloodPressure?: string
    temperature?: number
    avpu?: string
}

function scoreRespiratoryRate(rr?: number): number {
    if (rr == null) return 0
    if (rr <= 8 || rr >= 30) return 3
    if (rr >= 21 && rr <= 29) return 2
    if (rr >= 9 && rr <= 14) return 1
    if (rr >= 15 && rr <= 20) return 0
    return 0
}

function scoreHeartRate(hr?: number): number {
    if (hr == null) return 0
    if (hr <= 40 || hr >= 130) return 3
    if (hr >= 111 && hr <= 129) return 2
    if (hr >= 101 && hr <= 110) return 1
    if (hr >= 41 && hr <= 50) return 1
    return 0
}

function parseSystolicBP(bloodPressure?: string): number | undefined {
    if (!bloodPressure?.trim()) return undefined
    const systolic = Number.parseInt(bloodPressure.split('/')[0]?.trim() ?? '', 10)
    return Number.isNaN(systolic) ? undefined : systolic
}

function scoreSystolicBP(sbp?: number): number {
    if (sbp == null) return 0
    if (sbp <= 70) return 3
    if (sbp >= 200) return 2
    if (sbp >= 71 && sbp <= 80) return 2
    if (sbp >= 81 && sbp <= 100) return 1
    return 0
}

function scoreTemperature(temp?: number): number {
    if (temp == null) return 0
    if (temp <= 35.0) return 2
    if (temp >= 38.5) return 2
    return 0
}

function scoreAvpu(avpu?: string): number {
    if (!avpu) return 0
    switch (avpu.toUpperCase()) {
        case 'ALERT':
            return 0
        case 'VOICE':
            return 1
        case 'PAIN':
            return 2
        case 'UNRESPONSIVE':
            return 3
        default:
            return 0
    }
}

export function calculateMews(vitals: MewsVitalsInput): number {
    return (
        scoreRespiratoryRate(vitals.respiratoryRate) +
        scoreHeartRate(vitals.heartRate) +
        scoreSystolicBP(parseSystolicBP(vitals.bloodPressure)) +
        scoreTemperature(vitals.temperature) +
        scoreAvpu(vitals.avpu)
    )
}

export function mewsToAcuityColor(mewsScore: number): 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' {
    if (mewsScore >= 7) return 'RED'
    if (mewsScore >= 5) return 'ORANGE'
    if (mewsScore >= 3) return 'YELLOW'
    return 'GREEN'
}
