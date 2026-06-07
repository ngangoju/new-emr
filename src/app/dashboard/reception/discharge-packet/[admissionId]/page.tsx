'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, Loader2, Printer } from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { useAfterVisitDocumentHistory, useExportAfterVisitDocument, usePrintableAfterVisitDocument } from '@/hooks/useWorkflow'
import type { AfterVisitDocumentChangeDetail } from '@/types/workflow'

type ChangeTone = 'added' | 'removed' | 'modified'

type CategorizedChange = AfterVisitDocumentChangeDetail & {
  tone: ChangeTone
  medicationRelated: boolean
}

const CHANGE_TONE_META: Record<ChangeTone, { title: string; badge: string; card: string; previous: string; current: string }> = {
  added: {
    title: 'Added',
    badge: 'bg-emerald-100 text-emerald-800',
    card: 'border-emerald-200 bg-emerald-50/60',
    previous: 'bg-white text-slate-500',
    current: 'bg-emerald-100/80 text-emerald-950',
  },
  removed: {
    title: 'Removed',
    badge: 'bg-rose-100 text-rose-800',
    card: 'border-rose-200 bg-rose-50/70',
    previous: 'bg-rose-100/80 text-rose-950',
    current: 'bg-white text-slate-500',
  },
  modified: {
    title: 'Modified',
    badge: 'bg-amber-100 text-amber-800',
    card: 'border-amber-200 bg-white',
    previous: 'bg-slate-50 text-slate-800',
    current: 'bg-amber-50 text-amber-950',
  },
}

function classifyChangeTone(change: AfterVisitDocumentChangeDetail): ChangeTone {
  const previous = change.previousValue.trim().toLowerCase()
  const current = change.currentValue.trim().toLowerCase()

  if (previous === 'added') {
    return 'added'
  }
  if (current === 'removed') {
    return 'removed'
  }
  return 'modified'
}

function isMedicationChange(change: AfterVisitDocumentChangeDetail) {
  const label = change.label.toLowerCase()
  return label.startsWith('continue-at-home') || label.startsWith('stop-after-discharge')
}

export default function ReceptionDischargePacketPage() {
  const params = useParams<{ admissionId: string }>()
  const admissionId = typeof params?.admissionId === 'string' ? params.admissionId : ''
  const { data, isLoading, error } = usePrintableAfterVisitDocument(admissionId)
  const { data: history = [] } = useAfterVisitDocumentHistory(admissionId)
  const exportDocument = useExportAfterVisitDocument(admissionId)
  const [reissueReason, setReissueReason] = useState('')
  const generatedAt = data?.generatedAt
  const changeDetailsSinceLastExport = data?.changeDetailsSinceLastExport

  const generatedLabel = useMemo(() => {
    if (!generatedAt) return ''
    return new Date(generatedAt).toLocaleString()
  }, [generatedAt])

  const categorizedChanges = useMemo<CategorizedChange[]>(() => {
    if (!changeDetailsSinceLastExport?.length) {
      return []
    }

    return [...changeDetailsSinceLastExport]
      .map((change) => ({
        ...change,
        tone: classifyChangeTone(change),
        medicationRelated: isMedicationChange(change),
      }))
      .sort((left, right) => {
        if (left.medicationRelated !== right.medicationRelated) {
          return left.medicationRelated ? -1 : 1
        }

        const toneOrder: Record<ChangeTone, number> = { added: 0, removed: 1, modified: 2 }
        if (toneOrder[left.tone] !== toneOrder[right.tone]) {
          return toneOrder[left.tone] - toneOrder[right.tone]
        }

        return left.label.localeCompare(right.label)
      })
  }, [changeDetailsSinceLastExport])

  const groupedChanges = useMemo(() => {
    const groupByTone = (changes: CategorizedChange[]) =>
      (['added', 'removed', 'modified'] as const)
        .map((tone) => ({
          tone,
          items: changes.filter((change) => change.tone === tone),
        }))
        .filter((group) => group.items.length > 0)

    const medication = categorizedChanges.filter((change) => change.medicationRelated)
    const narrative = categorizedChanges.filter((change) => !change.medicationRelated)

    return {
      medication: groupByTone(medication),
      narrative: groupByTone(narrative),
    }
  }, [categorizedChanges])

  const bodyHtml = useMemo(() => {
    if (!data) return ''

    const renderMedication = (item: typeof data.medicationsToContinue[number], tone: 'continue' | 'stop') => `
      <div class="med-item">
        <strong>${item.drugName || 'Unnamed medication'}</strong>
        <div class="muted">${[item.dose, item.route, item.frequency, item.duration].filter(Boolean).join(' • ') || 'No dose details recorded'}</div>
        <span class="tag ${tone === 'continue' ? 'tag-continue' : 'tag-stop'}">${tone === 'continue' ? 'Continue at Home' : 'Stop After Discharge'}</span>
        ${item.decisionNote ? `<div style="margin-top:8px;"><strong>${tone === 'continue' ? 'Home note:' : 'Reason:'}</strong> ${item.decisionNote}</div>` : ''}
        ${item.lastDocumentedAt ? `<div class="muted" style="margin-top:8px;">Last documented bedside event: ${new Date(item.lastDocumentedAt).toLocaleString()}${item.lastAdministrationStatus ? ` (${item.lastAdministrationStatus})` : ''}</div>` : ''}
      </div>
    `

    return `
      <div class="page">
        <div style="margin-bottom:20px;padding-bottom:18px;border-bottom:2px solid #d9e1ec;">
          <div style="font-size:28px;font-weight:700;line-height:1.1;color:#0f172a;">${data.facilityName || 'Modern EMR'}</div>
          ${data.facilityTagline ? `<div class="muted" style="margin-top:6px;">${data.facilityTagline}</div>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
          <div>
            <div class="muted" style="text-transform:uppercase;letter-spacing:0.08em;font-size:12px;font-weight:700;">Discharge Document</div>
            <h1 style="margin-top:8px;font-size:34px;line-height:1.1;">${data.documentTitle}</h1>
            <div class="muted" style="margin-top:10px;">Prepared for ${data.patientName || data.patientId}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted" style="font-size:12px;">Document Ref</div>
            <div style="font-weight:700;">${data.documentReference}</div>
            ${data.documentVersion ? `<div class="muted" style="font-size:12px;margin-top:10px;">Version</div><div style="font-weight:700;">v${data.documentVersion}${data.documentStatus ? ` • ${data.documentStatus}` : ''}</div>` : ''}
            <div class="muted" style="font-size:12px;margin-top:10px;">Generated</div>
            <div style="font-weight:700;">${generatedLabel || ''}</div>
          </div>
        </div>

        <div class="grid section">
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Patient</div>
            <div style="margin-top:8px;font-weight:700;">${data.patientName || 'Unknown patient'}</div>
            <div class="muted" style="margin-top:4px;">Patient ID: ${data.patientId}</div>
            ${data.patientNationalId ? `<div class="muted" style="margin-top:4px;">National ID: ${data.patientNationalId}</div>` : ''}
          </div>
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Follow-up</div>
            <div class="prewrap" style="margin-top:8px;">${data.followUpPlan || 'No follow-up plan documented.'}</div>
            ${data.followUpScheduledAt ? `<div class="muted" style="margin-top:8px;">Scheduled: ${new Date(data.followUpScheduledAt).toLocaleString()}</div>` : ''}
            ${data.followUpDoctorName ? `<div class="muted" style="margin-top:4px;">Clinician: ${data.followUpDoctorName}</div>` : ''}
          </div>
        </div>

        <div class="grid section">
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Admission Context</div>
            <div style="margin-top:8px;font-weight:700;">${data.wardName || 'Ward not recorded'}${data.bedNumber ? ` • Bed ${data.bedNumber}` : ''}</div>
            ${data.admittedAt ? `<div class="muted" style="margin-top:6px;">Admitted: ${new Date(data.admittedAt).toLocaleString()}</div>` : ''}
            ${data.dischargedAt ? `<div class="muted" style="margin-top:4px;">Discharged: ${new Date(data.dischargedAt).toLocaleString()}</div>` : ''}
          </div>
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Clinical Sign-off</div>
            <div style="margin-top:8px;font-weight:700;">${data.clinicalDischargeApprovedAt ? 'Clinically approved' : 'Approval timestamp pending'}</div>
            ${data.clinicalDischargeApprovedAt ? `<div class="muted" style="margin-top:6px;">Approved at: ${new Date(data.clinicalDischargeApprovedAt).toLocaleString()}</div>` : ''}
            ${data.clinicalDischargeApprovedByName ? `<div class="muted" style="margin-top:4px;">Clinician: ${data.clinicalDischargeApprovedByName}</div>` : ''}
          </div>
        </div>

        <div class="grid section">
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Medication Reconciliation Sign-off</div>
            <div style="margin-top:8px;font-weight:700;">${data.medicationReconciledByName || 'Not recorded'}</div>
            ${data.medicationReconciledByRole ? `<div class="muted" style="margin-top:4px;">Role: ${data.medicationReconciledByRole}</div>` : ''}
            ${data.medicationReconciledAt ? `<div class="muted" style="margin-top:6px;">Signed at: ${new Date(data.medicationReconciledAt).toLocaleString()}</div>` : ''}
            ${data.medicationReconciledAt ? `<div class="muted" style="margin-top:4px;">Signature: Electronically signed in EMR</div>` : ''}
          </div>
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Nursing Discharge Preparation</div>
            <div style="margin-top:8px;font-weight:700;">${data.nursingDischargePreparedByName || 'Not recorded'}</div>
            ${data.nursingDischargePreparedByRole ? `<div class="muted" style="margin-top:4px;">Role: ${data.nursingDischargePreparedByRole}</div>` : ''}
            ${data.nursingDischargePreparedAt ? `<div class="muted" style="margin-top:6px;">Prepared at: ${new Date(data.nursingDischargePreparedAt).toLocaleString()}</div>` : ''}
            ${data.nursingDischargePreparedAt ? `<div class="muted" style="margin-top:4px;">Signature: Electronically signed in EMR</div>` : ''}
          </div>
        </div>

        ${data.auditHash ? `
          <div class="section card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Document Integrity</div>
            <div style="margin-top:10px;font-weight:700;">${data.hashAlgorithm || 'SHA-256'} Audit Hash</div>
            <div class="muted" style="margin-top:6px;word-break:break-all;">${data.auditHash}</div>
            ${data.recordedAuditHash ? `<div class="muted" style="margin-top:10px;">Recorded fingerprint: ${data.recordedHashAlgorithm || 'SHA-256'}</div>` : ''}
            ${data.recordedAuditHash ? `<div class="muted" style="margin-top:4px;word-break:break-all;">${data.recordedAuditHash}</div>` : ''}
            ${data.recordedAt ? `<div class="muted" style="margin-top:8px;">Recorded at: ${new Date(data.recordedAt).toLocaleString()}</div>` : ''}
            ${data.recordedByName ? `<div class="muted" style="margin-top:4px;">Recorded by: ${data.recordedByName}${data.recordedByRole ? ` • ${data.recordedByRole}` : ''}</div>` : ''}
            ${typeof data.auditHashMatchesRecorded === 'boolean' ? `<div class="muted" style="margin-top:4px;">Verification: ${data.auditHashMatchesRecorded ? 'Current packet matches recorded fingerprint' : 'Current packet differs from recorded fingerprint'}</div>` : ''}
          </div>
        ` : ''}

        ${data.changesSinceLastExport?.length ? `
          <div class="section card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Changes Since Last Export</div>
            <ul style="margin:10px 0 0 18px;padding:0;">
              ${data.changesSinceLastExport.map((item) => `<li style="margin-top:6px;">${item}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="section card">
          <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Visit Summary</div>
          <div style="margin-top:10px;">${data.summary || 'No summary documented.'}</div>
        </div>

        <div class="section card">
          <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Instructions</div>
          <div class="prewrap" style="margin-top:10px;">${data.instructions || 'No instructions documented.'}</div>
        </div>

        ${data.medicationHandoffSummary ? `
          <div class="section card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Medication Handoff</div>
            <div class="prewrap" style="margin-top:10px;">${data.medicationHandoffSummary}</div>
          </div>
        ` : ''}

        <div class="grid section">
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Continue at Home</div>
            ${data.medicationsToContinue.length
              ? data.medicationsToContinue.map((item) => renderMedication(item, 'continue')).join('')
              : '<div style="margin-top:10px;" class="muted">No medications listed.</div>'}
          </div>
          <div class="card">
            <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">Stop After Discharge</div>
            ${data.medicationsToStop.length
              ? data.medicationsToStop.map((item) => renderMedication(item, 'stop')).join('')
              : '<div style="margin-top:10px;" class="muted">No medications listed.</div>'}
          </div>
        </div>

        <div style="margin-top:30px;padding-top:18px;border-top:1px solid #d9e1ec;font-size:12px;color:#607089;display:flex;justify-content:space-between;gap:16px;">
          <div>${data.facilityName || 'Modern EMR'}</div>
          <div>${data.documentReference}${data.auditHash ? ` • ${data.hashAlgorithm || 'SHA-256'} ${data.auditHash}` : ''} • Generated ${generatedLabel || ''}</div>
        </div>
      </div>
    `
  }, [data, generatedLabel])

  const handlePrint = () => {
    if (data?.reissueRequired) {
      toast.error('Export the updated packet with a reissue reason before printing.')
      return
    }
    window.print()
  }

  const handleDownloadHtml = async () => {
    await exportDocument.mutateAsync({ format: 'html', reissueReason: reissueReason.trim() || undefined })
  }

  const handleDownloadPdf = async () => {
    await exportDocument.mutateAsync({ format: 'pdf', reissueReason: reissueReason.trim() || undefined })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Preparing printable discharge packet...
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Discharge packet unavailable</h1>
          <p className="mt-3 text-sm text-slate-600">
            This packet is not ready yet. Make sure medication reconciliation and discharge instructions have been completed before printing.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="no-print sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{data.facilityName || 'Modern EMR'}</p>
            <p className="text-xs text-slate-500">
              {data.documentTitle} for {data.patientName || data.patientId}
              {data.documentVersion ? ` • v${data.documentVersion}` : ''}
              {data.documentStatus ? ` • ${data.documentStatus}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={exportDocument.isPending || (Boolean(data.reissueRequired) && !reissueReason.trim())}>
              <Download className="h-4 w-4" />
              {exportDocument.isPending ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={handleDownloadHtml} disabled={exportDocument.isPending || (Boolean(data.reissueRequired) && !reissueReason.trim())}>
              <Download className="h-4 w-4" />
              {exportDocument.isPending ? 'Downloading...' : 'Download HTML'}
            </Button>
            <Button onClick={handlePrint} disabled={Boolean(data.reissueRequired)}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {data.reissueRequired ? (
        <div className="no-print mx-auto mt-4 max-w-5xl px-6">
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-amber-900">Updated packet requires reissue</h2>
            <p className="mt-2 text-sm text-amber-800">
              The current discharge packet differs from the latest exported version
              {data.lastExportedVersion ? ` (v${data.lastExportedVersion})` : ''}. Add a reissue reason before exporting the new version.
            </p>
            {data.changesSinceLastExport?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {data.changesSinceLastExport.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            ) : null}
            {categorizedChanges.length ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medication changes</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {categorizedChanges.filter((change) => change.medicationRelated).length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Narrative changes</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {categorizedChanges.filter((change) => !change.medicationRelated).length}
                    </p>
                  </div>
                </div>

                {groupedChanges.medication.length ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-amber-950">Medication changes to review first</p>
                      <p className="text-xs text-amber-800">
                        These are the most important differences for the patient handoff packet.
                      </p>
                    </div>
                  </div>
                ) : null}

                {groupedChanges.medication.map((group) => {
                  const meta = CHANGE_TONE_META[group.tone]
                  return (
                    <div key={`medication-group-${group.tone}`} className="space-y-3">
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${meta.badge}`}>
                        {meta.title} medication{group.items.length > 1 ? 's' : ''}
                      </div>
                      {group.items.map((change) => (
                        <div
                          key={`${change.label}-${change.previousValue}-${change.currentValue}`}
                          className={`rounded-xl border p-4 ${meta.card}`}
                        >
                          <p className="text-sm font-semibold text-slate-950">{change.label}</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous</p>
                              <pre className={`mt-1 whitespace-pre-wrap rounded-lg p-3 text-xs ${meta.previous}`}>{change.previousValue}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</p>
                              <pre className={`mt-1 whitespace-pre-wrap rounded-lg p-3 text-xs ${meta.current}`}>{change.currentValue}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}

                {groupedChanges.narrative.length ? (
                  <div className="space-y-3 border-t border-amber-200 pt-4">
                    <div>
                      <p className="text-sm font-semibold text-amber-950">Narrative and instruction changes</p>
                      <p className="text-xs text-amber-800">
                        These sections changed too, but medication updates are shown above first.
                      </p>
                    </div>
                    {groupedChanges.narrative.map((group) => {
                      const meta = CHANGE_TONE_META[group.tone]
                      return (
                        <div key={`narrative-group-${group.tone}`} className="space-y-3">
                          <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${meta.badge}`}>
                            {meta.title} narrative change{group.items.length > 1 ? 's' : ''}
                          </div>
                          {group.items.map((change) => (
                            <div
                              key={`${change.label}-${change.previousValue}-${change.currentValue}`}
                              className={`rounded-xl border p-4 ${meta.card}`}
                            >
                              <p className="text-sm font-semibold text-slate-950">{change.label}</p>
                              <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Previous</p>
                                  <pre className={`mt-1 whitespace-pre-wrap rounded-lg p-3 text-xs ${meta.previous}`}>{change.previousValue}</pre>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</p>
                                  <pre className={`mt-1 whitespace-pre-wrap rounded-lg p-3 text-xs ${meta.current}`}>{change.currentValue}</pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
            <textarea
              value={reissueReason}
              onChange={(event) => setReissueReason(event.target.value)}
              placeholder="Explain what changed since the last exported packet."
              className="mt-3 min-h-24 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400"
            />
          </div>
        </div>
      ) : null}

      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      <div className="no-print mx-auto max-w-5xl px-6 pb-10">
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Export History</h2>
          <p className="mt-1 text-sm text-slate-600">
            Immutable discharge-packet exports recorded for this admission.
          </p>
          <div className="mt-4 space-y-3">
            {history.length ? history.map((entry, index) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {entry.versionNumber ? `Version ${entry.versionNumber}` : `Export #${history.length - index}`} • {entry.status || 'EXPORTED'} • {entry.exportFormat.toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.recordedAt).toLocaleString()}
                      {entry.recordedByName ? ` • ${entry.recordedByName}` : ''}
                      {entry.recordedByRole ? ` • ${entry.recordedByRole}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{entry.documentReference}</p>
                    {entry.fileName ? <p>{entry.fileName}</p> : null}
                  </div>
                </div>
                <p className="mt-2 break-all font-mono text-xs text-slate-600">
                  {entry.hashAlgorithm} {entry.auditHash}
                </p>
                {entry.reissueReason ? (
                  <p className="mt-2 text-xs text-slate-600">Reissue reason: {entry.reissueReason}</p>
                ) : null}
                {entry.supersededAt ? (
                  <p className="mt-1 text-xs text-slate-500">Superseded at {new Date(entry.supersededAt).toLocaleString()}</p>
                ) : null}
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                No packet exports have been recorded yet. Downloading or printing through the export flow will create the first immutable audit entry.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
