"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorklistTable } from "@/components/shared"
import { PatientSelector } from "@/components/shared/PatientSelector"
import {
  usePartograph,
  useRecordPartographObservation,
} from "@/hooks/api/useMaternity"
import { useAdmissions } from "@/hooks/useAdmissions"

const numeric = z
  .string()
  .regex(/^-?\d*$/, "Whole number")
  .optional()
  .or(z.literal(""))

const observationSchema = z.object({
  observedAt: z.string().min(1, "Time is required"),
  cervicalDilationCm: numeric,
  cervicalDilationEffacementPercent: numeric,
  fetalHeartRateBpm: numeric,
  maternalContractionsPer10min: numeric,
  maternalBloodPressureSystolic: numeric,
  maternalBloodPressureDiastolic: numeric,
})

type ObservationFormValues = z.infer<typeof observationSchema>

/** Labor partograph: patient picker, dilation/FHR chart, observation log + entry form. */
export function PartographPanel() {
  const [patientId, setPatientId] = useState<string | undefined>(undefined)
  const { data: observations, isLoading } = usePartograph(patientId)
  const record = useRecordPartographObservation()
  const { data: admissions } = useAdmissions(
    patientId ? { patientId, status: "admitted" } : undefined,
    { enabled: Boolean(patientId) }
  )
  const activeAdmissionId = admissions?.[0]?.id

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
  })

  const chartData = (observations ?? []).map((o) => ({
    time: new Date(o.observedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    dilation: o.cervicalDilationCm,
    fhr: o.fetalHeartRateBpm,
  }))

  const toNum = (v?: string) => (v ? Number(v) : undefined)

  const onSubmit = handleSubmit((values) => {
    if (!patientId) return
    record.mutate(
      {
        patientId,
        admissionId: activeAdmissionId,
        observedAt: values.observedAt,
        cervicalDilationCm: toNum(values.cervicalDilationCm),
        cervicalDilationEffacementPercent: toNum(
          values.cervicalDilationEffacementPercent
        ),
        fetalHeartRateBpm: toNum(values.fetalHeartRateBpm),
        maternalContractionsPer10min: toNum(values.maternalContractionsPer10min),
        maternalBloodPressureSystolic: toNum(values.maternalBloodPressureSystolic),
        maternalBloodPressureDiastolic: toNum(values.maternalBloodPressureDiastolic),
      },
      { onSuccess: () => reset() }
    )
  })

  return (
    <div className="space-y-6">
      <div className="max-w-md space-y-2">
        <Label>Patient in labor</Label>
        <PatientSelector
          selectedPatientId={patientId}
          onSelect={(patient) => setPatientId(patient.id)}
        />
      </div>

      {patientId && (
        <>
          {chartData.length > 1 && (
            <div className="rounded-lg border p-4">
              <h3 className="font-heading font-semibold mb-2">Cervical dilation & FHR</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis
                      yAxisId="dilation"
                      domain={[0, 10]}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      label={{ value: "cm", angle: -90, position: "insideLeft" }}
                    />
                    <YAxis
                      yAxisId="fhr"
                      orientation="right"
                      domain={[80, 200]}
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      label={{ value: "bpm", angle: 90, position: "insideRight" }}
                    />
                    <Tooltip />
                    <Line
                      yAxisId="dilation"
                      type="monotone"
                      dataKey="dilation"
                      name="Dilation (cm)"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot
                    />
                    <Line
                      yAxisId="fhr"
                      type="monotone"
                      dataKey="fhr"
                      name="FHR (bpm)"
                      stroke="var(--destructive)"
                      strokeWidth={2}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <form
            onSubmit={onSubmit}
            className="rounded-lg border p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7 items-end"
          >
            <div className="space-y-1">
              <Label htmlFor="pg-time">Time</Label>
              <Input id="pg-time" type="datetime-local" {...register("observedAt")} />
              {errors.observedAt && (
                <p className="text-xs text-destructive">{errors.observedAt.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-dilation">Dilation (cm)</Label>
              <Input id="pg-dilation" inputMode="numeric" {...register("cervicalDilationCm")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-effacement">Effacement (%)</Label>
              <Input
                id="pg-effacement"
                inputMode="numeric"
                {...register("cervicalDilationEffacementPercent")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-fhr">FHR (bpm)</Label>
              <Input id="pg-fhr" inputMode="numeric" {...register("fetalHeartRateBpm")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-contractions">Contr./10min</Label>
              <Input
                id="pg-contractions"
                inputMode="numeric"
                {...register("maternalContractionsPer10min")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-sbp">Systolic</Label>
              <Input
                id="pg-sbp"
                inputMode="numeric"
                {...register("maternalBloodPressureSystolic")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-dbp">Diastolic</Label>
              <Input
                id="pg-dbp"
                inputMode="numeric"
                {...register("maternalBloodPressureDiastolic")}
              />
            </div>
            <Button type="submit" disabled={record.isPending}>
              {record.isPending ? "Saving…" : "Record"}
            </Button>
          </form>

          <WorklistTable
            caption="Observation log"
            loading={isLoading}
            data={[...(observations ?? [])].reverse()}
            getRowId={(row) => row.id}
            emptyTitle="No observations yet"
            emptyDescription="Record the first partograph observation above."
            columns={[
              {
                id: "time",
                header: "Time",
                cell: (row) => (
                  <span className="tabular-nums">
                    {new Date(row.observedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ),
              },
              {
                id: "dilation",
                header: "Dilation",
                cell: (row) =>
                  row.cervicalDilationCm != null ? `${row.cervicalDilationCm} cm` : "—",
              },
              {
                id: "fhr",
                header: "FHR",
                cell: (row) => row.fetalHeartRateBpm ?? "—",
              },
              {
                id: "contractions",
                header: "Contr./10min",
                cell: (row) => row.maternalContractionsPer10min ?? "—",
              },
              {
                id: "bp",
                header: "BP",
                cell: (row) =>
                  row.maternalBloodPressureSystolic != null &&
                  row.maternalBloodPressureDiastolic != null
                    ? `${row.maternalBloodPressureSystolic}/${row.maternalBloodPressureDiastolic}`
                    : "—",
              },
            ]}
          />
        </>
      )}
    </div>
  )
}

