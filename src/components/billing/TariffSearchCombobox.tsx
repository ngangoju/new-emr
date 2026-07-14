'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
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
import { formatMoney } from '@/lib/format'

interface TariffSearchComboboxProps {
  value: string
  onSelect: (tariff: Tariff) => void
  excludeCategories?: string[]
}

export function TariffSearchCombobox({
  value,
  onSelect,
  excludeCategories = [],
}: TariffSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const uppercaseExcluded = excludeCategories.map((category) => category.toUpperCase())
  const { data, isLoading } = useTariffs({ search, page: 0, size: 20, excludeCategories: uppercaseExcluded })
  const tariffs = (data?.data ?? []).filter(
    (tariff) => !uppercaseExcluded.includes(tariff.category.toUpperCase()),
  )

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
                {formatMoney(selectedTariff.basePrice)}
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
            {isLoading ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tariffs...
              </div>
            ) : tariffs.length === 0 ? (
              <CommandEmpty>No tariffs found.</CommandEmpty>
            ) : (
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
                      {formatMoney(tariff.basePrice)}
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
