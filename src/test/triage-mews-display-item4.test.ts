import { describe, expect, it } from 'vitest'

import { calculateMews, mewsToAcuityColor } from '@/lib/clinical/mews'

describe('Item 4 frontend MEWS live computation', () => {
    it('computes RED acuity for extreme live vitals preview', () => {
        const score = calculateMews({
            respiratoryRate: 35,
            heartRate: 140,
            bloodPressure: '60/40',
            temperature: 39,
            avpu: 'PAIN',
        })

        expect(score).toBe(13)
        expect(mewsToAcuityColor(score)).toBe('RED')
    })
})
