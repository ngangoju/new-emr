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
      mobileNavOpen: false,
      tableDensity: 'comfortable',
      toggleSidebar: vi.fn(),
      setMobileNavOpen: vi.fn(),
      toggleMobileNav: vi.fn(),
      setTableDensity: vi.fn(),
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

      // userRole is set synchronously on mount (isAuthInitialized() === true),
      // so the "{role} PORTAL" label is already in the DOM — assert it
      // synchronously instead of polling via findByText (which adds ~10s of
      // async overhead per role and can blow the test timeout on slow CI).
      const portalLabel = screen.getByText(`${role} PORTAL`)
      expect(portalLabel).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument()

      unmount()
    }
  }, 120000)

  it('reflects unread badge count from useUnreadCount()', async () => {
    setupCommonMocks('DOCTOR', 12)

    render(<Sidebar />)

    const badge = await screen.findByText('12')
    expect(badge).toBeInTheDocument()
  })
})
