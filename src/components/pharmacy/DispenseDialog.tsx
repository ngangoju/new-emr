'use client'

import React from 'react'

/**
 * Future feature: DispenseDialog.
 * Scoped out of current EMR hardening cycle.
 * Tracked under: https://jira.internal.emr/browse/EMR-482 (Pharmacy Dispense Workflow Integration).
 */
export function DispenseDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <>
      {trigger}
    </>
  )
}