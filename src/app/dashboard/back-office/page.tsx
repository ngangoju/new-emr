"use client"

import { useState } from "react"
import { Boxes, Wrench, Ambulance } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard, StatusBadge, WorklistTable } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAssetsByStatus,
  usePendingMaintenance,
  useScheduleMaintenance,
  useCompleteMaintenance,
  useActiveDispatches,
  useDispatchAmbulance,
  useUpdateDispatch,
  useCreateAsset,
  type Asset,
  type AssetMaintenance,
  type AmbulanceDispatch,
} from "@/hooks/api/useBackOffice"

const ASSET_CATEGORIES = ["FURNITURE", "EQUIPMENT", "VEHICLE", "COMPUTER"]
const MAINTENANCE_TYPES = ["PREVENTIVE", "CORRECTIVE", "CALIBRATION"]
const DISPATCH_STATUSES = ["DISPATCHED", "ARRIVED", "COMPLETED", "CANCELLED"]

export default function BackOfficePage() {
  const { data: assets, isLoading: assetsLoading } = useAssetsByStatus("ACTIVE")
  const { data: maintenance, isLoading: maintLoading } = usePendingMaintenance()
  const { data: dispatches, isLoading: dispLoading } = useActiveDispatches()
  const scheduleMaintenance = useScheduleMaintenance()
  const completeMaintenance = useCompleteMaintenance()
  const dispatchAmbulance = useDispatchAmbulance()
  const updateDispatch = useUpdateDispatch()
  const createAsset = useCreateAsset()

  const [assetOpen, setAssetOpen] = useState(false)
  const [maintOpen, setMaintOpen] = useState(false)
  const [dispOpen, setDispOpen] = useState(false)

  const [assetForm, setAssetForm] = useState({
    tag: "",
    category: "EQUIPMENT",
    locationWard: "",
    manufacturer: "",
    model: "",
  })
  const [maintForm, setMaintForm] = useState({
    assetId: "",
    scheduledAt: "",
    maintenanceType: "PREVENTIVE",
    description: "",
  })
  const [dispForm, setDispForm] = useState({
    vehicleId: "",
    destination: "",
    notes: "",
  })

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Back Office"
        description="Hospital assets, maintenance scheduling, and ambulance dispatch"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Assets"
          value={assets?.length ?? 0}
          icon={Boxes}
          tone="brand"
          loading={assetsLoading}
        />
        <StatCard
          title="Pending Maintenance"
          value={maintenance?.length ?? 0}
          icon={Wrench}
          tone="info"
          loading={maintLoading}
        />
        <StatCard
          title="Active Dispatches"
          value={dispatches?.length ?? 0}
          icon={Ambulance}
          tone="success"
          loading={dispLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAssetOpen(true)}>Add asset</Button>
        <Button variant="outline" onClick={() => setMaintOpen(true)}>
          Schedule maintenance
        </Button>
        <Button variant="outline" onClick={() => setDispOpen(true)}>
          Dispatch ambulance
        </Button>
      </div>

      <WorklistTable
        caption="Active assets"
        loading={assetsLoading}
        data={assets ?? []}
        getRowId={(row: Asset) => row.id}
        emptyTitle="No active assets"
        columns={[
          { id: "tag", header: "Tag", cell: (row: Asset) => <span className="font-medium">{row.tag ?? "—"}</span> },
          { id: "category", header: "Category", cell: (row: Asset) => row.category ?? "—" },
          { id: "location", header: "Location", cell: (row: Asset) => row.locationWard ?? "—" },
          { id: "model", header: "Model", cell: (row: Asset) => row.model ?? "—" },
          {
            id: "status",
            header: "Status",
            cell: (row: Asset) => <StatusBadge status={row.status ?? "—"} label={row.status ?? "—"} />,
          },
        ]}
      />

      <WorklistTable
        caption="Pending maintenance"
        loading={maintLoading}
        data={maintenance ?? []}
        getRowId={(row: AssetMaintenance) => row.id}
        emptyTitle="No pending maintenance"
        columns={[
          {
            id: "asset",
            header: "Asset",
            cell: (row: AssetMaintenance) => row.assetId?.slice(0, 8) ?? "—",
          },
          {
            id: "type",
            header: "Type",
            cell: (row: AssetMaintenance) => row.maintenanceType ?? "—",
          },
          {
            id: "scheduled",
            header: "Scheduled",
            cell: (row: AssetMaintenance) =>
              row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : "—",
          },
          {
            id: "status",
            header: "Status",
            cell: (row: AssetMaintenance) => <StatusBadge status={row.status ?? "—"} label={row.status ?? "—"} />,
          },
          {
            id: "complete",
            header: "Action",
            cell: (row: AssetMaintenance) => (
              <Button
                size="sm"
                variant="outline"
                disabled={completeMaintenance.isPending}
                onClick={() =>
                  completeMaintenance.mutate({
                    maintenanceId: row.id,
                    completedAt: new Date().toISOString(),
                  })
                }
              >
                Complete
              </Button>
            ),
          },
        ]}
      />

      <WorklistTable
        caption="Active ambulance dispatches"
        loading={dispLoading}
        data={dispatches ?? []}
        getRowId={(row: AmbulanceDispatch) => row.id}
        emptyTitle="No active dispatches"
        columns={[
          {
            id: "vehicle",
            header: "Vehicle",
            cell: (row: AmbulanceDispatch) => row.vehicleId?.slice(0, 8) ?? "—",
          },
          { id: "destination", header: "Destination", cell: (row: AmbulanceDispatch) => row.destination ?? "—" },
          {
            id: "departed",
            header: "Departed",
            cell: (row: AmbulanceDispatch) =>
              row.departureTime ? new Date(row.departureTime).toLocaleString() : "—",
          },
          {
            id: "status",
            header: "Status",
            cell: (row: AmbulanceDispatch) => <StatusBadge status={row.status ?? "—"} label={row.status ?? "—"} />,
          },
          {
            id: "action",
            header: "Action",
            cell: (row: AmbulanceDispatch) => (
              <Select
                value={row.status ?? "DISPATCHED"}
                onValueChange={(v) => updateDispatch.mutate({ dispatchId: row.id, status: v })}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPATCH_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
      />

      {/* Add asset dialog */}
      <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add asset</DialogTitle>
            <DialogDescription>Register a new hospital asset.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="asset-tag">Tag</Label>
              <Input
                id="asset-tag"
                value={assetForm.tag}
                onChange={(e) => setAssetForm({ ...assetForm, tag: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={assetForm.category}
                onValueChange={(v) => setAssetForm({ ...assetForm, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="asset-loc">Location ward</Label>
              <Input
                id="asset-loc"
                value={assetForm.locationWard}
                onChange={(e) => setAssetForm({ ...assetForm, locationWard: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="asset-mfr">Manufacturer</Label>
                <Input
                  id="asset-mfr"
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="asset-model">Model</Label>
                <Input
                  id="asset-model"
                  value={assetForm.model}
                  onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createAsset.isPending || !assetForm.tag || !assetForm.category}
              onClick={() =>
                createAsset.mutate(
                  {
                    tag: assetForm.tag,
                    category: assetForm.category,
                    locationWard: assetForm.locationWard || undefined,
                    manufacturer: assetForm.manufacturer || undefined,
                    model: assetForm.model || undefined,
                  },
                  {
                    onSuccess: () => {
                      setAssetOpen(false)
                      setAssetForm({
                        tag: "",
                        category: "EQUIPMENT",
                        locationWard: "",
                        manufacturer: "",
                        model: "",
                      })
                    },
                  },
                )
              }
            >
              {createAsset.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule maintenance dialog */}
      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule maintenance</DialogTitle>
            <DialogDescription>Plan preventive or corrective maintenance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Asset</Label>
              <Select
                value={maintForm.assetId}
                onValueChange={(v) => setMaintForm({ ...maintForm, assetId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {(assets ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={maintForm.maintenanceType}
                  onValueChange={(v) => setMaintForm({ ...maintForm, maintenanceType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="maint-when">Scheduled</Label>
                <Input
                  id="maint-when"
                  type="datetime-local"
                  value={maintForm.scheduledAt}
                  onChange={(e) => setMaintForm({ ...maintForm, scheduledAt: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="maint-desc">Description</Label>
              <Input
                id="maint-desc"
                value={maintForm.description}
                onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={scheduleMaintenance.isPending || !maintForm.assetId || !maintForm.scheduledAt}
              onClick={() =>
                scheduleMaintenance.mutate(
                  {
                    assetId: maintForm.assetId,
                    scheduledAt: maintForm.scheduledAt,
                    maintenanceType: maintForm.maintenanceType,
                    description: maintForm.description || undefined,
                  },
                  {
                    onSuccess: () => {
                      setMaintOpen(false)
                      setMaintForm({ assetId: "", scheduledAt: "", maintenanceType: "PREVENTIVE", description: "" })
                    },
                  },
                )
              }
            >
              {scheduleMaintenance.isPending ? "Scheduling…" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispatch ambulance dialog */}
      <Dialog open={dispOpen} onOpenChange={setDispOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispatch ambulance</DialogTitle>
            <DialogDescription>Create a new ambulance dispatch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Vehicle</Label>
              <Select
                value={dispForm.vehicleId}
                onValueChange={(v) => setDispForm({ ...dispForm, vehicleId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {(assets ?? [])
                    .filter((a) => a.category === "VEHICLE")
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.tag}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="disp-dest">Destination</Label>
              <Input
                id="disp-dest"
                value={dispForm.destination}
                onChange={(e) => setDispForm({ ...dispForm, destination: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="disp-notes">Notes</Label>
              <Input
                id="disp-notes"
                value={dispForm.notes}
                onChange={(e) => setDispForm({ ...dispForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={dispatchAmbulance.isPending || !dispForm.vehicleId}
              onClick={() =>
                dispatchAmbulance.mutate(
                  {
                    vehicleId: dispForm.vehicleId,
                    destination: dispForm.destination || undefined,
                    notes: dispForm.notes || undefined,
                  },
                  {
                    onSuccess: () => {
                      setDispOpen(false)
                      setDispForm({ vehicleId: "", destination: "", notes: "" })
                    },
                  },
                )
              }
            >
              {dispatchAmbulance.isPending ? "Dispatching…" : "Dispatch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
