'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { getSessionUser, getUserRole } from '@/lib/utils/auth'
import {
  getDashboardNavigationForRole,
  normalizeUserRole,
} from '@/lib/authz/policy'
import { api } from '@/lib/api'
import { useDebounce } from '@/hooks/useDebounce'
import {
  FileText,
  LayoutDashboard,
  Search,
  User,
  Settings,
  Pill,
  Microscope,
  DollarSign,
} from 'lucide-react'
import { parseSmartBarInput, type SmartBarResult } from '@/lib/clinical/smart-bar-parser'
import { SmartBarPreviewCard } from '@/components/clinical/SmartBarPreviewCard'
import toast from 'react-hot-toast'


type PatientHit = {
  id: string
  firstName?: string
  lastName?: string
  mrn?: string
}

const QUICK_ACTIONS: { label: string; href: string; icon: React.ElementType; keywords?: string }[] = [
  { label: 'Open settings', href: '/dashboard/settings', icon: Settings, keywords: 'theme dark' },
  { label: 'Notifications', href: '/dashboard/notifications', icon: LayoutDashboard },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const debounced = useDebounce(query, 250)
  const [patients, setPatients] = React.useState<PatientHit[]>([])
  const [searching, setSearching] = React.useState(false)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('emr:open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('emr:open-command-palette', onOpen)
    }
  }, [])

  const role = normalizeUserRole(getUserRole() || getSessionUser()?.role)
  const navItems = role ? getDashboardNavigationForRole(role) : []

  React.useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!debounced || debounced.trim().length < 2) {
        setPatients([])
        return
      }
      setSearching(true)
      try {
        const { data } = await api.get<PatientHit[] | { content: PatientHit[] }>('/api/patients', {
          params: { search: debounced.trim(), q: debounced.trim(), size: 8 },
        })
        const list = Array.isArray(data) ? data : data?.content ?? []
        if (!cancelled) setPatients(list.slice(0, 8))
      } catch {
        if (!cancelled) setPatients([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [debounced])

  const go = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const iconForHref = (href: string) => {
    if (href.includes('pharmacy')) return Pill
    if (href.includes('lab')) return Microscope
    if (href.includes('billing')) return DollarSign
    if (href.includes('patient')) return User
    return FileText
  }

  const smartBarResult = React.useMemo(() => parseSmartBarInput(query), [query])

  const handleSmartBarSubmit = (parsed: SmartBarResult) => {
    if (!parsed) return
    toast.success(`Smart Bar: Submitted ${parsed.type.toLowerCase().replace('_', ' ')} command`)
    setQuery('')
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Navigate, search patients, quick actions">
      <CommandInput
        placeholder="Search navigation, patients, smart clinical syntax (e.g. bp 120/80, rx amoxicillin)..."
        value={query}
        onValueChange={setQuery}
      />
      {smartBarResult && (
        <div className="px-3">
          <SmartBarPreviewCard
            result={smartBarResult}
            onSubmit={handleSmartBarSubmit}
            onDismiss={() => setQuery('')}
          />
        </div>
      )}
      <CommandList>

        <CommandEmpty>{searching ? 'Searching…' : 'No results.'}</CommandEmpty>
        {navItems.length > 0 && (
          <CommandGroup heading="Navigation">
            {navItems.map((item) => {
              const Icon = iconForHref(item.href)
              return (
                <CommandItem
                  key={item.href}
                  value={`${item.title} ${item.href}`}
                  onSelect={() => go(item.href)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {item.title}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
        {patients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Patients">
              {patients.map((p) => {
                const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Patient'
                return (
                  <CommandItem
                    key={p.id}
                    value={`patient ${name} ${p.mrn || ''} ${p.id}`}
                    onSelect={() => go(`/dashboard/doctor/patients/${p.id}`)}
                  >
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{name}</span>
                    {p.mrn ? (
                      <span className="ml-2 text-xs text-muted-foreground">MRN {p.mrn}</span>
                    ) : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          {QUICK_ACTIONS.map((a) => (
            <CommandItem
              key={a.href}
              value={`${a.label} ${a.keywords || ''}`}
              onSelect={() => go(a.href)}
            >
              <a.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
