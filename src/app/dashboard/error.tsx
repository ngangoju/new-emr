"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, HomeIcon } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error)
  }, [error])

  const isAuthError =
    error?.message?.toLowerCase().includes("unauthorized") ||
    error?.message?.toLowerCase().includes("forbidden") ||
    error?.message?.toLowerCase().includes("permission")

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center animate-fade-in">
      <div className="p-6 max-w-md w-full bg-card border rounded-lg shadow-lg space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {isAuthError ? "Access Denied" : "Something went wrong"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isAuthError
              ? "You may not have permission to view this page. Try returning to your dashboard."
              : "We encountered an error while loading this section."}
          </p>
        </div>
        {!isAuthError && error?.message && (
          <div className="p-4 bg-muted/50 rounded-md text-left overflow-auto max-h-32 text-xs font-mono text-muted-foreground border">
            {error.message}
          </div>
        )}
        {isAuthError ? (
          <Button asChild className="w-full" size="lg">
            <Link href="/dashboard">
              <HomeIcon className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        ) : (
          <Button onClick={reset} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
