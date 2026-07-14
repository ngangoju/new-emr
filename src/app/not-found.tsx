import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HomeIcon } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center animate-fade-in">
      <div className="p-6 max-w-md w-full bg-card border rounded-lg shadow-lg space-y-6">
        <div className="space-y-2">
          <p className="text-6xl font-bold text-muted-foreground">404</p>
          <h2 className="text-xl font-semibold tracking-tight">Page not found</h2>
          <p className="text-muted-foreground text-sm">
            The page you are looking for does not exist or may have been moved.
          </p>
        </div>
        <Button asChild className="w-full" size="lg">
          <Link href="/">
            <HomeIcon className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
