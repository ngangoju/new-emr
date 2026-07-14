"use client";

import { Droplet, Users2, TestTube } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/shared";
import { StatusBadge } from "@/components/shared";
import { WorklistTable } from "@/components/shared";
import { useActiveDonors, useAvailableUnits } from "@/hooks/api/useBloodBank";

export default function BloodBankPage() {
  const { data: donors, isLoading: donorsLoading } = useActiveDonors();
  const { data: units, isLoading: unitsLoading } = useAvailableUnits();

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Blood Bank"
        description="Donor registry and available blood unit inventory"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Donors"
          value={donors?.length ?? 0}
          icon={Users2}
          tone="brand"
          loading={donorsLoading}
        />
        <StatCard
          title="Available Units"
          value={units?.length ?? 0}
          icon={Droplet}
          tone="critical"
          loading={unitsLoading}
        />
        <StatCard
          title="Blood Groups"
          value={new Set(units?.map((u) => u.bloodGroup)).size}
          icon={TestTube}
          tone="info"
          loading={unitsLoading}
        />
      </div>

      <WorklistTable
        caption="Available blood units"
        loading={unitsLoading}
        data={units ?? []}
        getRowId={(row) => row.id}
        emptyTitle="No available units"
        emptyDescription="There are no available blood units in stock."
        columns={[
          {
            id: "group",
            header: "Blood Group",
            cell: (row) => <span className="font-medium">{row.bloodGroup}</span>,
          },
          {
            id: "collected",
            header: "Collected",
            cell: (row) => row.collectionDate ?? "—",
          },
          {
            id: "expiry",
            header: "Expiry",
            cell: (row) => row.expiryDate ?? "—",
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
