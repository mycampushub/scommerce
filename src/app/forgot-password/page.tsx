'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to request password reset')
      }

      setSuccess(true)
      toast({
        title: 'Success',
        description: data.message || 'If an account exists, you will receive a password reset email.',
      })

      // Show reset link in development mode
      if (data.resetLink && process.env.NODE_ENV === 'development') {
        console.log('Password Reset Link:', data.resetLink)
      }
    } catch (err: any) {
      console.error('Password reset request error:', err)
      setError(err.message || 'Failed to request password reset')
      toast({
        title: 'Error',
        description: err.message || 'Failed to request password reset',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-pink-600">FashionStore</h1>
          </Link>
          <p className="text-gray-600 mt-2">Reset your password</p>
        </div>

        {/* Forgot Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              {success
                ? 'Check your email for a password reset link'
                : 'Enter your email address and we\'ll send you a link to reset your password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-2">
                    Reset link sent!
                  </p>
                  <p className="text-sm text-gray-600">
                    We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => {
                        setSuccess(false)
                        setEmail('')
                      }}
                      className="text-pink-600 hover:underline"
                      disabled={loading}
                    >
                      try again
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    We'll send a reset link to this email address
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              <Link
                href="/login"
                className="text-pink-600 hover:text-pink-700 hover:underline"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
