'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
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
import { useTariffs } from '@/hooks/useTariffs'
import type { Tariff } from '@/types/billing'

interface TariffSearchComboboxProps {
  value: string
  onSelect: (tariff: Tariff) => void
}

export function TariffSearchCombobox({ value, onSelect }: TariffSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: tariffs = [], isLoading } = useTariffs({ search })

  const selectedTariff = tariffs.find((tariff) => tariff.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[350px] justify-between truncate"
        >
          {selectedTariff ? (
            <>
              {selectedTariff.serviceName}
              <span className="ml-2 text-muted-foreground">
                RWF {selectedTariff.basePrice.toLocaleString()}
              </span>
            </>
          ) : (
            'Select tariff...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search tariff by name or category..."
            preserveSpaces
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No tariffs found.</CommandEmpty>
            <CommandGroup>
              {tariffs.map((tariff) => (
                <CommandItem
                  key={tariff.id}
                  value={tariff.serviceName}
                  onSelect={() => {
                    onSelect(tariff)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === tariff.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {tariff.serviceName}
                  <div className="ml-auto text-xs text-muted-foreground">
                    {tariff.category.toUpperCase()}
                  </div>
                  <span className="ml-2 font-medium">
                    RWF {tariff.basePrice.toLocaleString()}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
