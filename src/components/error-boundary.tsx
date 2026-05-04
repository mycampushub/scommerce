'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Client-side Error Boundary component
 * Catches JavaScript errors in child component tree, logs them, and displays a fallback UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center p-4 min-h-[200px]">
          <Card className="max-w-md w-full border-0 shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simple error fallback component for use with ErrorBoundary
 */
export function ErrorFallback({
  error,
  onReset,
  title = "Something went wrong",
}: {
  error?: Error
  onReset?: () => void
  title?: string
}) {
  return (
    <div className="flex items-center justify-center p-4 min-h-[200px]">
      <Card className="max-w-md w-full border-0 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>
            {error?.message || 'An unexpected error occurred'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <Button
            variant="outline"
            onClick={() => {
              if (onReset) {
                onReset()
              } else {
                window.location.reload()
              }
            }}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
