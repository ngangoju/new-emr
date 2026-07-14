"use client";

import { useState } from "react";
import { Baby, HeartPulse, Activity, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared";
import { StatusBadge } from "@/components/shared";
import { WorklistTable } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AntenatalVisitDialog } from "@/components/maternity/AntenatalVisitDialog";
import { PartographPanel } from "@/components/maternity/PartographPanel";
import { RecordDeliveryDialog } from "@/components/maternity/RecordDeliveryDialog";
import { useActiveAntenatalVisits, useDeliveries } from "@/hooks/api/useMaternity";
import { useRole } from "@/hooks/useRole";

export default function MaternityPage() {
  const { data: visits, isLoading } = useActiveAntenatalVisits();
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries();
  const { hasPermission } = useRole();
  const [antenatalOpen, setAntenatalOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const canCreateAntenatal = hasPermission("maternity:antenatal:create");
  const canRecordDelivery = hasPermission("maternity:delivery:create");

  const thirdTrimester = visits?.filter(
    (v) => (v.gestationalAgeWeeks ?? 0) >= 28,
  ).length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Maternity & L&D"
        description="Antenatal care, labor partograph, and delivery records"
      >
        <div className="flex gap-2">
          {canCreateAntenatal && (
            <Button variant="outline" onClick={() => setAntenatalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Antenatal visit
            </Button>
          )}
          {canRecordDelivery && (
            <Button onClick={() => setDeliveryOpen(true)}>
              <HeartPulse className="mr-2 h-4 w-4" aria-hidden />
              Record delivery
            </Button>
          )}
        </div>
      </PageHeader>

      <AntenatalVisitDialog open={antenatalOpen} onOpenChange={setAntenatalOpen} />
      <RecordDeliveryDialog open={deliveryOpen} onOpenChange={setDeliveryOpen} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active ANC Visits"
          value={visits?.length ?? 0}
          icon={Baby}
          tone="brand"
          loading={isLoading}
        />
        <StatCard
          title="3rd Trimester"
          value={thirdTrimester ?? 0}
          icon={HeartPulse}
          tone="warning"
          loading={isLoading}
        />
        <StatCard
          title="Deliveries Recorded"
          value={deliveries?.length ?? 0}
          icon={Activity}
          tone="success"
          loading={deliveriesLoading}
        />
      </div>

      <Tabs defaultValue="antenatal">
        <TabsList>
          <TabsTrigger value="antenatal">Antenatal</TabsTrigger>
          <TabsTrigger value="labor">Labor (partograph)</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="antenatal" className="mt-4">
          <WorklistTable
            caption="Active antenatal visits"
            loading={isLoading}
            data={visits ?? []}
            getRowId={(row) => row.id}
            emptyTitle="No active antenatal visits"
            emptyDescription="Record the first antenatal visit to get started."
            columns={[
              {
                id: "patient",
                header: "Patient ID",
                cell: (row) => (
                  <span className="font-medium font-mono text-xs">{row.patientId}</span>
                ),
              },
              { id: "visit", header: "Visit #", cell: (row) => row.visitNumber ?? "—" },
              {
                id: "gestation",
                header: "Gestation",
                cell: (row) =>
                  row.gestationalAgeWeeks != null ? `${row.gestationalAgeWeeks} wks` : "—",
              },
              { id: "bp", header: "BP", cell: (row) => row.bloodPressure ?? "—" },
              { id: "fhr", header: "FHR", cell: (row) => row.foetalHeartRate ?? "—" },
              {
                id: "status",
                header: "Status",
                cell: (row) => <StatusBadge status={row.status} label={row.status} />,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="labor" className="mt-4">
          <PartographPanel />
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <WorklistTable
            caption="Delivery records (newest first)"
            loading={deliveriesLoading}
            data={deliveries ?? []}
            getRowId={(row) => row.id}
            emptyTitle="No deliveries recorded"
            emptyDescription="Use Record delivery to document a birth."
            columns={[
              {
                id: "time",
                header: "Delivered",
                cell: (row) => (
                  <span className="tabular-nums">
                    {row.deliveredAt ? new Date(row.deliveredAt).toLocaleString() : "—"}
                  </span>
                ),
              },
              {
                id: "mode",
                header: "Mode",
                cell: (row) => (row.mode ?? "—").replaceAll("_", " "),
              },
              {
                id: "outcome",
                header: "Outcome",
                cell: (row) => (
                  <StatusBadge
                    status={row.outcome}
                    label={row.outcome.replaceAll("_", " ")}
                    tone={row.outcome === "LIVE_BIRTH" ? "success" : "critical"}
                  />
                ),
              },
              {
                id: "apgar",
                header: "APGAR",
                cell: (row) =>
                  row.apgar1min != null && row.apgar5min != null
                    ? `${row.apgar1min}/${row.apgar5min}`
                    : "—",
              },
              {
                id: "newborn",
                header: "Newborn registered",
                cell: (row) => (row.newbornPatientId ? "Yes" : "No"),
              },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
