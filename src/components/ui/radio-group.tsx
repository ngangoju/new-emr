import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
  name?: string
  value?: string
  onValueChange?: (value: string) => void
} | undefined>(undefined)

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
    name?: string
  }
>(({ className, value, onValueChange, name, ...props }, ref) => {
  const generatedName = React.useId()
  return (
    <RadioGroupContext.Provider value={{ name: name || generatedName, value, onValueChange }}>
      <div className={cn("grid gap-2", className)} role="radiogroup" ref={ref} {...props} />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { value: string }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  
  if (!context) {
    throw new Error("RadioGroupItem must be used within a RadioGroup")
  }

  const isChecked = context.value === value

  return (
    <input
      ref={ref}
      type="radio"
      name={context.name}
      value={value}
      checked={isChecked}
      onChange={() => context.onValueChange?.(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
