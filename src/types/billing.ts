import type { Patient } from './patient'

export interface Tariff {
  id: string
  serviceName: string
  category: string
  billingCode?: string
  basePrice: number
  rssbMmiPrice?: number
  privatePrice?: number
  mutuellePrice?: number
  insurancePrices?: string // JSON string
  active: boolean
  description?: string
}

export interface InvoiceItem {
  id?: string
  tariffId: string
  tariff: Tariff
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  patientId: string
  doctorId?: string
  doctorName?: string
  patient: Patient
  consultationId?: string
  labOrderId?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  insuranceCopayPercentage: number
  insuranceDue: number
  patientDue: number
  discountAmount?: number
  discountReason?: string
  discountApprovedBy?: string
  total: number
  taxes?: number
  status: 'pending' | 'partial' | 'paid' | 'cancelled' | 'DRAFT' | 'ISSUED' | 'VOID'
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID'
  invoiceNumber?: string
  invoiceDate?: string
  payments: Payment[]
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  invoiceId: string
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'INSURANCE' | 'BANK_TRANSFER'
  amount: number
  transactionId?: string
  paidBy?: string
  receiptNumber?: string
  status?: string
  paidAt: Date
  notes?: string
}

export interface CreateInvoiceItemInput {
  billing_code?: string;
  quantity: number;
  unit_price: number;
  description: string;
  tariffId?: string;
}

export interface CreateInvoiceInput {
  patientId: string
  consultId?: string
  doctorId?: string
  labOrderId?: string
  items: CreateInvoiceItemInput[]
  discount?: number
}

export interface CreatePaymentInput {
  invoiceId: string
  paymentMethod: PaymentMethod
  amount: number
  transactionId?: string
  paidBy?: string
  receiptNumber?: string
  notes?: string
}

export interface CreateMobileMoneyPaymentInput {
  invoiceId: string
  amount: number
  phoneNumber: string
  paidBy?: string
  notes?: string
}

export interface MobileMoneyTransaction {
  id: string
  invoiceId: string
  paymentId?: string | null
  amount: number
  currency: string
  phoneNumber: string
  externalId: string
  referenceId: string
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'
  externalStatus?: string | null
  financialTransactionId?: string | null
  payerName?: string | null
  notes?: string | null
  failureReason?: string | null
  createdAt: string
  updatedAt: string
}

export type PaymentMethod = Payment['paymentMethod']

export interface CashCloseSummary {
  id: string
  cashierId: string
  cashierName: string
  shiftDate: string
  totalCollected: number
  byMethod: {
    cash: number
    card: number
    momo: number
    bankTransfer: number
  }
  invoiceCount: number
  closedAt: string
  closedBy: string
}

export interface CreateCashCloseInput {
  cashierId?: string
  shiftDate: string
  force?: boolean
}

export interface CashCloseHistoryFilters {
  cashierId?: string
  fromDate?: string
  toDate?: string
}
