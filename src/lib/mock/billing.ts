import { mockPatients } from './patients'
import { mockTariffs } from './tariffs'
import type { Invoice, Payment, InvoiceItem } from '@/types/billing'

const johnDoe = mockPatients[0]!

const tariffs = mockTariffs

const genConsultTariff = tariffs.find(t => t.id === 'CONSULT-GEN')!
const childConsultTariff = tariffs.find(t => t.id === 'CONSULT-CHILD')!
const nfsTariff = tariffs.find(t => t.id === 'LAB-NFS')!
const urineTariff = tariffs.find(t => t.id === 'LAB-URINE')!
const paracetamolTariff = tariffs.find(t => t.id === 'MED-PARACET')!

export const mockInvoices: Invoice[] = [
  {
    id: 'INV001',
    patientId: johnDoe.id,
    patient: johnDoe,
    consultationId: 'CONS001',
    items: [
      {
        id: 'ITEM001a',
        tariffId: 'CONSULT-GEN',
        tariff: genConsultTariff,
        quantity: 1,
        unitPrice: 5000,
        total: 5000
      }
    ],
    subtotal: 5000,
    discount: 0,
    insuranceCopayPercentage: johnDoe.insurance.copayPercentage,
    insuranceDue: 1000,
    patientDue: 4000,
    total: 5000,
    status: 'pending',
    payments: [],
    createdAt: new Date('2024-11-26T10:00:00'),
    updatedAt: new Date('2024-11-26T10:00:00')
  },
  {
    id: 'INV002',
    patientId: johnDoe.id,
    patient: johnDoe,
    consultationId: 'CONS002',
    labOrderId: 'LAB001',
    items: [
      {
        id: 'ITEM002a',
        tariffId: 'CONSULT-CHILD',
        tariff: childConsultTariff,
        quantity: 1,
        unitPrice: 4000,
        total: 4000
      },
      {
        id: 'ITEM002b',
        tariffId: 'LAB-NFS',
        tariff: nfsTariff,
        quantity: 1,
        unitPrice: 3500,
        total: 3500
      }
    ],
    subtotal: 7500,
    discount: 500,
    insuranceCopayPercentage: johnDoe.insurance.copayPercentage,
    insuranceDue: 1300,
    patientDue: 5700,
    total: 7000,
    status: 'partial',
    payments: [
      {
        id: 'PAY001',
        invoiceId: 'INV002',
        method: 'cash',
        amount: 2000,
        reference: 'CASH-001',
        paidAt: new Date('2024-11-27T09:00:00')
      }
    ],
    createdAt: new Date('2024-11-27T08:00:00'),
    updatedAt: new Date('2024-11-27T09:00:00')
  },
  {
    id: 'INV003',
    patientId: johnDoe.id,
    patient: johnDoe,
    consultationId: 'CONS003',
    items: [
      {
        id: 'ITEM003a',
        tariffId: 'CONSULT-GEN',
        tariff: genConsultTariff,
        quantity: 1,
        unitPrice: 5000,
        total: 5000
      },
      {
        id: 'ITEM003b',
        tariffId: 'LAB-URINE',
        tariff: urineTariff,
        quantity: 1,
        unitPrice: 2500,
        total: 2500
      },
      {
        id: 'ITEM003c',
        tariffId: 'MED-PARACET',
        tariff: paracetamolTariff,
        quantity: 2,
        unitPrice: 1500,
        total: 3000
      }
    ],
    subtotal: 10500,
    discount: 0,
    insuranceCopayPercentage: johnDoe.insurance.copayPercentage,
    insuranceDue: 2100,
    patientDue: 8400,
    total: 10500,
    status: 'paid',
    payments: [
      {
        id: 'PAY002',
        invoiceId: 'INV003',
        method: 'mobile_money',
        amount: 8400,
        reference: 'MTN-123456',
        paidAt: new Date('2024-11-27T10:30:00')
      },
      {
        id: 'PAY003',
        invoiceId: 'INV003',
        method: 'insurance',
        amount: 2100,
        reference: 'RwandaCare-INS001',
        paidAt: new Date('2024-11-27T11:00:00')
      }
    ],
    createdAt: new Date('2024-11-27T09:30:00'),
    updatedAt: new Date('2024-11-27T11:00:00')
  }
]

export const mockPayments: Payment[] = mockInvoices.flatMap(invoice => invoice.payments)