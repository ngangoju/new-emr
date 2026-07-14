"use client";

import { useState } from "react";
import { BedDouble, CheckCircle2, AlertTriangle, Wrench, ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared";
import { StatusBadge } from "@/components/shared";
import { WorklistTable } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { BedTransferDialog } from "@/components/beds/BedTransferDialog";
import { useOccupancySummary } from "@/hooks/api/useBeds";
import { useRole } from "@/hooks/useRole";

export default function BedOccupancyPage() {
  const { data: summary, isLoading } = useOccupancySummary();
  const { hasPermission } = useRole();
  const [transferOpen, setTransferOpen] = useState(false);
  const canTransfer =
    hasPermission("bed:transfer:create") || hasPermission("admission:transfer");

  const totalBeds = summary?.reduce((s, w) => s + (w.totalBeds ?? 0), 0) ?? 0;
  const occupied = summary?.reduce((s, w) => s + (w.occupiedBeds ?? 0), 0) ?? 0;
  const available = summary?.reduce((s, w) => s + (w.availableBeds ?? 0), 0) ?? 0;
  const maintenance = summary?.reduce((s, w) => s + (w.maintenanceBeds ?? 0), 0) ?? 0;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Bed Occupancy"
        description="Real-time ward and bed availability across the hospital"
      >
        {canTransfer && (
          <Button onClick={() => setTransferOpen(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" aria-hidden />
            Transfer patient
          </Button>
        )}
      </PageHeader>

      <BedTransferDialog open={transferOpen} onOpenChange={setTransferOpen} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Beds"
          value={totalBeds}
          icon={BedDouble}
          tone="brand"
          loading={isLoading}
        />
        <StatCard
          title="Occupied"
          value={occupied}
          icon={CheckCircle2}
          tone="critical"
          loading={isLoading}
        />
        <StatCard
          title="Available"
          value={available}
          icon={AlertTriangle}
          tone="success"
          loading={isLoading}
        />
        <StatCard
          title="Maintenance"
          value={maintenance}
          icon={Wrench}
          tone="warning"
          loading={isLoading}
        />
      </div>

      <WorklistTable
        caption="Per-ward occupancy summary"
        loading={isLoading}
        data={summary ?? []}
        getRowId={(row) => row.wardId}
        emptyTitle="No wards found"
        emptyDescription="Ward occupancy data is not available yet."
        columns={[
          {
            id: "ward",
            header: "Ward",
            cell: (row) => <span className="font-medium">{row.wardName}</span>,
          },
          {
            id: "total",
            header: "Total",
            cell: (row) => row.totalBeds ?? 0,
          },
          {
            id: "occupied",
            header: "Occupied",
            cell: (row) => row.occupiedBeds ?? 0,
          },
          {
            id: "available",
            header: "Available",
            cell: (row) => row.availableBeds ?? 0,
          },
          {
            id: "rate",
            header: "Occupancy %",
            cell: (row) => (
              <span className="tabular-nums">{row.occupancyRatePercent}%</span>
            ),
          },
          {
            id: "status",
            header: "Status",
            cell: (row) => {
              const pct = row.occupancyRatePercent ?? 0;
              const tone = pct >= 90 ? "critical" : pct >= 70 ? "warning" : "success";
              return (
                <StatusBadge
                  label={pct >= 90 ? "FULL" : pct >= 70 ? "BUSY" : "OK"}
                  tone={tone}
                />
              );
            },
          },
        ]}
      />
    </div>
  );
}
