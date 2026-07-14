"use client";

import { Boxes, Ambulance, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared";
import { StatusBadge } from "@/components/shared";
import { WorklistTable } from "@/components/shared";
import { useAssets, useAvailableAmbulances, useActiveStaff } from "@/hooks/api/useBackOffice";

export default function BackOfficePage() {
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: ambulances, isLoading: ambulancesLoading } = useAvailableAmbulances();
  const { data: staff, isLoading: staffLoading } = useActiveStaff();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Back Office"
        description="Hospital assets, ambulance fleet, and HR staff records"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="In-Service Assets"
          value={assets?.length ?? 0}
          icon={Boxes}
          tone="brand"
          loading={assetsLoading}
        />
        <StatCard
          title="Ambulances Available"
          value={ambulances?.length ?? 0}
          icon={Ambulance}
          tone="success"
          loading={ambulancesLoading}
        />
        <StatCard
          title="Active Staff"
          value={staff?.length ?? 0}
          icon={Users}
          tone="info"
          loading={staffLoading}
        />
      </div>

      <WorklistTable
        caption="Ambulance fleet"
        loading={ambulancesLoading}
        data={ambulances ?? []}
        getRowId={(row) => row.id}
        emptyTitle="No ambulances found"
        columns={[
          {
            id: "code",
            header: "Vehicle",
            cell: (row) => (
              <span className="font-medium">{row.vehicleCode ?? row.registrationNumber ?? "—"}</span>
            ),
          },
          {
            id: "reg",
            header: "Registration",
            cell: (row) => row.registrationNumber ?? "—",
          },
          {
            id: "base",
            header: "Base",
            cell: (row) => row.baseLocation ?? "—",
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
