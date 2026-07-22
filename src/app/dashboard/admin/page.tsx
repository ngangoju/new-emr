'use client'

import Link from 'next/link'
import { Building2, Bed, Users, Shield, FileText, Settings, ArrowRight, LayoutDashboard, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { useWards, useBeds } from '@/hooks/useWardManagement'
import { useUsers } from '@/hooks/useUsers'
import { useRoles } from '@/hooks/useRoles'
import { useTariffs } from '@/hooks/useTariffs'
import { useEffect } from 'react'

interface AdminCard {
  title: string
  description: string
  href: string
  icon: React.ElementType
  accentClass: string        // border-l colour
  iconBgClass: string        // icon container bg
  iconColorClass: string     // icon fill/stroke colour
  badgeBgClass: string       // count badge bg
  count?: number | null
  countLabel: string         // label next to count
  staticValue?: string       // shown instead of count when no data (e.g. Settings)
}

function CountBadge({
  count,
  bgClass,
}: {
  count?: number | null
  bgClass: string
}) {
  if (count == null) return null
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-full text-xs font-bold text-white tabular-nums',
        bgClass,
      )}
    >
      {count}
    </span>
  )
}

export default function AdminPage() {
  // Live data hooks
  const wardsQuery   = useWards()
  const bedsQuery    = useBeds()
  const { stats: userStats, loading: usersLoading } = useUsers()
  const { roles, fetchRoles } = useRoles()
  const tariffsQuery = useTariffs()

  // Roles uses manual fetch pattern
  useEffect(() => {
    fetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cards: AdminCard[] = [
    {
      title: 'Wards',
      description: 'Hospital ward management',
      href: '/dashboard/admin/wards',
      icon: Building2,
      accentClass: 'border-l-primary',
      iconBgClass: 'bg-success-muted',
      iconColorClass: 'text-success',
      badgeBgClass: 'bg-success',
      count: wardsQuery.isLoading ? null : (wardsQuery.data?.length ?? 0),
      countLabel: 'wards',
    },
    {
      title: 'Beds',
      description: 'Bed allocation and tracking',
      href: '/dashboard/admin/beds',
      icon: Bed,
      accentClass: 'border-l-info',
      iconBgClass: 'bg-info-muted',
      iconColorClass: 'text-info',
      badgeBgClass: 'bg-info',
      count: bedsQuery.isLoading ? null : (bedsQuery.data?.length ?? 0),
      countLabel: 'beds',
    },
    {
      title: 'Users',
      description: 'User accounts and access',
      href: '/dashboard/admin/users',
      icon: Users,
      accentClass: 'border-l-muted-foreground',
      iconBgClass: 'bg-muted',
      iconColorClass: 'text-muted-foreground',
      badgeBgClass: 'bg-muted-foreground',
      count: usersLoading ? null : (userStats.total ?? 0),
      countLabel: 'users',
    },
    {
      title: 'Roles',
      description: 'Role permissions',
      href: '/dashboard/admin/roles',
      icon: Shield,
      accentClass: 'border-l-warning',
      iconBgClass: 'bg-warning-muted',
      iconColorClass: 'text-warning',
      badgeBgClass: 'bg-warning',
      count: roles.length > 0 ? roles.length : null,
      countLabel: 'roles',
    },
    {
      title: 'Tariffs',
      description: 'Service pricing',
      href: '/dashboard/admin/tariffs',
      icon: FileText,
      accentClass: 'border-l-success',
      iconBgClass: 'bg-success-muted',
      iconColorClass: 'text-success',
      badgeBgClass: 'bg-success',
      count: tariffsQuery.isLoading ? null : (tariffsQuery.data?.data.length ?? 0),
      countLabel: 'tariffs',
    },
    {
      title: 'Tenants',
      description: 'Multi-tenant clinics',
      href: '/dashboard/admin/tenants',
      icon: Building2,
      accentClass: 'border-l-primary',
      iconBgClass: 'bg-primary/10',
      iconColorClass: 'text-primary',
      badgeBgClass: 'bg-primary',
      count: null,
      countLabel: 'multi-tenant',
    },
    {
      title: 'DHIS2 Export',
      description: 'HMIS data export to DHIS2',
      href: '/dashboard/admin/dhis2',
      icon: BarChart3,
      accentClass: 'border-l-green-600',
      iconBgClass: 'bg-green-500/10',
      iconColorClass: 'text-green-600',
      badgeBgClass: 'bg-green-500',
      count: null,
      countLabel: 'export',
    },
    {
      title: 'Settings',
      description: 'Application settings',
      href: '/dashboard/settings',
      icon: Settings,
      accentClass: 'border-l-critical',
      iconBgClass: 'bg-critical-muted',
      iconColorClass: 'text-critical',
      badgeBgClass: 'bg-critical',
      count: undefined,
      countLabel: '',
      staticValue: 'Config',
    },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* ── Page Header ── */}
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-muted shrink-0">
          <LayoutDashboard className="h-6 w-6 text-success" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground leading-tight">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">
            System overview with key metrics, comprehensive user management, and interactive reports &amp; analytics.
          </p>
        </div>
      </header>

      {/* ── Navigation Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href} className="group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
              <div
                className={cn(
                  // base layout
                  'relative flex flex-col overflow-hidden rounded-xl bg-card',
                  // left accent band
                  'border border-border border-l-4',
                  card.accentClass,
                  // shadow & hover transitions
                  'shadow-sm transition-all duration-200 ease-out',
                  'group-hover:shadow-lg group-hover:-translate-y-1',
                  'cursor-pointer',
                )}
              >
                {/* Top row: icon + count badge */}
                <div className="flex items-start justify-between px-4 pt-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
                      card.iconBgClass,
                    )}
                  >
                    <Icon className={cn('h-4.5 w-4.5', card.iconColorClass)} strokeWidth={2} />
                  </div>

                  {/* Count badge or static label */}
                  {card.staticValue ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {card.staticValue}
                    </span>
                  ) : (
                    <CountBadge count={card.count} bgClass={card.badgeBgClass} />
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                  <h2 className="font-heading text-base font-semibold text-foreground leading-tight">
                    {card.title}
                  </h2>

                  {/* Count as big stat */}
                  {card.count != null && (
                      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                      {card.count}
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {card.countLabel}
                      </span>
                    </p>
                  )}

                  <p className={cn('text-xs text-muted-foreground', card.count != null ? 'mt-1' : 'mt-1.5')}>
                    {card.description}
                  </p>

                  {/* CTA row */}
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium transition-colors duration-150"
                    style={{ color: card.iconColorClass.replace('text-[', '').replace(']', '') }}>
                    <span className={cn(card.iconColorClass)}>Manage</span>
                    <ArrowRight
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1',
                        card.iconColorClass,
                      )}
                    />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Existing AdminDashboard sections (stats, user table, health, reports) ── */}
      <AdminDashboard />
    </div>
  )
}
