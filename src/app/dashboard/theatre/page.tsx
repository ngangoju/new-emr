"use client";

import { useMemo, useState } from "react";
import { Scissors, DoorOpen, CalendarClock, CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared";
import { StatusBadge } from "@/components/shared";
import { WorklistTable } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ScheduleSurgeryDialog } from "@/components/theatre/ScheduleSurgeryDialog";
import { CaseDetailDialog } from "@/components/theatre/CaseDetailDialog";
import {
  useTheatres,
  useTheatreCasesByStatus,
  type Theatre,
  type TheatreCase,
} from "@/hooks/api/useTheatre"
import { useRole } from "@/hooks/useRole"

export default function TheatrePage() {
  const { data: theatres, isLoading } = useTheatres()
  const { hasPermission } = useRole()
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<TheatreCase | null>(null)
  const canSchedule =
    hasPermission("theatre:case:create") || hasPermission("theatre:case:manage")

  // Pull cases-in-flight (any active status) for the schedule board.
  const { data: activeCases } = useTheatreCasesByStatus("IN_THEATRE")
  const { data: scheduledCases } = useTheatreCasesByStatus("SCHEDULED")
  const { data: recoveryCases } = useTheatreCasesByStatus("RECOVERY")

  const schedule = useMemo<TheatreCase[]>(
    () => [
      ...(scheduledCases ?? []),
      ...(activeCases ?? []),
      ...(recoveryCases ?? []),
    ],
    [scheduledCases, activeCases, recoveryCases]
  )
  const scheduleLoading = !activeCases || !scheduledCases || !recoveryCases

  const availableCount =
    theatres?.filter((t: Theatre) => t.status === "AVAILABLE").length ?? 0

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Operating Theatre"
        description="Theatre availability and today's surgery schedule"
      >
        {canSchedule && (
          <Button onClick={() => setScheduleOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" aria-hidden />
            Schedule surgery
          </Button>
        )}
      </PageHeader>

      <ScheduleSurgeryDialog open={scheduleOpen} onOpenChange={setScheduleOpen} />
      <CaseDetailDialog
        surgeryCase={selectedCase}
        onOpenChange={(open) => !open && setSelectedCase(null)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Theatres"
          value={theatres?.length ?? 0}
          icon={Scissors}
          tone="brand"
          loading={isLoading}
        />
        <StatCard
          title="Available Now"
          value={availableCount}
          icon={DoorOpen}
          tone="success"
          loading={isLoading}
        />
        <StatCard
          title="Scheduled Today"
          value={schedule?.length ?? 0}
          icon={CalendarClock}
          tone="info"
          loading={scheduleLoading}
        />
      </div>

      <WorklistTable
        caption="Today's surgery schedule"
        loading={scheduleLoading}
        data={schedule ?? []}
        getRowId={(row) => row.id}
        onRowClick={(row) => setSelectedCase(row)}
        emptyTitle="No surgeries scheduled today"
        emptyDescription="Use Schedule surgery to book a theatre slot."
        columns={[
          {
            id: "time",
            header: "Time",
            cell: (row) => (
              <span className="tabular-nums">
                {new Date(row.scheduledStart).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ),
          },
          {
            id: "procedure",
            header: "Procedure",
            cell: (row) => <span className="font-medium">{row.procedureName ?? "—"}</span>,
          },
          {
            id: "surgeon",
            header: "Surgeon",
            cell: (row) =>
              row.surgeonId
                ? `${row.surgeonId.slice(0, 8)}…`
                : "—",
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge status={row.status} label={row.status} />,
          },
        ]}
      />

      <WorklistTable
        caption="Theatres"
        loading={isLoading}
        data={theatres ?? []}
        getRowId={(row) => row.id}
        emptyTitle="No theatres found"
        columns={[
          {
            id: "name",
            header: "Theatre",
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            id: "location",
            header: "Location",
            cell: (row) => row.location ?? "—",
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => <StatusBadge status={row.status} label={row.status} />,
          },
        ]}
      />
    </div>
  );
}
