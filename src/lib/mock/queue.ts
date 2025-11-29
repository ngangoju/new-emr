export interface QueueItem {
  id: string
  patientId: string
  queueNumber: number
  status: 'waiting' | 'called' | 'completed'
  arrivedAt: Date
  calledAt?: Date
}

export const mockQueue: QueueItem[] = [
  {
    id: 'Q001',
    patientId: 'P001',
    queueNumber: 1,
    status: 'waiting',
    arrivedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
  },
  {
    id: 'Q002',
    patientId: 'P002',
    queueNumber: 2,
    status: 'called',
    arrivedAt: new Date(Date.now() - 5 * 60 * 1000),
    calledAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: 'Q003',
    patientId: 'P001', // reuse
    queueNumber: 3,
    status: 'waiting',
    arrivedAt: new Date(Date.now() - 3 * 60 * 1000),
  },
]