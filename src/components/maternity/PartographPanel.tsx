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

const numeric = z.string().regex(/^-?\d*$/, "Whole number").optional().or(z.literal(""))

const observationSchema = z.object({
  cervicalDilationCm: numeric,
  descentStation: numeric,
  foetalHeartRate: numeric,
  contractionsPer10min: numeric,
  systolicBp: numeric,
  diastolicBp: numeric,
})

type ObservationFormValues = z.infer<typeof observationSchema>

/** Labor partograph: patient picker, dilation/FHR chart, observation log + entry form. */
export function PartographPanel() {
  const [patientId, setPatientId] = useState<string | undefined>(undefined)
  const { data: observations, isLoading } = usePartograph(patientId)
  const record = useRecordPartographObservation()

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
    fhr: o.foetalHeartRate,
  }))

  const toNum = (v?: string) => (v ? Number(v) : undefined)

  const onSubmit = handleSubmit((values) => {
    if (!patientId) return
    record.mutate(
      {
        patientId,
        cervicalDilationCm: toNum(values.cervicalDilationCm),
        descentStation: toNum(values.descentStation),
        foetalHeartRate: toNum(values.foetalHeartRate),
        contractionsPer10min: toNum(values.contractionsPer10min),
        systolicBp: toNum(values.systolicBp),
        diastolicBp: toNum(values.diastolicBp),
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
              <Label htmlFor="pg-dilation">Dilation (cm)</Label>
              <Input id="pg-dilation" inputMode="numeric" {...register("cervicalDilationCm")} />
              {errors.cervicalDilationCm && (
                <p className="text-xs text-destructive">{errors.cervicalDilationCm.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-station">Station</Label>
              <Input id="pg-station" inputMode="numeric" {...register("descentStation")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-fhr">FHR</Label>
              <Input id="pg-fhr" inputMode="numeric" {...register("foetalHeartRate")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-contractions">Contr./10min</Label>
              <Input id="pg-contractions" inputMode="numeric" {...register("contractionsPer10min")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-sbp">Systolic</Label>
              <Input id="pg-sbp" inputMode="numeric" {...register("systolicBp")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pg-dbp">Diastolic</Label>
              <Input id="pg-dbp" inputMode="numeric" {...register("diastolicBp")} />
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
                cell: (row) => row.foetalHeartRate ?? "—",
              },
              {
                id: "contractions",
                header: "Contr./10min",
                cell: (row) => row.contractionsPer10min ?? "—",
              },
              {
                id: "bp",
                header: "BP",
                cell: (row) =>
                  row.systolicBp != null && row.diastolicBp != null
                    ? `${row.systolicBp}/${row.diastolicBp}`
                    : "—",
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
