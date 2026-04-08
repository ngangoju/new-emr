'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Download, Loader2, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useExportAfterVisitDocument, usePrintableAfterVisitDocument } from '@/hooks/useWorkflow'

export default function ReceptionDischargePacketPage() {
  const params = useParams<{ admissionId: string }>()
  const admissionId = typeof params?.admissionId === 'string' ? params.admissionId : ''
  const { data, isLoading, error } = usePrintableAfterVisitDocument(admissionId)
  const exportDocument = useExportAfterVisitDocument(admissionId)

  const generatedLabel = useMemo(() => {
    if (!data?.generatedAt) return ''
    return new Date(data.generatedAt).toLocaleString()
  }, [data?.generatedAt])

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
    window.print()
  }

  const handleDownloadHtml = async () => {
    await exportDocument.mutateAsync({ format: 'html' })
  }

  const handleDownloadPdf = async () => {
    await exportDocument.mutateAsync({ format: 'pdf' })
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
            <p className="text-xs text-slate-500">{data.documentTitle} for {data.patientName || data.patientId}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={exportDocument.isPending}>
              <Download className="h-4 w-4" />
              {exportDocument.isPending ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button variant="outline" onClick={handleDownloadHtml}>
              <Download className="h-4 w-4" />
              {exportDocument.isPending ? 'Downloading...' : 'Download HTML'}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </div>
  )
}
