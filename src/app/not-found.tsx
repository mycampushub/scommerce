'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center">
            <span className="text-5xl font-bold text-pink-600">404</span>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-base">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Error 404 - Resource not found
            </p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>You can try:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Checking the URL for typos</li>
              <li>Going back to the previous page</li>
              <li>Navigating to our home page</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history) {
                window.history.back()
              }
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Link href="/" className="flex-1">
            <Button className="w-full gap-2 bg-pink-600 hover:bg-pink-700">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}