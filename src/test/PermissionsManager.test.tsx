import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PermissionsManager } from '@/components/admin/PermissionsManager'

const ROUTE_PERMISSION_IDS = [
  'route:/dashboard/reception',
  'route:/dashboard/nurse',
  'route:/dashboard/nurse/admissions',
  'route:/dashboard/doctor/patients',
  'route:/dashboard/doctor/consultations',
  'route:/dashboard/doctor/schedule',
  'route:/dashboard/schedule',
  'route:/dashboard/doctor/records',
  'route:/dashboard/lab',
  'route:/dashboard/radiology',
  'route:/dashboard/pharmacy',
  'route:/dashboard/billing',
  'route:/dashboard/cashier/close',
  'route:/dashboard/admin',
  'route:/dashboard/admin/roles',
  'route:/dashboard/reports',
  'route:/dashboard/approvals',
]

const MENU_PERMISSION_IDS = [
  'menu:/dashboard',
  'menu:/dashboard/reception',
  'menu:/dashboard/nurse',
  'menu:/dashboard/nurse/admissions',
  'menu:/dashboard/doctor/patients',
  'menu:/dashboard/doctor/consultations',
  'menu:/dashboard/doctor/schedule',
  'menu:/dashboard/notifications',
  'menu:/dashboard/lab',
  'menu:/dashboard/radiology',
  'menu:/dashboard/pharmacy',
  'menu:/dashboard/billing',
  'menu:/dashboard/cashier/close',
  'menu:/dashboard/doctor/records',
  'menu:/dashboard/reports',
  'menu:/dashboard/approvals',
  'menu:/dashboard/admin',
]

function StatefulPermissionsManager({
  initialValue,
  onPermissionChange,
}: {
  initialValue: string
  onPermissionChange?: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <PermissionsManager
      value={value}
      onChange={(nextValue) => {
        setValue(nextValue)
        onPermissionChange?.(nextValue)
      }}
    />
  )
}

describe('PermissionsManager route/menu bulk toggles', () => {
  it('selects all and deselects all dashboard route permissions from the group checkbox', async () => {
    const user = userEvent.setup()
    const onPermissionChange = vi.fn()

    render(<StatefulPermissionsManager initialValue="[]" onPermissionChange={onPermissionChange} />)

    const routeGroupToggle = screen.getByLabelText('Select all Dashboard Route Access')

    await user.click(routeGroupToggle)

    const firstChange = onPermissionChange.mock.calls[0]?.[0]
    expect(firstChange).toBeDefined()
    expect(JSON.parse(firstChange)).toEqual(ROUTE_PERMISSION_IDS)

    await user.click(routeGroupToggle)

    const secondChange = onPermissionChange.mock.calls[1]?.[0]
    expect(secondChange).toBeDefined()
    expect(JSON.parse(secondChange)).toEqual([])
  })

  it('shows correct group checkbox states for none, partial, and full selection', () => {
    const partialRouteSelection = JSON.stringify(['route:/dashboard/reception'])
    const allMenuSelected = JSON.stringify(MENU_PERMISSION_IDS)

    const { rerender } = render(<PermissionsManager value="[]" onChange={vi.fn()} />)

    expect(screen.getByLabelText('Select all Dashboard Route Access')).toHaveAttribute('data-state', 'unchecked')
    expect(screen.getByLabelText('Select all Dashboard Menu Visibility')).toHaveAttribute('data-state', 'unchecked')

    rerender(<PermissionsManager value={partialRouteSelection} onChange={vi.fn()} />)

    expect(screen.getByLabelText('Select all Dashboard Route Access')).toHaveAttribute('data-state', 'indeterminate')

    rerender(<PermissionsManager value={allMenuSelected} onChange={vi.fn()} />)

    expect(screen.getByLabelText('Select all Dashboard Menu Visibility')).toHaveAttribute('data-state', 'checked')
  })

  it('does not add group-level bulk checkbox to existing non-route/menu groups', () => {
    render(<PermissionsManager value="[]" onChange={vi.fn()} />)

    expect(screen.queryByLabelText('Select all Patients')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Select all Appointments')).not.toBeInTheDocument()
  })
})
