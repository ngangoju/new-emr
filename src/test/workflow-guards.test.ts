import { describe, expect, it } from 'vitest'

import { isPermissionFeedback } from '@/components/providers/toaster-provider'
import { shouldHoldTriageForInitialInvoice } from '@/components/nurse/NurseVitalsForm'

describe('workflow guard helpers', () => {
  it('suppresses backend role messages before they become error popups', () => {
    expect(isPermissionFeedback('This action is not available for your current role.')).toBe(true)
    expect(isPermissionFeedback('Only admin users can create tariffs.')).toBe(true)
    expect(isPermissionFeedback('The patient record was saved successfully.')).toBe(false)
  })

  it('holds nurse triage while the same-day initial invoice is not cleared', () => {
    const today = new Date('2026-06-07T09:00:00Z')

    expect(shouldHoldTriageForInitialInvoice({
      createdAt: '2026-06-07T08:30:00Z',
      paymentStatus: 'UNPAID',
      patientDue: 5000,
    }, today)).toBe(true)

    expect(shouldHoldTriageForInitialInvoice({
      createdAt: '2026-06-07T08:30:00Z',
      paymentStatus: 'PARTIAL',
      patientDue: 1000,
      payments: [{ amount: 400 }],
    }, today)).toBe(true)

    expect(shouldHoldTriageForInitialInvoice({
      createdAt: '2026-06-07T08:30:00Z',
      paymentStatus: 'PARTIAL',
      patientDue: 1000,
      payments: [{ amount: 1000 }],
    }, today)).toBe(false)

    expect(shouldHoldTriageForInitialInvoice({
      createdAt: '2026-06-07T08:30:00Z',
      paymentStatus: 'PARTIAL',
      patientDue: 1000,
    }, today)).toBe(false)

    expect(shouldHoldTriageForInitialInvoice({
      createdAt: '2026-06-07T08:30:00Z',
      paymentStatus: 'PAID',
      patientDue: 0,
    }, today)).toBe(false)
  })

  it('does not hold triage for older invoices', () => {
    expect(shouldHoldTriageForInitialInvoice({
      createdAt: '2026-06-06T08:30:00Z',
      paymentStatus: 'UNPAID',
      patientDue: 5000,
    }, new Date('2026-06-07T09:00:00Z'))).toBe(false)
  })
})
