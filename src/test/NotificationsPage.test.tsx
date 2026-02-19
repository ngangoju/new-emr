import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'

import NotificationsPage from '@/app/dashboard/notifications/page'
import { useNotificationStream, useNotificationsModule } from '@/hooks/useNotifications'

vi.mock('@/hooks/useNotifications', () => ({
  useNotificationsModule: vi.fn(),
  useNotificationStream: vi.fn(),
}))

const baseModuleState = {
  notifications: [],
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  isMarkingAsRead: false,
  isMarkingAllAsRead: false,
  unreadCount: 0,
  isLoadingUnreadCount: false,
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter tabs and toggles empty states per filter', () => {
    const mockedUseNotificationsModule = vi.mocked(useNotificationsModule)
    mockedUseNotificationsModule.mockReturnValue({
      ...baseModuleState,
    })

    render(<NotificationsPage />)

    const filtersTablist = screen.getByRole('tablist', { name: /notification filters/i })
    const allFilter = within(filtersTablist).getByRole('button', { name: 'All' })
    const unreadFilter = within(filtersTablist).getByRole('button', { name: 'Unread' })

    expect(allFilter).toBeInTheDocument()
    expect(unreadFilter).toBeInTheDocument()
    expect(screen.getByText('No notifications yet')).toBeInTheDocument()

    fireEvent.click(unreadFilter)
    expect(screen.getByText('No unread notifications')).toBeInTheDocument()

    const viewAll = screen.getByRole('button', { name: 'View all notifications' })
    fireEvent.click(viewAll)
    expect(screen.getByText('No notifications yet')).toBeInTheDocument()
  })

  it('invokes mark-all-read mutation', () => {
    const markAllAsRead = vi.fn()
    const mockedUseNotificationsModule = vi.mocked(useNotificationsModule)
    mockedUseNotificationsModule.mockReturnValue({
      ...baseModuleState,
      unreadCount: 3,
      markAllAsRead,
    })

    render(<NotificationsPage />)

    const markAllButton = screen.getByRole('button', { name: 'Mark all read' })
    fireEvent.click(markAllButton)

    expect(markAllAsRead).toHaveBeenCalledTimes(1)
  })

  it('subscribes to notification stream on mount', () => {
    const mockedUseNotificationsModule = vi.mocked(useNotificationsModule)
    mockedUseNotificationsModule.mockReturnValue({
      ...baseModuleState,
    })

    render(<NotificationsPage />)

    expect(vi.mocked(useNotificationStream)).toHaveBeenCalledTimes(1)
  })
})
