import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaymentMethod } from '@/types/billing'

export interface PaymentMethodsSelectProps {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
}

export function PaymentMethodsSelect({
  value,
  onChange,
}: PaymentMethodsSelectProps) {
  const methods: PaymentMethod[] = ['cash', 'card', 'mobile_money', 'insurance']

  return (
    <Select value={value} onValueChange={onChange as any}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select payment method" />
      </SelectTrigger>
      <SelectContent>
        {methods.map((method) => (
          <SelectItem key={method} value={method}>
            {method.replace('_', ' ').toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}