'use client'

import React, { useState, useEffect } from 'react'
import { Pill, Trash2, Search, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useFormularySearch, MedicationFormulary, AddMedicationPayload } from '@/hooks/api/useConsultations'
import { useDebounce } from '@/hooks/useDebounce'

interface StructuredMedicationEntryProps {
  onAdd: (med: AddMedicationPayload & { drugName: string }) => void;
  isLoading?: boolean;
}

export function StructuredMedicationEntry({ onAdd, isLoading }: StructuredMedicationEntryProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const searchMutation = useFormularySearch()
  const [results, setResults] = useState<MedicationFormulary[]>([])

  const [selectedDrug, setSelectedDrug] = useState<MedicationFormulary | null>(null)
  const [formData, setFormData] = useState<Omit<AddMedicationPayload, 'formularyId'>>({
    dose: "",
    route: "Oral",
    frequency: "Once daily",
    duration: "5 days",
    indication: ""
  })

  // Perform search when debounced search changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      searchMutation.mutate(debouncedSearch, {
        onSuccess: (data) => setResults(data || [])
      })
    } else {
      setResults([])
    }
  }, [debouncedSearch])

  const handleAdd = () => {
    if (!selectedDrug) return;
    onAdd({
      formularyId: selectedDrug.id,
      drugName: selectedDrug.genericName,
      ...formData
    });
    // Reset
    setSelectedDrug(null);
    setFormData({
      dose: "",
      route: "Oral",
      frequency: "Once daily",
      duration: "5 days",
      indication: ""
    });
    setSearch("");
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-bold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Search Hospital Formulary (Item 1)
          </Label>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white text-left font-normal"
              >
                {selectedDrug ? `${selectedDrug.brandName || selectedDrug.genericName} (${selectedDrug.strength})` : "Type drug name or generic..."}
                <Pill className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search medications..." 
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandEmpty>No medications found.</CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    {results.map((drug) => (
                      <CommandItem
                        key={drug.id}
                        value={drug.id}
                        onSelect={() => {
                          setSelectedDrug(drug)
                          setOpen(false)
                        }}
                        className="flex flex-col items-start py-3 cursor-pointer"
                      >
                        <div className="flex justify-between w-full">
                          <span className="font-bold">{drug.genericName}</span>
                          <Badge variant="outline" className="text-[10px]">{drug.category}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {drug.brandName && `${drug.brandName} • `}{drug.strength} • {drug.form}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedDrug && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-lg border-2 border-primary/10 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label className="text-xs">Dose</Label>
              <Input 
                placeholder="e.g. 500mg" 
                value={formData.dose}
                onChange={e => setFormData({...formData, dose: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Route</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={formData.route}
                onChange={e => setFormData({...formData, route: e.target.value})}
              >
                <option>Oral</option>
                <option>IV</option>
                <option>IM</option>
                <option>SC</option>
                <option>Topical</option>
                <option>Inhaled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Frequency</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border text-sm"
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value})}
              >
                <option>Once daily (QD)</option>
                <option>Twice daily (BID)</option>
                <option>Three times daily (TID)</option>
                <option>Four times daily (QID)</option>
                <option>As needed (PRN)</option>
                <option>Stat (Immediately)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Duration</Label>
              <Input 
                placeholder="e.g. 7 days" 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-xs">Indication / Notes</Label>
              <Input 
                placeholder="e.g. For pneumonia" 
                value={formData.indication}
                onChange={e => setFormData({...formData, indication: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full h-10 bg-primary font-bold"
                onClick={handleAdd}
                disabled={!formData.dose || isLoading}
              >
                Add to Prescription
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
