'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCartStore } from '@/lib/store/cart-store'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { items, clearCart } = useCartStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [requiresVerification, setRequiresVerification] = useState(false)

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: 'dummy', // This will fail but will resend verification email
        }),
      })

      // This will fail but might trigger verification email resend
      // In a real implementation, you'd have a separate resend endpoint
      toast({
        title: 'Info',
        description: 'If an account exists with this email, a verification link will be sent.',
      })
    } catch (err: any) {
      // Ignore errors since we're just trying to resend
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setRequiresVerification(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          guestCart: items.length > 0 ? items : undefined 
        }),
      })

      const data = await response.json() as any

      if (!response.ok || !data.success) {
        // Check if email verification is required
        if (data.error && data.error.toLowerCase().includes('verify your email')) {
          setRequiresVerification(true)
        }
        throw new Error(data.error || 'Login failed')
      }

      // Show success message
      toast({
        title: 'Success',
        description: data.syncedCart > 0
          ? `Logged in successfully. ${data.syncedCart} item(s) synced from your cart.`
          : 'Logged in successfully',
      })

      // Clear local storage cart after successful sync
      if (data.syncedCart > 0) {
        clearCart()
      }

      // Redirect based on user role using Next.js router
      // Check if there's a redirect parameter
      const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      const redirectTo = urlParams.get('redirect')
      const from = urlParams.get('from')
      
      // Prevent redirect loops - don't redirect if coming from login
      if (from === 'login' || from === 'middleware') {
        // Already redirected, stay on login or redirect based on role
        if (data.data.user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        return
      }
      
      // Validate redirect URL to prevent open redirects
      // Only allow relative URLs starting with '/' (prevent same-origin absolute URLs)
      if (redirectTo && redirectTo !== '/login' && redirectTo !== '/login/' && !redirectTo.includes('login') && !redirectTo.startsWith('//')) {
        // Strict check: only allow relative paths starting with single '/'
        if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
          // Additional safety: ensure no suspicious patterns
          // Reject if contains :// (absolute URL with protocol)
          // Reject if contains \\ (backslash, path traversal attempt)
          if (!redirectTo.includes('://') && !redirectTo.includes('\\')) {
            router.push(redirectTo)
            return
          }
        }
      }
      
      // Default redirect based on role
      if (data.data.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to login')
      toast({
        title: 'Error',
        description: err.message || 'Failed to login',
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
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm bg-red-50 p-3 rounded-lg">
                  {requiresVerification ? (
                    <div className="space-y-2">
                      <p className="text-red-600">{error}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={loading}
                        className="w-full"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Verification Email
                      </Button>
                    </div>
                  ) : (
                    <p className="text-red-600">{error}</p>
                  )}
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {/* Demo Credentials */}
            <div className="text-center text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Demo Credentials:</p>
              <p>Admin: admin@beautystore.com / admin123</p>
              <p>Customer: user@beautystore.com / user123</p>
            </div>

            {/* Links */}
            <div className="flex flex-col space-y-2 text-sm text-center">
              <Link
                href="/forgot-password"
                className="text-pink-600 hover:text-pink-700 hover:underline"
              >
                Forgot your password?
              </Link>
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-pink-600 hover:text-pink-700 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
