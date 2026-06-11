'use client'

import React, { useMemo, useState } from 'react'
import { usePatients, Patient } from '@/hooks/api/usePatients'
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
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PatientSelectorProps {
  onSelect: (patient: Patient) => void
  selectedPatientId?: string
  selectedPatient?: Patient | null
  admittedOnly?: boolean
}

export function PatientSelector({ onSelect, selectedPatientId, selectedPatient: selectedPatientProp, admittedOnly = false }: PatientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [locallySelectedPatient, setLocallySelectedPatient] = useState<Patient | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
    }, 300)
  }

  const { data: patientsData, isLoading } = usePatients({
    query: debouncedQuery,
    limit: 20,
    admitted: admittedOnly,
    enabled: open,
  })

  const patients = useMemo(() => patientsData?.data || [], [patientsData])

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null

    if (selectedPatientProp?.id === selectedPatientId) return selectedPatientProp

    const found = patients.find((p: Patient) => p.id === selectedPatientId)
    if (found) return found

    return locallySelectedPatient?.id === selectedPatientId ? locallySelectedPatient : null
  }, [locallySelectedPatient, patients, selectedPatientId, selectedPatientProp])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      // Reset search state when closing so it's clean on next open
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSearchQuery('')
      setDebouncedQuery('')
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10"
        >
          {selectedPatient 
            ? `${selectedPatient.firstName} ${selectedPatient.lastName}` 
            : "Search/Select Patient..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search patient name or ID..." 
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : patients.length === 0 ? (
              <CommandEmpty>
                {debouncedQuery ? `No patients found for "${debouncedQuery}".` : 'No patients found.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {patients.map((patient: Patient) => (
                  <CommandItem
                    key={patient.id}
                    value={patient.id}
                    onSelect={() => {
                      setLocallySelectedPatient(patient)
                      onSelect(patient)
                      setOpen(false)
                    }}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {patient.firstName[0]}{patient.lastName[0]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{patient.firstName} {patient.lastName}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Search className="h-2 w-2 shrink-0" /> ID: {patient.id.slice(0, 8)}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                      )}
                    />
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
