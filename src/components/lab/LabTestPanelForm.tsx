'use client'

import { useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLabPanelDefinition } from '@/hooks/useLabOrders'
import type { LabPanelParameter } from '@/types/lab'

export interface LabTestPanelFormProps {
  panelId: string
  values: Record<string, string>
  onValuesChange: (values: Record<string, string>) => void
  onCriticalParametersChange?: (codes: string[]) => void
}

type FieldSeverity = 'normal' | 'outside-normal' | 'critical'

function parseNumeric(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatRange(low?: number, high?: number, unit?: string): string {
  if (low === undefined || high === undefined) return unit ? `Enter value (${unit})` : 'Enter value'
  const formattedUnit = unit ? ` ${unit}` : ''
  return `${low.toFixed(1)}–${high.toFixed(1)}${formattedUnit}`
}

function getSeverity(parameter: LabPanelParameter, numericValue: number | null): FieldSeverity {
  if (numericValue === null) return 'normal'

  const criticalLow = parameter.criticalRange?.low
  const criticalHigh = parameter.criticalRange?.high
  if (
    criticalLow !== undefined &&
    criticalHigh !== undefined &&
    (numericValue < criticalLow || numericValue > criticalHigh)
  ) {
    return 'critical'
  }

  const normalLow = parameter.referenceRange?.low
  const normalHigh = parameter.referenceRange?.high
  if (
    normalLow !== undefined &&
    normalHigh !== undefined &&
    (numericValue < normalLow || numericValue > normalHigh)
  ) {
    return 'outside-normal'
  }

  return 'normal'
}

export function LabTestPanelForm({
  panelId,
  values,
  onValuesChange,
  onCriticalParametersChange,
}: LabTestPanelFormProps) {
  const { data: panel, isLoading } = useLabPanelDefinition(panelId)

  const orderedParameters = useMemo(
    () => [...(panel?.parameters ?? [])].sort((a, b) => a.sequence - b.sequence),
    [panel],
  )

  const severityByCode = useMemo(() => {
    const byCode: Record<string, FieldSeverity> = {}
    for (const parameter of orderedParameters) {
      const numericValue = parseNumeric(values[parameter.code] ?? '')
      byCode[parameter.code] = getSeverity(parameter, numericValue)
    }
    return byCode
  }, [orderedParameters, values])

  useEffect(() => {
    if (!onCriticalParametersChange) return
    const criticalCodes = orderedParameters
      .filter((parameter) => severityByCode[parameter.code] === 'critical')
      .map((parameter) => parameter.code)
    onCriticalParametersChange(criticalCodes)
  }, [onCriticalParametersChange, orderedParameters, severityByCode])

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading panel parameters...</div>
  }

  if (!orderedParameters.length) {
    return <div className="text-sm text-muted-foreground">No structured parameters available for this panel.</div>
  }

  return (
    <div className="space-y-3">
      {orderedParameters.map((parameter) => {
        const inputId = `panel-param-${parameter.code}`
        const severity = severityByCode[parameter.code]
        const className =
          severity === 'critical'
            ? 'text-red-600 font-bold'
            : severity === 'outside-normal'
              ? 'text-amber-600'
              : ''

        return (
          <div key={parameter.code} className="space-y-1">
            <Label htmlFor={inputId}>
              {parameter.name}
              {parameter.unit ? ` (${parameter.unit})` : ''} · Ref{' '}
              {formatRange(parameter.referenceRange?.low, parameter.referenceRange?.high, parameter.unit)}
            </Label>
            <Input
              id={inputId}
              type="text"
              inputMode="decimal"
              className={className}
              value={values[parameter.code] ?? ''}
              onChange={(event) =>
                onValuesChange({
                  ...values,
                  [parameter.code]: event.target.value,
                })
              }
              placeholder={formatRange(parameter.referenceRange?.low, parameter.referenceRange?.high, parameter.unit)}
            />
          </div>
        )
      })}
    </div>
  )
}

