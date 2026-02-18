'use client'

import * as React from 'react'
import { format, subDays } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface ReportDateRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  disabled?: boolean
}

export function ReportDateRangePicker({
  date,
  setDate,
  disabled
}: ReportDateRangeProps) {
  const [selectValue, setSelectValue] = React.useState('7d')

  const handlePresetChange = (value: string) => {
    setSelectValue(value)
    const today = new Date()
    
    switch (value) {
      case 'today':
        setDate({ from: today, to: today })
        break
      case 'yesterday':
        const yesterday = subDays(today, 1)
        setDate({ from: yesterday, to: yesterday })
        break
      case '7d':
        setDate({ from: subDays(today, 6), to: today })
        break
      case '30d':
        setDate({ from: subDays(today, 29), to: today })
        break
      case '90d':
        setDate({ from: subDays(today, 89), to: today })
        break
      default:
        break
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectValue}
        onValueChange={handlePresetChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="90d">Last 3 Months</SelectItem>
        </SelectContent>
      </Select>

      <div className={cn('grid gap-2', disabled && 'opacity-50 pointer-events-none')}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[260px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, 'LLL dd, y')} -{' '}
                    {format(date.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(date.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(val) => {
                setDate(val)
                setSelectValue('custom')
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
