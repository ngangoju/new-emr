'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useClinicalStaff } from '@/hooks/api/useClinicalStaff'
import { cn } from '@/lib/utils'

interface DoctorSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function DoctorSelector({
  value,
  onValueChange,
  placeholder = 'Select a doctor',
}: DoctorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, refetch } = useClinicalStaff({
    role: 'DOCTOR',
    search,
    page: 0,
    size: 20,
    enabled: open,
  })

  const doctors = data?.data ?? []
  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === value),
    [doctors, value],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedDoctor?.fullName || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search doctor by name..."
            preserveSpaces
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading doctors...
              </div>
            ) : isError ? (
              <div className="space-y-2 p-3 text-sm text-destructive">
                <p>Failed to load doctors.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : doctors.length === 0 ? (
              <CommandEmpty>No doctors available</CommandEmpty>
            ) : (
              <CommandGroup>
                {doctors.map((doctor) => (
                  <CommandItem
                    key={doctor.id}
                    value={doctor.id}
                    onSelect={() => {
                      onValueChange(doctor.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === doctor.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {doctor.fullName}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
