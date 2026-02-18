'use client'

import React, { useState, useEffect } from 'react'
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
import { Check, ChevronsUpDown, Search, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PatientSelectorProps {
  onSelect: (patient: Patient) => void
  selectedPatientId?: string
}

export function PatientSelector({ onSelect, selectedPatientId }: PatientSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const { data: patientsData, isLoading } = usePatients({
    query: searchQuery,
    limit: 10
  })

  const patients = patientsData?.data || []

  useEffect(() => {
    if (selectedPatientId && !selectedPatient) {
      // Find patient in list if already selected
      const found = patients.find((p: Patient) => p.id === selectedPatientId)
      if (found) setSelectedPatient(found)
    } else if (!selectedPatientId && selectedPatient) {
      setSelectedPatient(null)
    }
  }, [selectedPatientId, patients, selectedPatient])

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            preserveSpaces
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Searching..." : "No patients found."}
            </CommandEmpty>
            <CommandGroup>
              {patients.map((patient: Patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.id}
                  onSelect={() => {
                    setSelectedPatient(patient)
                    onSelect(patient)
                    setOpen(false)
                  }}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Search className="h-2 w-2" /> ID: {patient.id.slice(0, 8)}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedPatientId === patient.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
