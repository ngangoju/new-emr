export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist' | 'lab' | 'billing';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

export interface SystemMetric {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  totalUsers: number;
  patientGrowth: number; // percentage
  revenueTrend: number; // percentage
}

export type ReportType = 'financial' | 'patient' | 'usage';

export interface ReportData {
  label: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  period: string; // 'monthly', 'yearly'
  data: ReportData[];
}