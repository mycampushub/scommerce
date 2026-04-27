'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ResetPasswordTokenHandler from '@/components/reset-password-token-handler'

function ResetPasswordContent({ onToken }: { onToken: (token: string) => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (token) {
      setSuccess(false)
    }
  }, [token])

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setSuccess(true)
      toast({
        title: 'Success',
        description: 'Password has been reset successfully. You can now login.',
      })

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to reset password')
      toast({
        title: 'Error',
        description: err.message || 'Failed to reset password',
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
          <p className="text-gray-600 mt-2">Set your new password</p>
        </div>

        {/* Reset Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              {success
                ? 'Your password has been reset'
                : 'Enter your new password below'}
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
                    Password Reset Successful!
                  </p>
                  <p className="text-sm text-gray-600">
                    Your password has been updated. You will be redirected to the login page shortly.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Token Display */}
                {!token && (
                  <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Invalid or missing reset token. Please{' '}
                      <Link href="/forgot-password" className="text-pink-600 hover:underline">
                        request a new password reset
                      </Link>
                    </span>
                  </div>
                )}

                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading || !token}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading || !token}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <div
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Password strength: {newPassword.length >= 8 ? 'Strong' : 'Weak'}
                    </p>
                  </div>
                )}

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
                  disabled={loading || !token}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              <Link
                href="/login"
                className="text-pink-600 hover:text-pink-700 hover:underline inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
            <div className="text-sm text-center">
              <p className="text-gray-600">
                Remembered your password?{' '}
                <Link
                  href="/login"
                  className="text-pink-600 hover:text-pink-700 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-pink-600 mx-auto" />
      </div>
    }>
      <ResetPasswordTokenHandler onToken={(token) => {
        window.__RESET_PASSWORD_TOKEN__ = token
      }} />
      <ResetPasswordContent onToken={(token) => {
        const savedToken = typeof window !== 'undefined' ? window.__RESET_PASSWORD_TOKEN__ : null
        if (savedToken) {
          onToken(savedToken)
          delete window.__RESET_PASSWORD_TOKEN__
        }
      }} />
    </Suspense>
  )
}
