// Approval Types for Clinical Director Queue

export type ApprovalType = 'invoice_deletion' | 'discount'

export type ApprovalStatus = 'pending' | 'approved' | 'denied'

export interface ApprovalRequest {
    id: string
    type: ApprovalType
    requestedBy: string
    requestedByName?: string
    requestedAt: string
    status: ApprovalStatus
    targetId?: string
    patientId?: string
    reason?: string
    reviewComment?: string
    reviewedBy?: string
    reviewedAt?: string
    // For invoice deletion
    invoiceId?: string
    invoiceTotal?: number
    deleteReason?: string
    // For discount
    patientName?: string
    discountAmount?: number
    discountPercentage?: number
    discountReason?: string
    // Response fields
    respondedBy?: string
    respondedByName?: string
    respondedAt?: string
    denialReason?: string
}

export interface ApprovalStats {
    pendingApprovals: number
    pendingInvoiceDeletions: number
    pendingDiscounts: number
    todayApproved: number
    todayDenied: number
}

export interface ApproveRequestInput {
    id: string
    notes?: string
}

export interface DenyRequestInput {
    id: string
    reason: string
}
