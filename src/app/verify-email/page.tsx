'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    if (token) {
      verifyEmail(token)
    } else {
      setLoading(false)
      setError('Invalid or missing verification token. Please request a new verification email.')
    }
  }, [])

  const verifyEmail = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify email')
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Email verification error:', err)
      setSuccess(false)
      setError(err.message || 'Failed to verify email')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-pink-600">FashionStore</h1>
          </Link>
          <p className="text-gray-600 mt-2">Email Verification</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {loading ? 'Verifying...' : success ? 'Email Verified!' : 'Verification Failed'}
            </CardTitle>
            <CardDescription>
              {loading
                ? 'Please wait while we verify your email address'
                : success
                  ? 'Your email has been successfully verified'
                  : "We couldn't verify your email address"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto" />
              </div>
            ) : success ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-2">
                    Email Verified Successfully!
                  </p>
                  <p className="text-sm text-gray-600">
                    Your email has been verified. You can now log in to your account.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium mb-2">
                    Verification Failed
                  </p>
                  <p className="text-sm text-gray-600">
                    {error || 'The verification link is invalid or has expired.'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please contact support or{' '}
                    <Link href="/register" className="text-pink-600 hover:underline">
                      register again
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center">
              <Button
                onClick={success ? handleGoToLogin : handleBackToHome}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {success ? 'Go to Login' : 'Back to Home'}
              </Button>
            </div>
            {!success && (
              <div className="text-sm text-center">
                <p className="text-gray-600">
                  Need a new verification?{' '}
                  <Link
                    href="/register"
                    className="text-pink-600 hover:text-pink-700 hover:underline"
                  >
                    Register again
                  </Link>
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
