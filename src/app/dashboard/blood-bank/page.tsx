"use client"

import { useState } from "react"
import { Droplet, TestTube, Activity } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard, StatusBadge, WorklistTable } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientSelector } from "@/components/shared/PatientSelector"
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
  useAvailableUnits,
  useCollectBloodUnit,
  usePendingCrossmatches,
  useRequestCrossmatch,
  useApproveCrossmatch,
  useStartTransfusion,
  type BloodUnit,
  type CrossmatchRequest,
} from "@/hooks/api/useBloodBank"

const BLOOD_GROUPS = ["A", "B", "AB", "O"]
const RH = ["POSITIVE", "NEGATIVE"]

export default function BloodBankPage() {
  const { data: units, isLoading: unitsLoading } = useAvailableUnits()
  const { data: crossmatches, isLoading: xmLoading } = usePendingCrossmatches()
  const collectUnit = useCollectBloodUnit()
  const requestCrossmatch = useRequestCrossmatch()
  const approveCrossmatch = useApproveCrossmatch()
  const startTransfusion = useStartTransfusion()

  const [collectOpen, setCollectOpen] = useState(false)
  const [xmOpen, setXmOpen] = useState(false)
  const [txOpen, setTxOpen] = useState(false)

  const [unitForm, setUnitForm] = useState({
    unitNumber: "",
    bloodGroup: "",
    rhFactor: "POSITIVE",
    expiryAt: "",
    storageLocation: "",
  })
  const [xmForm, setXmForm] = useState({
    patientId: "",
    bloodGroupRequested: "",
    rhFactorRequested: "POSITIVE",
    urgency: "ROUTINE",
    volumeMl: "",
    reason: "",
  })
  const [txForm, setTxForm] = useState({
    bloodUnitId: "",
    patientId: "",
    volumeAdministeredMl: "",
    notes: "",
  })

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Blood Bank"
        description="Manage blood unit inventory, crossmatch requests, and transfusions"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Available Units"
          value={units?.length ?? 0}
          icon={Droplet}
          tone="critical"
          loading={unitsLoading}
        />
        <StatCard
          title="Blood Groups"
          value={new Set(units?.map((u) => `${u.bloodGroup}${u.rhFactor === "NEGATIVE" ? "-" : "+"}`)).size}
          icon={TestTube}
          tone="info"
          loading={unitsLoading}
        />
        <StatCard
          title="Pending Crossmatches"
          value={crossmatches?.length ?? 0}
          icon={Activity}
          tone="brand"
          loading={xmLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCollectOpen(true)}>Collect unit</Button>
        <Button variant="outline" onClick={() => setXmOpen(true)}>
          Request crossmatch
        </Button>
        <Button variant="outline" onClick={() => setTxOpen(true)}>
          Start transfusion
        </Button>
      </div>

      <WorklistTable
        caption="Available blood units"
        loading={unitsLoading}
        data={units ?? []}
        getRowId={(row: BloodUnit) => row.id}
        emptyTitle="No available units"
        emptyDescription="Collect a blood unit to build inventory."
        columns={[
          {
            id: "group",
            header: "Group",
            cell: (row: BloodUnit) => (
              <span className="font-medium">
                {row.bloodGroup ?? "—"}
                {row.rhFactor === "NEGATIVE" ? "-" : "+"}
              </span>
            ),
          },
          { id: "unit", header: "Unit #", cell: (row: BloodUnit) => row.unitNumber ?? "—" },
          {
            id: "location",
            header: "Storage",
            cell: (row: BloodUnit) => row.storageLocation ?? "—",
          },
          {
            id: "expiry",
            header: "Expiry",
            cell: (row: BloodUnit) => (row.expiryAt ? new Date(row.expiryAt).toLocaleDateString() : "—"),
          },
          {
            id: "status",
            header: "Status",
            cell: (row: BloodUnit) => <StatusBadge status={row.status ?? "—"} label={row.status ?? "—"} />,
          },
        ]}
      />

      <WorklistTable
        caption="Pending crossmatch requests"
        loading={xmLoading}
        data={crossmatches ?? []}
        getRowId={(row: CrossmatchRequest) => row.id}
        emptyTitle="No pending crossmatches"
        columns={[
          {
            id: "patient",
            header: "Patient",
            cell: (row: CrossmatchRequest) => row.patientId?.slice(0, 8) ?? "—",
          },
          {
            id: "urgency",
            header: "Urgency",
            cell: (row: CrossmatchRequest) => row.urgency ?? "—",
          },
          {
            id: "group",
            header: "Group",
            cell: (row: CrossmatchRequest) =>
              `${row.bloodGroupRequested ?? "—"}${row.rhFactorRequested === "NEGATIVE" ? "-" : "+"}`,
          },
          {
            id: "result",
            header: "Result",
            cell: (row: CrossmatchRequest) => <StatusBadge status={row.result ?? "PENDING"} label={row.result ?? "PENDING"} />,
          },
          {
            id: "approve",
            header: "Action",
            cell: (row: CrossmatchRequest) => (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={approveCrossmatch.isPending}
                  onClick={() =>
                    approveCrossmatch.mutate({ requestId: row.id, result: "APPROVED" })
                  }
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={approveCrossmatch.isPending}
                  onClick={() =>
                    approveCrossmatch.mutate({ requestId: row.id, result: "DENIED" })
                  }
                >
                  Deny
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Collect unit dialog */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collect blood unit</DialogTitle>
            <DialogDescription>Register a collected blood unit into inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="unit-number">Unit number</Label>
              <Input
                id="unit-number"
                value={unitForm.unitNumber}
                onChange={(e) => setUnitForm({ ...unitForm, unitNumber: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Blood group</Label>
                <Select
                  value={unitForm.bloodGroup}
                  onValueChange={(v) => setUnitForm({ ...unitForm, bloodGroup: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Rh factor</Label>
                <Select
                  value={unitForm.rhFactor}
                  onValueChange={(v) => setUnitForm({ ...unitForm, rhFactor: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {RH.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                type="datetime-local"
                value={unitForm.expiryAt}
                onChange={(e) => setUnitForm({ ...unitForm, expiryAt: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="storage">Storage location</Label>
              <Input
                id="storage"
                value={unitForm.storageLocation}
                onChange={(e) => setUnitForm({ ...unitForm, storageLocation: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={collectUnit.isPending || !unitForm.unitNumber || !unitForm.bloodGroup || !unitForm.expiryAt}
              onClick={() =>
                collectUnit.mutate(
                  {
                    unitNumber: unitForm.unitNumber,
                    bloodGroup: unitForm.bloodGroup,
                    rhFactor: unitForm.rhFactor,
                    expiryAt: unitForm.expiryAt,
                    storageLocation: unitForm.storageLocation || undefined,
                  },
                  { onSuccess: () => { setCollectOpen(false); setUnitForm({ unitNumber: "", bloodGroup: "", rhFactor: "POSITIVE", expiryAt: "", storageLocation: "" }) } },
                )
              }
            >
              {collectUnit.isPending ? "Saving…" : "Collect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request crossmatch dialog */}
      <Dialog open={xmOpen} onOpenChange={setXmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request crossmatch</DialogTitle>
            <DialogDescription>Create a crossmatch request for a patient.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Patient</Label>
              <PatientSelector
                selectedPatientId={xmForm.patientId || undefined}
                onSelect={(p) => setXmForm({ ...xmForm, patientId: p.id })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Blood group</Label>
                <Select
                  value={xmForm.bloodGroupRequested}
                  onValueChange={(v) => setXmForm({ ...xmForm, bloodGroupRequested: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Rh factor</Label>
                <Select
                  value={xmForm.rhFactorRequested}
                  onValueChange={(v) => setXmForm({ ...xmForm, rhFactorRequested: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {RH.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Urgency</Label>
              <Select
                value={xmForm.urgency}
                onValueChange={(v) => setXmForm({ ...xmForm, urgency: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["ROUTINE", "URGENT", "EMERGENCY"].map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="xm-volume">Volume (ml)</Label>
              <Input
                id="xm-volume"
                inputMode="numeric"
                value={xmForm.volumeMl}
                onChange={(e) => setXmForm({ ...xmForm, volumeMl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setXmOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={requestCrossmatch.isPending || !xmForm.patientId || !xmForm.bloodGroupRequested}
              onClick={() =>
                requestCrossmatch.mutate(
                  {
                    patientId: xmForm.patientId,
                    bloodGroupRequested: xmForm.bloodGroupRequested,
                    rhFactorRequested: xmForm.rhFactorRequested,
                    urgency: xmForm.urgency,
                    volumeMl: xmForm.volumeMl ? Number(xmForm.volumeMl) : undefined,
                    reason: xmForm.reason || undefined,
                  },
                  { onSuccess: () => { setXmOpen(false); setXmForm({ patientId: "", bloodGroupRequested: "", rhFactorRequested: "POSITIVE", urgency: "ROUTINE", volumeMl: "", reason: "" }) } },
                )
              }
            >
              {requestCrossmatch.isPending ? "Saving…" : "Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start transfusion dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start transfusion</DialogTitle>
            <DialogDescription>Begin a transfusion for a patient from an available unit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Patient</Label>
              <PatientSelector
                selectedPatientId={txForm.patientId || undefined}
                onSelect={(p) => setTxForm({ ...txForm, patientId: p.id })}
              />
            </div>
            <div className="space-y-1">
              <Label>Blood unit</Label>
              <Select
                value={txForm.bloodUnitId}
                onValueChange={(v) => setTxForm({ ...txForm, bloodUnitId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select available unit" />
                </SelectTrigger>
                <SelectContent>
                  {(units ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unitNumber} · {u.bloodGroup}
                      {u.rhFactor === "NEGATIVE" ? "-" : "+"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tx-volume">Volume administered (ml)</Label>
              <Input
                id="tx-volume"
                inputMode="numeric"
                value={txForm.volumeAdministeredMl}
                onChange={(e) => setTxForm({ ...txForm, volumeAdministeredMl: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={startTransfusion.isPending || !txForm.patientId || !txForm.bloodUnitId}
              onClick={() =>
                startTransfusion.mutate(
                  {
                    patientId: txForm.patientId,
                    bloodUnitId: txForm.bloodUnitId,
                    volumeAdministeredMl: txForm.volumeAdministeredMl
                      ? Number(txForm.volumeAdministeredMl)
                      : undefined,
                    notes: txForm.notes || undefined,
                  },
                  { onSuccess: () => { setTxOpen(false); setTxForm({ bloodUnitId: "", patientId: "", volumeAdministeredMl: "", notes: "" }) } },
                )
              }
            >
              {startTransfusion.isPending ? "Starting…" : "Start"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
