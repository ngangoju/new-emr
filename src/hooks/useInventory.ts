'use client'

import type { InventoryItem } from '@/types/pharmacy'
import { mockInventory } from '@/lib/mock/pharmacy'

export function useInventory() {
  const inventory = mockInventory as InventoryItem[]

  const totals