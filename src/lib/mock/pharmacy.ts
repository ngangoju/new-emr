import type { InventoryItem } from '@/types/pharmacy'

export const mockInventory: InventoryItem[] = [
    {
        medication: {
            id: 'med-1',
            name: 'Amoxicillin',
            genericName: 'Amoxicillin',
            strength: '500mg',
            form: 'Capsule',
            category: 'Antibiotic'
        },
        batches: [
            {
                id: 'b-1',
                medicationId: 'med-1',
                batchNumber: 'LOT123',
                expiryDate: '2026-12-01',
                quantity: 500
            }
        ],
        lowStockThreshold: 100
    },
    {
        medication: {
            id: 'med-2',
            name: 'Paracetamol',
            genericName: 'Acetaminophen',
            strength: '500mg',
            form: 'Tablet',
            category: 'Analgesic'
        },
        batches: [
            {
                id: 'b-2',
                medicationId: 'med-2',
                batchNumber: 'LOT456',
                expiryDate: '2025-06-01',
                quantity: 50
            }
        ],
        lowStockThreshold: 100
    }
]
