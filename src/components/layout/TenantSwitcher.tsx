'use client'

import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Check, ChevronsUpDown } from "lucide-react"
import { getSessionUser } from '@/lib/utils/auth'
import { getSelectedTenantId, setSelectedTenantId } from '@/lib/tenantSession'
import { useMyTenants, type MyTenant } from '@/hooks/api/useMyTenants'

/**
 * Tenant switcher dropdown for multi-tenant users.
 *
 * - Renders nothing when the user has 0 tenants (e.g. platform admins, whose
 *   tenant selection is handled separately by the analytics overview).
 * - Renders the single tenant name read-only when the user has exactly 1 tenant.
 * - Renders a switchable dropdown when the user has >= 2 tenants.
 *
 * Selecting a tenant persists it (localStorage via setSelectedTenantId) so the
 * axios interceptor injects X-Tenant-ID on subsequent requests, then invalidates
 * cached queries so all data re-fetches scoped to the newly selected tenant.
 */
export function TenantSwitcher() {
  const queryClient = useQueryClient()
  const { data: tenants = [] } = useMyTenants()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const stored = getSelectedTenantId()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(stored ?? getSessionUser()?.tenantId ?? null)
  }, [])

  // Platform admins / users with no memberships: nothing to switch.
  if (tenants.length === 0) {
    return null
  }

  const activeTenant: MyTenant | undefined =
    tenants.find((t) => t.id === selectedId) ?? tenants[0]

  // Single-tenant user: show the tenant name read-only, no switching.
  if (tenants.length === 1) {
    return (
      <div
        className="hidden md:flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground"
        aria-label="Current tenant"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate max-w-[10rem]">{activeTenant?.name}</span>
      </div>
    )
  }

  const handleSelect = (tenant: MyTenant) => {
    if (tenant.id === selectedId) return
    setSelectedTenantId(tenant.id)
    setSelectedId(tenant.id)
    // Re-scope all cached data to the new tenant. Subsequent requests already
    // carry the new X-Tenant-ID via the axios interceptor.
    queryClient.invalidateQueries()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 gap-2 px-3"
          aria-label="Switch tenant"
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline truncate max-w-[10rem]">
            {activeTenant?.name}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Switch tenant</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            className="cursor-pointer"
            onClick={() => handleSelect(tenant)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            <span className="flex-1 truncate">{tenant.name}</span>
            {tenant.id === activeTenant?.id && (
              <Check className="ml-2 h-4 w-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
