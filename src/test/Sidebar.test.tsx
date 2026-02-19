import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Sidebar } from '@/components/layout/Sidebar'
import type { UserRole } from '@/lib/utils/auth'
import { useUnreadCount } from '@/hooks/useNotifications'
import { useUIStore } from '@/lib/stores/uiStore'
import {
  getUserRole,
  isAuthInitialized,
  onAuthInitialized,
  AUTH_EVENTS,
} from '@/lib/utils/auth'

vi.mock('@/hooks/useNotifications', () => ({
  useUnreadCount: vi.fn(),
}))

vi.mock('@/lib/stores/uiStore', () => ({
  useUIStore: vi.fn(),
}))

vi.mock('@/lib/utils/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils/auth')>('@/lib/utils/auth')
  return {
    ...actual,
    getUserRole: vi.fn(),
    isAuthInitialized: vi.fn(),
    onAuthInitialized: vi.fn(),
    AUTH_EVENTS: actual.AUTH_EVENTS,
  }
})

const ALL_ROLES: UserRole[] = [
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'RECEIPTION',
  'RECEPTIONIST',
  'CUSTOMER_CARE',
  'LABORANTIN',
  'LAB_TECH',
  'PHARMACIST',
  'CASHIER',
  'AUDITOR',
  'BILLING_OFFICER',
  'MANAGER',
  'CLINICAL_DIRECTOR',
  'CHIEF_NURSE',
  'RADIOLOGIST',
  'SECURITY',
  'HUMAN_RESOURCE',
  'COO',
  'DAF',
  'STORE',
  'USER',
  'ACCOUNTANT',
]

const setupCommonMocks = (role: UserRole, unreadCount = 0) => {
  vi.mocked(getUserRole).mockReturnValue(role)
  vi.mocked(isAuthInitialized).mockReturnValue(true)
  vi.mocked(onAuthInitialized).mockReturnValue(() => {})
  vi.mocked(useUnreadCount).mockReturnValue({ data: unreadCount } as ReturnType<typeof useUnreadCount>)
  vi.mocked(useUIStore).mockImplementation((selector) =>
    selector({
      sidebarCollapsed: false,
      isDarkMode: false,
      toggleSidebar: vi.fn(),
      toggleDarkMode: vi.fn(),
    } as never),
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows Notifications entry for all roles', async () => {
    for (const role of ALL_ROLES) {
      setupCommonMocks(role)

      const { unmount } = render(<Sidebar />)

      const portalLabel = await screen.findByText(`${role} PORTAL`)
      expect(portalLabel).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument()

      unmount()
    }
  })

  it('reflects unread badge count from useUnreadCount()', async () => {
    setupCommonMocks('DOCTOR', 12)

    render(<Sidebar />)

    const badge = await screen.findByText('12')
    expect(badge).toBeInTheDocument()
  })
})
