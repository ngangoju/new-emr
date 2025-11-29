import type { User, SystemMetric, Report, ReportType } from '@/types/admin'
import { mockPatients } from './patients'
import { mockInvoices } from './billing'
import { mockConsultations } from './consultations'

// Mock users
export const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'Super Admin',
    email: 'admin@emr.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-11-27T08:00:00Z',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'U002',
    name: 'Dr. Alice Johnson',
    email: 'alice@hospital.com',
    role: 'doctor',
    status: 'active',
    lastLogin: '2024-11-27T09:30:00Z',
    createdAt: '2023-02-15T00:00:00Z',
  },
  {
    id: 'U003',
    name: 'Dr. Bob Wilson',
    email: 'bob@hospital.com',
    role: 'doctor',
    status: 'active',
    lastLogin: '2024-11-26T15:45:00Z',
    createdAt: '2023-03-10T00:00:00Z',
  },
  {
    id: 'U004',
    name: 'Nurse Sarah',
    email: 'sarah@hospital.com',
    role: 'nurse',
    status: 'active',
    lastLogin: '2024-11-27T07:20:00Z',
    createdAt: '2023-04-01T00:00:00Z',
  },
  {
    id: 'U005',
    name: 'Receptionist Mike',
    email: 'mike@hospital.com',
    role: 'receptionist',
    status: 'active',
    lastLogin: '2024-11-27T10:15:00Z',
    createdAt: '2023-05-20T00:00:00Z',
  },
  {
    id: 'U006',
    name: 'Pharmacist Lisa',
    email: 'lisa@hospital.com',
    role: 'pharmacist',
    status: 'inactive',
    lastLogin: '2024-11-20T14:30:00Z',
    createdAt: '2023-06-12T00:00:00Z',
  },
  {
    id: 'U007',
    name: 'Lab Tech A',
    email: 'labtech@hospital.com',
    role: 'lab',
    status: 'active',
    lastLogin: '2024-11-27T08:45:00Z',
    createdAt: '2023-07-05T00:00:00Z',
  },
  {
    id: 'U008',
    name: 'Billing Clerk B',
    email: 'billing@hospital.com',
    role: 'billing',
    status: 'suspended',
    lastLogin: '2024-11-25T11:00:00Z',
    createdAt: '2023-08-18T00:00:00Z',
  },
  {
    id: 'U009',
    name: 'Dr. Carol Green',
    email: 'carol@hospital.com',
    role: 'doctor',
    status: 'active',
    lastLogin: '2024-11-27T09:00:00Z',
    createdAt: '2023-09-22T00:00:00Z',
  },
  {
    id: 'U010',
    name: 'Admin Assistant',
    email: 'assistant@hospital.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-11-26T16:20:00Z',
    createdAt: '2023-10-30T00:00:00Z',
  },
]

// Aggregate system stats from other mocks
export const getSystemStats = (): SystemMetric => {
  const totalRevenue = mockInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
  return {
    totalPatients: mockPatients.length,
    totalAppointments: mockConsultations.length,
    totalRevenue,
    totalUsers: mockUsers.length,
    patientGrowth: 15.2, // mock %
    revenueTrend: 8.7, // mock %
  }
}

// Mock reports data
const financialData = [
  { label: 'Jan', value: 15000, color: '#3b82f6' },
  { label: 'Feb', value: 18000, color: '#10b981' },
  { label: 'Mar', value: 22000, color: '#f59e0b' },
  { label: 'Apr', value: 25000, color: '#ef4444' },
  { label: 'May', value: 28000, color: '#8b5cf6' },
  { label: 'Jun', value: 32000, color: '#06b6d4' },
]

const patientData = [
  { label: 'Male', value: 45, color: '#3b82f6' },
  { label: 'Female', value: 55, color: '#ec4899' },
]

const usageData = [
  { label: 'Doctors', value: 120, color: '#10b981' },
  { label: 'Nurses', value: 85, color: '#f59e0b' },
  { label: 'Lab', value: 40, color: '#ef4444' },
  { label: 'Pharmacy', value: 30, color: '#8b5cf6' },
  { label: 'Billing', value: 25, color: '#06b6d4' },
]

export const mockReports: Record<ReportType, Report> = {
  financial: {
    id: 'rep-fin-1',
    type: 'financial',
    title: 'Financial Overview',
    period: 'Last 6 Months',
    data: financialData,
  },
  patient: {
    id: 'rep-pat-1',
    type: 'patient',
    title: 'Patient Demographics',
    period: 'Current',
    data: patientData,
  },
  usage: {
    id: 'rep-use-1',
    type: 'usage',
    title: 'System Usage',
    period: 'Today',
    data: usageData,
  },
}