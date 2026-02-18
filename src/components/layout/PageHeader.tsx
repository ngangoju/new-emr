import { cn } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  back?: boolean
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  back,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between pb-6 mb-8 border-b", className)} {...props}>
      <div className="flex items-center space-x-4">
        {back && (
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <div>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-lg mt-1 max-w-md">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-4">
          {children}
        </div>
      )}
    </div>
  )
}