'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FlaskConical,
  ImageIcon,
  MessageSquarePlus,
  Pill,
  Receipt,
  Route,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { ClinicalAddendumModal } from '@/components/doctor/ClinicalAddendumModal'
import { DoctorImagingResultDetail } from '@/components/doctor/DoctorImagingResultDetail'
import { DoctorPharmacyQueue } from '@/components/doctor/DoctorPharmacyQueue'
import { DischargeMedicationReconciliationModal } from '@/components/doctor/DischargeMedicationReconciliationModal'
import { QuickLabOrderModal } from '@/components/doctor/QuickLabOrderModal'
import { QuickMedicationOrderModal } from '@/components/doctor/QuickMedicationOrderModal'
import { CreateImagingOrderModal } from '@/components/radiology/CreateImagingOrderModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSignConsultation } from '@/hooks/api/useConsultations'
import { useConsultationMedications } from '@/hooks/api/useConsultations'
import { usePatientLabResults } from '@/hooks/api/usePatients'
import { useAdmissions } from '@/hooks/useAdmissions'
import { useInvoices } from '@/hooks/useInvoices'
import { useAcknowledgeLabOrder } from '@/hooks/useLabOrders'
import { useAcknowledgeImagingOrder, usePatientImagingOrders } from '@/hooks/useImaging'
import { useApproveClinicalDischarge, useDischargeReadiness, useWorkflowStatus } from '@/hooks/useWorkflow'
import { formatDateTime } from '@/lib/utils/date'

type DoctorTreatmentWorkspaceProps = {
  patientId: string
  patientName?: string
  consultationId?: string
  consultationStatus?: 'DRAFT' | 'FINALIZED'
  consultationNotes?: string
  context?: 'patient' | 'consultation'
}

const STAGE_LABELS: Record<string, string> = {
  ARRIVAL: 'Arrival',
  REGISTER: 'Register',
  TRIAGE: 'Triage',
  ENCOUNTER: 'Encounter',
  TREATMENT: 'Treatment',
  DISCHARGE: 'Discharge',
}

const LAB_READY_STATUSES = new Set(['APPROVED', 'COMPLETED', 'PROCESSED', 'FINAL'])
const IMAGING_READY_STATUSES = new Set(['COMPLETED', 'REPORTED'])
const IMAGING_PENDING_STATUSES = new Set(['ORDERED', 'SCHEDULED', 'IN_PROGRESS'])

function normalizeStatus(value: unknown) {
  return String(value ?? '').trim().toUpperCase()
}

function formatRole(role?: string) {
  if (!role) return 'Unassigned'
  return role.replaceAll('_', ' ')
}

function formatStage(stage?: string) {
  return STAGE_LABELS[stage ?? ''] ?? stage ?? 'Unknown'
}

function dedupe(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)))
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export function DoctorTreatmentWorkspace({
  patientId,
  patientName,
  consultationId,
  consultationStatus,
  consultationNotes,
  context = 'patient',
}: DoctorTreatmentWorkspaceProps) {
  const signConsultation = useSignConsultation()
  const acknowledgeLabOrder = useAcknowledgeLabOrder()
  const acknowledgeImagingOrder = useAcknowledgeImagingOrder()
  const { data: workflow, isLoading: workflowLoading } = useWorkflowStatus(patientId)
  const { data: labResults = [], isLoading: labsLoading } = usePatientLabResults(patientId)
  const { data: imagingOrders = [], isLoading: imagingLoading } = usePatientImagingOrders(patientId)
  const { pending: outstandingInvoices, loading: invoicesLoading } = useInvoices({ patientId })
  const { data: admissions = [], isLoading: admissionsLoading } = useAdmissions(
    { patientId, status: 'admitted' },
    { enabled: !!patientId },
  )
  const activeAdmission = admissions[0]
  const { data: dischargeReadiness, isLoading: readinessLoading } = useDischargeReadiness(activeAdmission?.id || '')
  const approveClinicalDischarge = useApproveClinicalDischarge(activeAdmission?.id || '')
  const { data: medications = [], isLoading: medicationsLoading } = useConsultationMedications(consultationId || '')
  const [isLabModalOpen, setIsLabModalOpen] = useState(false)
  const [isImagingModalOpen, setIsImagingModalOpen] = useState(false)
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false)
  const [isAddendumModalOpen, setIsAddendumModalOpen] = useState(false)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isPharmacyQueueOpen, setIsPharmacyQueueOpen] = useState(false)
  const [isMedRecModalOpen, setIsMedRecModalOpen] = useState(false)
  const [acknowledgingLabId, setAcknowledgingLabId] = useState<string | null>(null)
  const [acknowledgingImagingId, setAcknowledgingImagingId] = useState<string | null>(null)
  const [selectedImagingOrderId, setSelectedImagingOrderId] = useState<string | null>(null)

  const loading =
    workflowLoading ||
    labsLoading ||
    imagingLoading ||
    invoicesLoading ||
    admissionsLoading ||
    readinessLoading ||
    medicationsLoading

  const finalizedLabResults = useMemo(
    () => labResults.filter((result) => LAB_READY_STATUSES.has(normalizeStatus(result.status))),
    [labResults],
  )
  const readyLabResults = useMemo(
    () => finalizedLabResults.filter((result) => !result.physicianAcknowledgedAt),
    [finalizedLabResults],
  )
  const labReadyCount = readyLabResults.length
  const labAcknowledgedCount = finalizedLabResults.length - labReadyCount
  const labPendingCount = labResults.filter((result) => {
    const status = normalizeStatus(result.status)
    return status && !LAB_READY_STATUSES.has(status) && status !== 'CANCELLED' && status !== 'REJECTED'
  }).length

  const finalizedImagingOrders = useMemo(
    () => imagingOrders.filter((order) => IMAGING_READY_STATUSES.has(normalizeStatus(order.status))),
    [imagingOrders],
  )
  const readyImagingOrders = useMemo(
    () => finalizedImagingOrders.filter((order) => !order.physicianAcknowledgedAt),
    [finalizedImagingOrders],
  )
  const selectedImagingOrder = useMemo(
    () =>
      finalizedImagingOrders.find((order) => order.id === selectedImagingOrderId) ??
      readyImagingOrders[0] ??
      finalizedImagingOrders[0] ??
      null,
    [finalizedImagingOrders, readyImagingOrders, selectedImagingOrderId],
  )
  const imagingReadyCount = readyImagingOrders.length
  const imagingAcknowledgedCount = finalizedImagingOrders.length - imagingReadyCount
  const imagingPendingCount = imagingOrders.filter((order) =>
    IMAGING_PENDING_STATUSES.has(normalizeStatus(order.status)),
  ).length

  const medicationOverrideCount = medications.filter(
    (medication) => medication.allergyOverrideReason || medication.interactionOverrideReason,
  ).length

  const outstandingBalance = outstandingInvoices.reduce((sum, invoice) => sum + Number(invoice.patientDue || 0), 0)
  const combinedBlockers = dedupe([
    ...(workflow?.blockers ?? []),
    ...(dischargeReadiness?.blockers ?? []),
  ])
  const pendingChecklist = dedupe([
    ...(workflow?.pendingCheckpoints ?? []),
    ...(dischargeReadiness?.pendingCheckpoints ?? []),
  ])
  const completedChecklist = dedupe([
    ...(workflow?.completedCheckpoints ?? []),
    ...(dischargeReadiness?.completedCheckpoints ?? []),
  ])

  const latestLabTimestamp = finalizedLabResults
    .map((result) => result.approvedAt || result.processedAt || result.orderedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  const latestImagingTimestamp = finalizedImagingOrders
    .map((order) => order.completedAt || order.scheduledAt || order.orderedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  const notYetInTreatment =
    workflow && workflow.currentStage !== 'TREATMENT' && workflow.currentStage !== 'DISCHARGE'
  const canUseEncounterActions = Boolean(consultationId && consultationStatus === 'DRAFT')
  const needsNewEncounter = !consultationId || consultationStatus === 'FINALIZED'
  const canReviewResults = finalizedLabResults.length > 0 || finalizedImagingOrders.length > 0
  const dischargeApproved =
    Boolean(activeAdmission?.clinicalDischargeApprovedAt) ||
    Boolean(dischargeReadiness?.completedCheckpoints.includes('Clinical discharge approved by physician'))
  const remainingDischargeBlockers = (dischargeReadiness?.blockers ?? []).filter(
    (blocker) =>
      blocker !== 'Pending doctor-side discharge approval' && blocker !== 'Physician encounter is not signed',
  )
  const canApproveDischarge = Boolean(
    activeAdmission &&
      consultationStatus === 'FINALIZED' &&
      !dischargeApproved &&
      remainingDischargeBlockers.length === 0,
  )

  useEffect(() => {
    if (!isReviewDialogOpen) return
    if (selectedImagingOrderId && finalizedImagingOrders.some((order) => order.id === selectedImagingOrderId)) return
    setSelectedImagingOrderId(readyImagingOrders[0]?.id ?? finalizedImagingOrders[0]?.id ?? null)
  }, [finalizedImagingOrders, isReviewDialogOpen, readyImagingOrders, selectedImagingOrderId])

  const handleFinalizeEncounter = async () => {
    if (!consultationId) return

    try {
      await signConsultation.mutateAsync(consultationId)
      toast.success('Encounter finalized from treatment workspace.')
    } catch {
      toast.error('Unable to finalize encounter. Make sure diagnosis and findings are complete first.')
    }
  }

  const handleAcknowledgeLabResult = async (orderId: string) => {
    try {
      setAcknowledgingLabId(orderId)
      await acknowledgeLabOrder.mutateAsync(orderId)
    } catch {
      toast.error('Failed to acknowledge lab result.')
    } finally {
      setAcknowledgingLabId(null)
    }
  }

  const handleAcknowledgeImagingResult = async (orderId: string) => {
    try {
      setAcknowledgingImagingId(orderId)
      await acknowledgeImagingOrder.mutateAsync(orderId)
      toast.success('Imaging report acknowledged.')
    } catch {
      toast.error('Failed to acknowledge imaging result.')
    } finally {
      setAcknowledgingImagingId(null)
    }
  }

  const handleApproveDischarge = async () => {
    if (!activeAdmission) return

    try {
      await approveClinicalDischarge.mutateAsync()
      toast.success('Clinical discharge approval recorded.')
    } catch {
      toast.error('Failed to record clinical discharge approval.')
    }
  }

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Route className="h-5 w-5 text-primary" />
              Treatment Workspace
            </CardTitle>
            <CardDescription>
              Workflow-driven clinical follow-up for {patientName || 'this patient'} across encounter,
              treatment, and discharge.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {needsNewEncounter ? (
              <Button asChild size="sm">
                <Link href={`/dashboard/doctor/consultations/new?patientId=${patientId}`}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Start Encounter
                </Link>
              </Button>
            ) : null}
            {consultationId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/doctor/consultations/${consultationId}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Open Encounter
                </Link>
              </Button>
            ) : null}
            {context === 'consultation' ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/doctor/patients/${patientId}`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Open Patient Chart
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm">
              <Link href="/dashboard/doctor/imaging-orders">
                <ImageIcon className="mr-2 h-4 w-4" />
                Order Imaging
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Stage: {formatStage(workflow?.currentStage)}
          </Badge>
          <Badge variant="outline">Owner: {formatRole(workflow?.stageOwnerRole)}</Badge>
          {consultationStatus ? (
            <Badge variant={consultationStatus === 'FINALIZED' ? 'default' : 'secondary'}>
              Encounter: {consultationStatus === 'FINALIZED' ? 'Signed' : 'Draft'}
            </Badge>
          ) : null}
          <Badge variant={workflow?.dischargeReady ? 'default' : 'secondary'}>
            {workflow?.dischargeReady ? 'Discharge Ready' : 'Still In Progress'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!patientId ? (
          <p className="text-sm text-muted-foreground">Select a patient to load treatment-stage context.</p>
        ) : loading && !workflow ? (
          <p className="text-sm text-muted-foreground">Loading treatment workspace...</p>
        ) : (
          <>
            {notYetInTreatment ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Activity className="mt-0.5 h-4 w-4 text-amber-700" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900">
                      Patient is still in {formatStage(workflow?.currentStage)}
                    </p>
                    <p className="text-sm text-amber-800">
                      Downstream treatment actions will keep accumulating here, but the current workflow
                      owner is {formatRole(workflow?.stageOwnerRole)} until the patient advances.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {combinedBlockers.length ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Active Blockers
                </div>
                <div className="space-y-1">
                  {combinedBlockers.map((blocker) => (
                    <p key={blocker} className="text-sm text-red-700">
                      {blocker}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-900">No workflow blockers right now</p>
                    <p className="text-sm text-emerald-800">
                      The chart is clear to keep moving through treatment and discharge preparation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Lab Follow-Up"
                value={`${labPendingCount} pending`}
                subtitle={
                  latestLabTimestamp
                    ? `${labReadyCount} awaiting acknowledgment, ${labAcknowledgedCount} acknowledged, latest ${formatDateTime(latestLabTimestamp)}`
                    : `${labReadyCount} awaiting acknowledgment`
                }
                icon={FlaskConical}
              />
              <MetricCard
                title="Imaging Follow-Up"
                value={`${imagingPendingCount} active`}
                subtitle={
                  latestImagingTimestamp
                    ? `${imagingReadyCount} awaiting acknowledgment, ${imagingAcknowledgedCount} acknowledged, latest ${formatDateTime(latestImagingTimestamp)}`
                    : `${imagingReadyCount} awaiting acknowledgment`
                }
                icon={ImageIcon}
              />
              <MetricCard
                title="Medication Plan"
                value={`${medications.length} meds`}
                subtitle={
                  consultationId
                    ? `${medicationOverrideCount} safety override${medicationOverrideCount === 1 ? '' : 's'} on this encounter`
                    : 'Open a consultation to review structured prescriptions'
                }
                icon={Pill}
              />
              <MetricCard
                title="Financial Clearance"
                value={`RWF ${outstandingBalance.toLocaleString()}`}
                subtitle={`${outstandingInvoices.length} invoice${outstandingInvoices.length === 1 ? '' : 's'} still open`}
                icon={Receipt}
              />
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Inline Clinical Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep ordering, sign-off, and handoff work inside the same clinical context.
                  </p>
                </div>
                {!canUseEncounterActions ? (
                  <Badge variant="secondary">
                    {needsNewEncounter ? 'Start a draft encounter to place new treatment orders' : 'Encounter locked'}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setIsLabModalOpen(true)} disabled={!canUseEncounterActions}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Order Labs
                </Button>
                <Button onClick={() => setIsImagingModalOpen(true)} disabled={!canUseEncounterActions}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Order Imaging
                </Button>
                <Button onClick={() => setIsMedicationModalOpen(true)} disabled={!canUseEncounterActions}>
                  <Pill className="mr-2 h-4 w-4" />
                  Prescribe Medication
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(true)}
                  disabled={!canReviewResults}
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Review Results
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPharmacyQueueOpen(true)}
                >
                  <Pill className="mr-2 h-4 w-4" />
                  Track Pharmacy Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddendumModalOpen(true)}
                  disabled={!consultationId}
                >
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Add Clinical Note
                </Button>
                {consultationId && consultationStatus === 'DRAFT' ? (
                  <Button
                    variant="outline"
                    onClick={handleFinalizeEncounter}
                    disabled={signConsultation.isPending}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {signConsultation.isPending ? 'Finalizing...' : 'Finalize Encounter'}
                  </Button>
                ) : null}
              </div>

              {needsNewEncounter ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  New treatment orders should be attached to an active draft consultation so the workflow stays auditable.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-semibold">What Still Needs Attention</h3>
                </div>
                <div className="space-y-2">
                  {pendingChecklist.length ? (
                    pendingChecklist.map((item) => (
                      <p key={item} className="text-sm text-muted-foreground">
                        {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No pending checklist items are being reported from the workflow service.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold">Already Completed</h3>
                </div>
                <div className="space-y-2">
                  {completedChecklist.length ? (
                    completedChecklist.map((item) => (
                      <p key={item} className="text-sm text-muted-foreground">
                        {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No completed checkpoints have been recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Orders and Results Snapshot</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Workflow-linked lab orders</span>
                    <Badge variant="outline">{workflow?.labOrderIds.length ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Workflow-linked imaging orders</span>
                    <Badge variant="outline">{workflow?.imagingOrderIds.length ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending lab actions</span>
                    <Badge variant={labPendingCount > 0 ? 'secondary' : 'outline'}>{labPendingCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending imaging actions</span>
                    <Badge variant={imagingPendingCount > 0 ? 'secondary' : 'outline'}>
                      {imagingPendingCount}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Discharge Readiness</h3>
                </div>
                {activeAdmission && dischargeReadiness ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={dischargeReadiness.ready ? 'default' : 'secondary'}>
                        {dischargeReadiness.ready ? 'Clinically Ready' : 'Not Ready Yet'}
                      </Badge>
                      <Badge variant="outline">Owner: {formatRole(dischargeReadiness.ownerRole)}</Badge>
                      {dischargeApproved ? (
                        <Badge variant="default">Doctor Approved</Badge>
                      ) : null}
                    </div>
                    {consultationStatus === 'DRAFT' ? (
                      <p className="text-muted-foreground">
                        Finalize the encounter to satisfy the physician sign-off portion of discharge readiness.
                      </p>
                    ) : null}
                    {activeAdmission ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsMedRecModalOpen(true)}
                        >
                          <Pill className="mr-2 h-4 w-4" />
                          Medication Reconciliation
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleApproveDischarge}
                          disabled={!canApproveDischarge || approveClinicalDischarge.isPending}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {approveClinicalDischarge.isPending
                            ? 'Approving...'
                            : dischargeApproved
                              ? 'Clinical Discharge Approved'
                              : 'Approve Discharge'}
                        </Button>
                        {!canApproveDischarge && !dischargeApproved ? (
                          <p className="text-sm text-muted-foreground">
                            This unlocks only after the other discharge blockers are cleared.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      {dischargeReadiness.pendingCheckpoints.length ? (
                        dischargeReadiness.pendingCheckpoints.map((item) => (
                          <p key={item} className="text-muted-foreground">
                            {item}
                          </p>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No discharge readiness gaps currently reported.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No active admission is open for discharge planning yet.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>

      {consultationId ? (
        <>
          <QuickLabOrderModal
            open={isLabModalOpen}
            onOpenChange={setIsLabModalOpen}
            patientId={patientId}
            consultId={consultationId}
            patientName={patientName}
          />
          <CreateImagingOrderModal
            open={isImagingModalOpen}
            onOpenChange={setIsImagingModalOpen}
            patientId={patientId}
            consultId={consultationId}
            patientName={patientName}
          />
          <QuickMedicationOrderModal
            open={isMedicationModalOpen}
            onOpenChange={setIsMedicationModalOpen}
            consultationId={consultationId}
            patientId={patientId}
            patientName={patientName}
            medications={medications}
          />
          <ClinicalAddendumModal
            open={isAddendumModalOpen}
            onOpenChange={setIsAddendumModalOpen}
            consultationId={consultationId}
            existingNotes={consultationNotes}
          />
          {activeAdmission && (
            <DischargeMedicationReconciliationModal
              open={isMedRecModalOpen}
              onOpenChange={setIsMedRecModalOpen}
              admissionId={activeAdmission.id}
              patientName={patientName}
            />
          )}
        </>
      ) : null}

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Review Latest Results</DialogTitle>
            <DialogDescription>
              Review structured lab and imaging results, then acknowledge the items that should clear workflow blockers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Lab Results</h3>
                <Badge variant="outline">{finalizedLabResults.length}</Badge>
              </div>
              <div className="space-y-3">
                {finalizedLabResults.length ? (
                  finalizedLabResults.map((result) => (
                    <div key={result.orderId} className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">{result.tests || `Lab order ${String(result.orderId).slice(0, 8)}`}</p>
                      {result.results ? <p className="mt-1 text-muted-foreground">{result.results}</p> : null}
                      {result.approvedAt || result.processedAt ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Ready: {formatDateTime(result.approvedAt || result.processedAt || '')}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {result.physicianAcknowledgedAt ? (
                          <Badge variant="default">
                            Acknowledged {formatDateTime(result.physicianAcknowledgedAt)}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledgeLabResult(result.orderId)}
                            disabled={acknowledgingLabId === result.orderId}
                          >
                            {acknowledgingLabId === result.orderId ? 'Acknowledging...' : 'Acknowledge'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No finalized lab results are available for review.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Imaging Reports</h3>
                <Badge variant="outline">{finalizedImagingOrders.length}</Badge>
              </div>
              <div className="space-y-3">
                {finalizedImagingOrders.length ? (
                  finalizedImagingOrders.map((order) => (
                    <div key={order.id} className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">
                        {order.imagingType}
                        {order.bodyPart ? ` • ${order.bodyPart}` : ''}
                      </p>
                      <p className="mt-1 text-muted-foreground">Status: {normalizeStatus(order.status)}</p>
                      {order.completedAt ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Completed: {formatDateTime(order.completedAt)}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={selectedImagingOrder?.id === order.id ? 'default' : 'outline'}
                          onClick={() => setSelectedImagingOrderId(order.id)}
                        >
                          View Detail
                        </Button>
                        {order.physicianAcknowledgedAt ? (
                          <Badge variant="default">
                            Acknowledged {formatDateTime(order.physicianAcknowledgedAt)}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledgeImagingResult(order.id)}
                            disabled={acknowledgingImagingId === order.id}
                          >
                            {acknowledgingImagingId === order.id ? 'Acknowledging...' : 'Acknowledge'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No reported imaging studies are available for review.</p>
                )}
              </div>
            </div>
          </div>

          <DoctorImagingResultDetail
            patientId={patientId}
            order={selectedImagingOrder}
            onAcknowledge={handleAcknowledgeImagingResult}
            acknowledging={acknowledgingImagingId === selectedImagingOrder?.id}
          />

          <DialogFooter className="sm:justify-between">
            <Button asChild variant="outline">
              <Link href={`/dashboard/doctor/patients/${patientId}?tab=labs`}>
                Open Patient Labs
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/doctor/imaging-orders">Open Imaging Orders</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPharmacyQueueOpen} onOpenChange={setIsPharmacyQueueOpen}>
        <DialogContent className="max-w-4xl p-6 h-content-viewport overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pharmacy Status Tracking</DialogTitle>
            <DialogDescription>
              Review the live verification and dispensing statuses of medications ordered for this patient.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <DoctorPharmacyQueue patientId={patientId} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPharmacyQueueOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
