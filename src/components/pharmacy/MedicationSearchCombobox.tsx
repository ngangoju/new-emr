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
import { useMedicationSearch } from '@/hooks/useMedications'
import type { Medication } from '@/types/pharmacy'

interface MedicationSearchComboboxProps {
  value: string
  onSelect: (medication: Medication) => void
  placeholder?: string
}

export function MedicationSearchCombobox({
  value,
  onSelect,
  placeholder = 'Search medication...',
}: MedicationSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: medications = [], isLoading } = useMedicationSearch(search)

  const selectedMedication = medications.find((med) => med.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[350px] justify-between truncate"
          disabled={isLoading}
        >
          {selectedMedication ? (
            <>
              {selectedMedication.brandName}
              <span className="ml-2 text-muted-foreground text-xs">
                {selectedMedication.genericName} - {selectedMedication.strength}
              </span>
            </>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search medication by name or code..."
            preserveSpaces
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Searching...</CommandEmpty>
            ) : medications.length === 0 ? (
              <CommandEmpty>
                {search.length < 2
                  ? 'Type at least 2 characters to search'
                  : 'No medications found'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {medications.map((medication) => (
                  <CommandItem
                    key={medication.id}
                    value={`${medication.brandName} ${medication.genericName}`}
                    onSelect={() => {
                      onSelect(medication)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === medication.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{medication.brandName}</span>
                      <span className="text-xs text-muted-foreground">
                        {medication.genericName} | {medication.strength} | {medication.form}
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {medication.category}
                    </span>
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
