import { cn } from "@/lib/utils"

interface ProgressProps {
  className?: string
  value: number
}

function Progress({ className, value, ...props }: ProgressProps) {
  const progressWidth = Math.min(Math.max(value, 0), 100)

  return (
    <div className={cn("relative h-3 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div 
        className="h-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ width: `${progressWidth}%` }}
      />
    </div>
  )
}

export { Progress }