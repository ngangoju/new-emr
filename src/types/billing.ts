import type { Patient } from './patient'

export interface Tariff {
  id: string
  name: string
  category: 'consultation' | 'lab' | 'imaging' | 'procedure' | 'medication' | 'other'
  price: number
  unit: 'each' | 'per_test' | 'per_kg' | 'per_ml'
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
  patient: Patient
  consultationId?: string
  labOrderId?: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  insuranceCopayPercentage: number
  insuranceDue: number
  patientDue: number
  total: number
  taxes?: number
  status: 'pending' | 'partial' | 'paid' | 'cancelled'
  payments: Payment[]
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  id: string
  invoiceId: string
  method: 'cash' | 'card' | 'mobile_money' | 'insurance'
  amount: number
  reference?: string
  paidAt: Date
  notes?: string
}

export type PaymentMethod = Payment['method']

export interface CreateInvoiceInput {
  patientId: string
  consultationId?: string
  labOrderId?: string
  items: Omit<InvoiceItem, 'id' | 'tariff' | 'total'>[]
  discount?: number
}

export interface CreatePaymentInput {
  invoiceId: string
  method: PaymentMethod
  amount: number
  reference?: string
  notes?: string
}