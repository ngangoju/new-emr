"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App route error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center animate-fade-in">
      <div className="p-6 max-w-md w-full bg-card border rounded-lg shadow-lg space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground text-sm">
            We encountered an unexpected error while loading this page.
          </p>
        </div>
        {error?.message && (
          <div className="p-4 bg-muted/50 rounded-md text-left overflow-auto max-h-32 text-xs font-mono text-muted-foreground border">
            {error.message}
          </div>
        )}
        <Button onClick={reset} className="w-full" size="lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
