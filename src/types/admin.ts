export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  status: 'active' | 'inactive' | 'suspended';
  profilePictureUrl?: string;
  lastLogin?: string;
  permissions?: string[];
  active?: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateUserInput {
  username: string;
  name: string;
  email: string;
  role: string;
  active?: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  role: string;
  status: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  language: 'en' | 'fr' | 'rw';
  timezone: string;
  twoFactorEnabled: boolean;
  shareUsageData: boolean;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  [key: string]: unknown;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  period: string; // 'monthly', 'yearly'
  data: ReportData[];
}
