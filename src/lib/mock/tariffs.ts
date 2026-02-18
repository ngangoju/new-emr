// Mock tariffs data - using any for simplicity since the Tariff type has pre-existing issues
export const mockTariffs = [
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