import type { Tariff } from '@/types/billing'

export const mockTariffs: Tariff[] = [
  {
    id: 'CONSULT-GEN',
    name: 'General Consultation',
    category: 'consultation',
    price: 5000,
    unit: 'each',
    description: 'Standard doctor consultation for adults'
  },
  {
    id: 'CONSULT-CHILD',
    name: 'Pediatric Consultation',
    category: 'consultation',
    price: 4000,
    unit: 'each',
    description: 'Consultation for children under 12'
  },
  {
    id: 'CONSULT-SPEC',
    name: 'Specialist Consultation',
    category: 'consultation',
    price: 15000,
    unit: 'each'
  },
  {
    id: 'LAB-NFS',
    name: 'Full Blood Count (NFS)',
    category: 'lab',
    price: 3500,
    unit: 'per_test'
  },
  {
    id: 'LAB-URINE',
    name: 'Urinalysis',
    category: 'lab',
    price: 2500,
    unit: 'per_test'
  },
  {
    id: 'LAB-LFT',
    name: 'Liver Function Tests (LFT)',
    category: 'lab',
    price: 6000,
    unit: 'per_test'
  },
  {
    id: 'IMG-XRAY',
    name: 'Chest X-Ray',
    category: 'imaging',
    price: 8000,
    unit: 'per_test'
  },
  {
    id: 'PROC-INJ',
    name: 'Intramuscular Injection',
    category: 'procedure',
    price: 2000,
    unit: 'each'
  },
  {
    id: 'MED-PARACET',
    name: 'Paracetamol 500mg (10 tabs)',
    category: 'medication',
    price: 1500,
    unit: 'each'
  },
  {
    id: 'SERVICE-AMBULANCE',
    name: 'Ambulance Service',
    category: 'other',
    price: 25000,
    unit: 'each'
  }
]