"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, LayoutDashboard, ArrowLeft } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin error caught by error boundary:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-0 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Admin Error
          </CardTitle>
          <CardDescription className="text-base">
            Something went wrong while loading the admin panel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="mt-2">
              {error.message || "An unknown error occurred in the admin panel"}
            </AlertDescription>
            {error.digest && (
              <AlertDescription className="mt-2 text-xs">
                Error ID: {error.digest}
              </AlertDescription>
            )}
          </Alert>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              This is an unexpected error in the admin panel. Please try again or contact technical support if the problem persists.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={reset}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button
            className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
            onClick={() => window.location.href = "/admin"}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2"
            onClick={() => window.location.href = "/"}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
