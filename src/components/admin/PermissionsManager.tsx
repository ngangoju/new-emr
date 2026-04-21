'use client'

import { useState, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, ChevronDown, ChevronRight, Check, Users, Calendar, DollarSign, FileText, Pill, Microscope, Settings, Shield, LayoutDashboard, Bed } from 'lucide-react'
import { cn } from '@/lib/utils'

// Define permission groups with human-readable labels
const PERMISSION_GROUPS = [
  {
    id: 'patient',
    label: 'Patients',
    icon: Users,
    description: 'Manage patient records and information',
    permissions: [
      { id: 'read:patient', label: 'View Patients', description: 'View patient list and details' },
      { id: 'write:patient', label: 'Manage Patients', description: 'Create, edit, and delete patient records' },
    ],
  },
  {
    id: 'admissions',
    label: 'Admissions',
    icon: Bed,
    description: 'Manage patient inpatient admissions',
    permissions: [
      { id: 'admission:create', label: 'Admit Patients', description: 'Admit patients to a ward and bed' },
      { id: 'admission:discharge', label: 'Discharge Patients', description: 'Discharge or cancel admissions' },
      { id: 'admission:transfer', label: 'Transfer Patients', description: 'Transfer patients between beds and wards' },
    ],
  },
  {
    id: 'appointment',
    label: 'Appointments',
    icon: Calendar,
    description: 'Manage appointments and schedules',
    permissions: [
      { id: 'read:appointment', label: 'View Appointments', description: 'View appointment schedule' },
      { id: 'write:appointment', label: 'Manage Appointments', description: 'Create, edit, and cancel appointments' },
    ],
  },
  {
    id: 'queue',
    label: 'Queue',
    icon: FileText,
    description: 'Manage patient queue and triage',
    permissions: [
      { id: 'read:queue', label: 'View Queue', description: 'View patient queue' },
      { id: 'write:queue', label: 'Manage Queue', description: 'Add, remove, and reorder queue' },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: DollarSign,
    description: 'Manage billing and payments',
    permissions: [
      { id: 'read:billing', label: 'View Billing', description: 'View invoices and payments' },
      { id: 'write:billing', label: 'Manage Billing', description: 'Create invoices and process payments' },
    ],
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    icon: Pill,
    description: 'Manage pharmacy and medications',
    permissions: [
      { id: 'read:pharmacy', label: 'View Pharmacy', description: 'View pharmacy inventory' },
      { id: 'write:pharmacy', label: 'Manage Pharmacy', description: 'Manage medications and dispensing' },
    ],
  },
  {
    id: 'lab',
    label: 'Laboratory',
    icon: Microscope,
    description: 'Manage lab orders and results',
    permissions: [
      { id: 'read:lab', label: 'View Lab', description: 'View lab orders and results' },
      { id: 'write:lab', label: 'Manage Lab', description: 'Create and process lab orders' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    description: 'Access reports and analytics',
    permissions: [
      { id: 'read:reports', label: 'View Reports', description: 'View reports and analytics' },
      { id: 'write:reports', label: 'Manage Reports', description: 'Generate and export reports' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Settings,
    description: 'System administration',
    permissions: [
      { id: 'read:admin', label: 'View Admin', description: 'Access admin panel' },
      { id: 'write:admin', label: 'Manage System', description: 'System configuration and users' },
    ],
  },
  {
    id: 'dashboard-routes',
    label: 'Dashboard Route Access',
    icon: LayoutDashboard,
    description: 'Controls direct route access under /dashboard',
    permissions: [
      { id: 'route:/dashboard/reception', label: 'Route: Reception', description: 'Access /dashboard/reception and nested routes' },
      { id: 'route:/dashboard/nurse', label: 'Route: Nurse', description: 'Access /dashboard/nurse and nested routes' },
      { id: 'route:/dashboard/nurse/admissions', label: 'Route: Admissions', description: 'Access /dashboard/nurse/admissions and nested routes' },
      { id: 'route:/dashboard/doctor/patients', label: 'Route: Patients', description: 'Access /dashboard/doctor/patients and nested routes' },
      { id: 'route:/dashboard/doctor/consultations', label: 'Route: Consultations', description: 'Access /dashboard/doctor/consultations and nested routes' },
      { id: 'route:/dashboard/doctor/schedule', label: 'Route: Schedule', description: 'Access /dashboard/doctor/schedule and nested routes' },
      { id: 'route:/dashboard/schedule', label: 'Route: Shared Schedule', description: 'Access /dashboard/schedule and nested routes' },
      { id: 'route:/dashboard/doctor/records', label: 'Route: Medical Records', description: 'Access /dashboard/doctor/records and nested routes' },
      { id: 'route:/dashboard/lab', label: 'Route: Lab', description: 'Access /dashboard/lab and nested routes' },
      { id: 'route:/dashboard/radiology', label: 'Route: Radiology', description: 'Access /dashboard/radiology and nested routes' },
      { id: 'route:/dashboard/pharmacy', label: 'Route: Pharmacy', description: 'Access /dashboard/pharmacy and nested routes' },
      { id: 'route:/dashboard/billing', label: 'Route: Billing', description: 'Access /dashboard/billing and nested routes' },
      { id: 'route:/dashboard/cashier/close', label: 'Route: Cash Close', description: 'Access /dashboard/cashier/close and nested routes' },
      { id: 'route:/dashboard/admin', label: 'Route: Admin', description: 'Access /dashboard/admin and nested routes' },
      { id: 'route:/dashboard/admin/roles', label: 'Route: Admin Roles', description: 'Access /dashboard/admin/roles and nested routes' },
      { id: 'route:/dashboard/reports', label: 'Route: Reports', description: 'Access /dashboard/reports and nested routes' },
      { id: 'route:/dashboard/approvals', label: 'Route: Approvals', description: 'Access /dashboard/approvals and nested routes' },
    ],
  },
  {
    id: 'dashboard-menu',
    label: 'Dashboard Menu Visibility',
    icon: LayoutDashboard,
    description: 'Controls sidebar/menu item visibility',
    permissions: [
      { id: 'menu:/dashboard', label: 'Menu: Dashboard', description: 'Show Dashboard in sidebar' },
      { id: 'menu:/dashboard/reception', label: 'Menu: Reception', description: 'Show Reception in sidebar' },
      { id: 'menu:/dashboard/nurse', label: 'Menu: Nurse', description: 'Show Nurse in sidebar' },
      { id: 'menu:/dashboard/nurse/admissions', label: 'Menu: Admissions', description: 'Show Admissions in sidebar' },
      { id: 'menu:/dashboard/doctor/patients', label: 'Menu: Patients', description: 'Show Patients in sidebar' },
      { id: 'menu:/dashboard/doctor/consultations', label: 'Menu: Consultations', description: 'Show Consultations in sidebar' },
      { id: 'menu:/dashboard/doctor/schedule', label: 'Menu: Schedule', description: 'Show Schedule in sidebar' },
      { id: 'menu:/dashboard/notifications', label: 'Menu: Notifications', description: 'Show Notifications in sidebar' },
      { id: 'menu:/dashboard/lab', label: 'Menu: Lab Results', description: 'Show Lab Results in sidebar' },
      { id: 'menu:/dashboard/radiology', label: 'Menu: Radiology', description: 'Show Radiology in sidebar' },
      { id: 'menu:/dashboard/pharmacy', label: 'Menu: Pharmacy', description: 'Show Pharmacy in sidebar' },
      { id: 'menu:/dashboard/billing', label: 'Menu: Billing', description: 'Show Billing in sidebar' },
      { id: 'menu:/dashboard/cashier/close', label: 'Menu: Cash Close', description: 'Show Cash Close in sidebar' },
      { id: 'menu:/dashboard/doctor/records', label: 'Menu: Medical Records', description: 'Show Medical Records in sidebar' },
      { id: 'menu:/dashboard/reports', label: 'Menu: Reports', description: 'Show Reports in sidebar' },
      { id: 'menu:/dashboard/approvals', label: 'Menu: Approvals', description: 'Show Approvals in sidebar' },
      { id: 'menu:/dashboard/admin', label: 'Menu: Admin', description: 'Show Admin in sidebar' },
    ],
  },
]

// Special permissions that don't fit in groups
const SPECIAL_PERMISSIONS = [
  { id: 'read:*', label: 'Full Read Access', description: 'Read access to all resources' },
  { id: 'write:*', label: 'Full Write Access', description: 'Write access to all resources' },
  { id: 'admin:*', label: 'Super Admin', description: 'Full system administrator access' },
]

interface PermissionsManagerProps {
  value: string // JSON string of permissions
  onChange: (value: string) => void
}

export function PermissionsManager({ value, onChange }: PermissionsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['patient', 'appointment', 'queue']))

  // Parse the current permissions from JSON string
  const selectedPermissions = useMemo(() => {
    try {
      if (!value) return []
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [value])

  // Check if a permission is selected
  const isPermissionSelected = (permissionId: string) => {
    if (permissionId === 'read:*') {
      return selectedPermissions.includes('read:*')
    }
    if (permissionId === 'write:*') {
      return selectedPermissions.includes('write:*')
    }
    // Check for wildcard permissions
    if (permissionId.startsWith('read:')) {
      return selectedPermissions.includes('read:*') || 
             selectedPermissions.some(p => p === permissionId || p.startsWith(permissionId.replace('read:', 'read:')))
    }
    if (permissionId.startsWith('write:')) {
      return selectedPermissions.includes('write:*') ||
             selectedPermissions.some(p => p === permissionId || p.startsWith(permissionId.replace('write:', 'write:')))
    }
    return selectedPermissions.includes(permissionId)
  }

  // Toggle a permission
  const togglePermission = (permissionId: string) => {
    let newPermissions: string[]
    
    // Handle special permissions
    if (permissionId === 'read:*') {
      if (selectedPermissions.includes('read:*')) {
        newPermissions = selectedPermissions.filter(p => p !== 'read:*')
      } else {
        newPermissions = [...selectedPermissions.filter(p => !p.startsWith('read:')), 'read:*']
      }
    } else if (permissionId === 'write:*') {
      if (selectedPermissions.includes('write:*')) {
        newPermissions = selectedPermissions.filter(p => p !== 'write:*')
      } else {
        newPermissions = [...selectedPermissions.filter(p => !p.startsWith('write:')), 'write:*']
      }
    } else {
      // Handle regular permissions
      if (selectedPermissions.includes(permissionId)) {
        newPermissions = selectedPermissions.filter(p => p !== permissionId)
      } else {
        newPermissions = [...selectedPermissions, permissionId]
      }
    }
    
    onChange(JSON.stringify(newPermissions))
  }

  // Toggle all permissions in a group
  const toggleGroup = (groupId: string, permissions: { id: string }[]) => {
    const groupPermissionIds = permissions.map(p => p.id)
    const allSelected = groupPermissionIds.every(id => isPermissionSelected(id))
    
    let newPermissions: string[]
    
    if (allSelected) {
      // Remove all group permissions
      newPermissions = selectedPermissions.filter(p => !groupPermissionIds.includes(p))
    } else {
      // Add all group permissions (except existing ones)
      const existing = new Set(selectedPermissions)
      const toAdd = groupPermissionIds.filter(id => !existing.has(id))
      newPermissions = [...selectedPermissions, ...toAdd]
    }
    
    onChange(JSON.stringify(newPermissions))
  }

  // Toggle a group (read or write)
  const toggleAction = (prefix: string, groupPermissions: { id: string }[]) => {
    const actionPermissions = groupPermissions
      .filter(p => p.id.startsWith(prefix))
      .map(p => p.id)
    
    const allSelected = actionPermissions.every(id => isPermissionSelected(id))
    
    let newPermissions: string[]
    
    if (allSelected) {
      newPermissions = selectedPermissions.filter(p => !actionPermissions.includes(p))
    } else {
      const existing = new Set(selectedPermissions)
      const toAdd = actionPermissions.filter(id => !existing.has(id))
      newPermissions = [...selectedPermissions, ...toAdd]
    }
    
    onChange(JSON.stringify(newPermissions))
  }

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return PERMISSION_GROUPS
    
    const query = searchQuery.toLowerCase()
    return PERMISSION_GROUPS.map(group => ({
      ...group,
      permissions: group.permissions.filter(
        p => 
          p.label.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query)
      ),
    })).filter(group => group.permissions.length > 0)
  }, [searchQuery])

  // Count selected permissions
  const selectedCount = selectedPermissions.length

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const isBulkSelectableGroup = (groupId: string) => {
    return groupId === 'dashboard-routes' || groupId === 'dashboard-menu'
  }

  return (
    <div className="space-y-4">
      {/* Header with search and count */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="shrink-0">
          {selectedCount} selected
        </Badge>
      </div>

      {/* Special Permissions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Special Permissions
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {SPECIAL_PERMISSIONS.map((permission) => (
            <div
              key={permission.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                isPermissionSelected(permission.id)
                  ? "bg-primary/10 border-primary"
                  : "hover:bg-muted/50 border-border"
              )}
              onClick={() => togglePermission(permission.id)}
            >
              <Checkbox
                checked={isPermissionSelected(permission.id)}
                onCheckedChange={() => togglePermission(permission.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">{permission.label}</Label>
                <p className="text-xs text-muted-foreground">{permission.description}</p>
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded break-all">{permission.id}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Groups */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Resource Permissions</h4>
        {filteredGroups.map((group) => {
          const Icon = group.icon
          const isExpanded = expandedGroups.has(group.id)
          const showGroupBulkToggle = isBulkSelectableGroup(group.id)
          const readPermissions = group.permissions.filter(p => p.id.startsWith('read:'))
          const writePermissions = group.permissions.filter(p => p.id.startsWith('write:'))
          const allReadSelected = readPermissions.every(p => isPermissionSelected(p.id))
          const allWriteSelected = writePermissions.every(p => isPermissionSelected(p.id))
          const groupSelectedCount = group.permissions.filter(p => isPermissionSelected(p.id)).length
          const allGroupSelected = group.permissions.length > 0 && groupSelectedCount === group.permissions.length
          const someGroupSelected = groupSelectedCount > 0 && groupSelectedCount < group.permissions.length
          const groupCheckboxState: boolean | 'indeterminate' = allGroupSelected
            ? true
            : someGroupSelected
              ? 'indeterminate'
              : false

          return (
            <div
              key={group.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Group Header */}
              <div
                className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                onClick={() => toggleGroupExpansion(group.id)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{group.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({groupSelectedCount}/{group.permissions.length})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showGroupBulkToggle && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={groupCheckboxState}
                        aria-label={`Select all ${group.label}`}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleGroup(group.id, group.permissions)}
                      />
                      <span className="text-xs text-muted-foreground">All</span>
                    </div>
                  )}
                  {groupSelectedCount > 0 && groupSelectedCount < group.permissions.length && (
                    <Badge variant="outline" className="text-xs">
                      Partial
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Group Content */}
              {isExpanded && (
                <div className="p-3 space-y-3 border-t">
                  {/* Quick toggles */}
                  {(readPermissions.length > 0 || writePermissions.length > 0) && (
                    <div className="flex gap-4 text-sm">
                      {readPermissions.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleAction('read:', group.permissions)
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                            allReadSelected
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <Check className={cn("h-3 w-3", !allReadSelected && "opacity-50")} />
                          Read All
                        </button>
                      )}
                      {writePermissions.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleAction('write:', group.permissions)
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                            allWriteSelected
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <Check className={cn("h-3 w-3", !allWriteSelected && "opacity-50")} />
                          Write All
                        </button>
                      )}
                    </div>
                  )}

                  {/* Individual permissions */}
                  <div className="space-y-2">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className={cn(
                          "flex items-start gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                          isPermissionSelected(permission.id)
                            ? "bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => togglePermission(permission.id)}
                      >
                        <Checkbox
                          checked={isPermissionSelected(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <Label className="cursor-pointer">{permission.label}</Label>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground break-all">
                          {permission.id.split(':')[1]}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Raw JSON Preview (collapsible) */}
      <details className="group">
        <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
          Show raw JSON
        </summary>
        <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
          {JSON.stringify(selectedPermissions, null, 2)}
        </pre>
      </details>
    </div>
  )
}

// Helper to initialize permissions from a role's existing permissions
export function initializePermissionsFromRole(permissionsJson: string | undefined): string {
  if (!permissionsJson) return '[]'
  
  try {
    // If it's already valid JSON, return it
    JSON.parse(permissionsJson)
    return permissionsJson
  } catch {
    // If it's not valid JSON, it might be an array string like ["read:*", "write:queue"]
    try {
      // Try to parse as array
      const parsed = eval(permissionsJson) // eslint-disable-line no-eval
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed)
      }
    } catch {
      // If all fails, return empty array
    }
    return '[]'
  }
}
