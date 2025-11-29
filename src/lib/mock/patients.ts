
import type { Patient } from '@/types/patient'

export const mockPatients: Patient[] = [
  {
    id: 'P001',
    fullName: 'John Doe',
    nationalId: 'ND-123456789012',
    phone: '+250 788 123 456',
    email: 'john.doe@example.com',
    dateOfBirth: new Date('1980-05-15'),
    gender: 'male',
    photoUrl: 'https://i.pravatar.cc/150?u=1',
    address: {
      province: 'Kigali',
      district: 'Gasabo',
      sector: 'Kacyiru',
      cell: 'Kacyiru 1',
      village: 'Blue Zone',
    },
    insurance: {
      provider: 'RwandaCare',
      cardNumber: 'INS1234567890123456',
      copayPercentage: 20,
    },
    allergies: ['Penicillin', 'Peanuts'],
    bloodGroup: 'O+',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+250 788 654 321',
      relationship: 'Spouse',
    },
    status: 'active',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-11-27'),
    lastVisit: new Date('2024-11-20'),
  }
]