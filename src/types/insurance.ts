export type ClaimStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID'

export interface InsuranceClaim {
  id: string
  invoiceId: string
  insuranceCompany: string
  policyNumber?: string
  memberNumber?: string
  claimAmount: number
  status: ClaimStatus
  submittedAt?: string
  approvedAt?: string
  paidAt?: string
  rejectionReason?: string
  claimReference?: string
  authorizationNumber?: string
  createdAt: string
  updatedAt: string
}

export interface CreateClaimInput {
  invoiceId: string
  insuranceCompany: string
  policyNumber?: string
  memberNumber?: string
  claimAmount: number
  authorizationNumber?: string
}

export interface UpdateClaimStatusInput {
  claimId: string
  status: ClaimStatus
  rejectionReason?: string
}
