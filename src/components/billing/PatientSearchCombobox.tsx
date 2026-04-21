'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { usePatients } from '@/hooks/api/usePatients'
import type { Patient } from '@/types/patient'
import { maskIdentifier, maskPhoneNumber } from '@/lib/utils/masking'

interface PatientSearchComboboxProps {
  value: string
  onSelect: (patient: Patient) => void
}

export function PatientSearchCombobox({ value, onSelect }: PatientSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: patientsData } = usePatients({ query: search })
  const patients = patientsData?.data || []

  const getPatientDisplayName = (patient: Patient) => {
    const firstName = (patient as unknown as { firstName?: string }).firstName?.trim()
    const lastName = (patient as unknown as { lastName?: string }).lastName?.trim()
    const fullName = patient.fullName?.trim()

    if (fullName) return fullName
    if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(' ')
    return 'Unknown patient'
  }

  const getPatientDisplayNumber = (patient: Patient) => {
    const nationalId = patient.nationalId?.trim()
    const phone = patient.phone?.trim()
    const phoneNumber = (patient as unknown as { phoneNumber?: string }).phoneNumber?.trim()

    // Mask sensitive identifiers - prioritize phone (less sensitive) over national ID
    if (phone) return maskPhoneNumber(phone) || phone
    if (phoneNumber) return maskPhoneNumber(phoneNumber) || phoneNumber
    if (nationalId) return maskIdentifier(nationalId) || nationalId
    return 'No phone/ID'
  }

  const selectedPatient = patients.find((p: Patient) => p.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[350px] justify-between truncate"
        >
          {selectedPatient ? (
            <>
              {getPatientDisplayName(selectedPatient)}
              <span className="ml-2 text-muted-foreground text-xs">
                {getPatientDisplayNumber(selectedPatient)}
              </span>
            </>
          ) : (
            'Select patient...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search patient by name or ID..."
            preserveSpaces
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No patients found.</CommandEmpty>
            <CommandGroup>
              {patients.map((patient: Patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.fullName}
                  onSelect={() => {
                    onSelect(patient)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === patient.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div>
                    <div className="font-medium">{getPatientDisplayName(patient)}</div>
                    <div className="text-xs text-muted-foreground">
                      Number: {getPatientDisplayNumber(patient)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
