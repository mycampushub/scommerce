'use client'

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Home, Bug } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error caught by error boundary:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Something Went Wrong
            </CardTitle>
            <CardDescription className="text-base">
              An unexpected error occurred while loading this page.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2">
                {error.message || "An unknown error occurred"}
              </AlertDescription>
              {error.digest && (
                <AlertDescription className="mt-2 text-xs">
                  Error ID: {error.digest}
                </AlertDescription>
              )}
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                We apologize for the inconvenience. Please try again or contact support if the problem persists.
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
              asChild
              className="flex-1 gap-2 bg-pink-600 hover:bg-pink-700"
            >
              <a href="/">
                <Home className="w-4 h-4" />
                Go Home
              </a>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
