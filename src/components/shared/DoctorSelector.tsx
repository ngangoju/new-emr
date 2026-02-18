'use client'

import React from 'react'
import { useUsers } from '@/hooks/useUsers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface DoctorSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function DoctorSelector({ value, onValueChange, placeholder = "Select a doctor" }: DoctorSelectorProps) {
  const { filteredUsers: doctors, loading } = useUsers({ role: 'DOCTOR', status: 'active' })

  if (loading) {
    return <Skeleton className="h-10 w-full" />
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {doctors.map((doctor) => (
          <SelectItem key={doctor.id} value={doctor.id}>
            Dr. {doctor.name}
          </SelectItem>
        ))}
        {doctors.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground text-center">
            No doctors available
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
