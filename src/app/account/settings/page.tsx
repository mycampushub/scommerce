'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Suspense } from 'react'

function EmailChangeHandler() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('emailChanged') === 'true') {
      toast.success('Email address changed successfully!')
      window.history.replaceState({}, '', '/account/settings')
    }
  }, [searchParams])

  return null
}

export default function AccountSettingsPage() {
  const router = useRouter()
  const { user, checkSession } = useAuth()
  const [activeTab, setActiveTab] = useState<'password' | 'email'>('password')
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // Email change state
  const [password, setEmailPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to change password')
      }

      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Change password error:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)

    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, newEmail, confirmEmail }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to request email change')
      }

      toast.success('Verification email sent to your new email address')
      setNewEmail('')
      setConfirmEmail('')
      setEmailPassword('')
      setEmailChangeSuccess(true)
    } catch (error: any) {
      console.error('Change email error:', error)
      toast.error(error.message || 'Failed to request email change')
    } finally {
      setEmailLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <EmailChangeHandler />
      </Suspense>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account settings and security</p>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Sidebar */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <UserIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'password' | 'email')} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Change Password</TabsTrigger>
              <TabsTrigger value="email">Change Email</TabsTrigger>
            </TabsList>

            {/* Change Password Tab */}
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Secure your account by updating your password regularly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          placeholder="At least 8 characters"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {newPassword && newPassword.length < 8 && (
                        <p className="text-xs text-orange-600 mt-1">Password must be at least 8 characters</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword && newPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8 || confirmPassword !== newPassword}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                    >
                      {passwordLoading ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Change Email Tab */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Change Email Address
                  </CardTitle>
                  <CardDescription>
                    Update your email address. A verification link will be sent to your new email.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emailChangeSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Check Your New Email</h3>
                        <p className="text-gray-600">
                          We have sent a verification link to your new email address. Please click the link to complete the email change.
                        </p>
                      </div>
                      <Button
                        onClick={() => setEmailChangeSuccess(false)}
                        variant="outline"
                      >
                        Request Another Change
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleChangeEmail} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showEmailPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setEmailPassword(e.target.value)}
                            required
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-email">New Email Address</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          required
                          placeholder="Enter your new email address"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-email">Confirm New Email</Label>
                        <Input
                          id="confirm-email"
                          type="email"
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          required
                          placeholder="Confirm your new email address"
                        />
                        {confirmEmail && newEmail && confirmEmail !== newEmail && (
                          <p className="text-xs text-red-600 mt-1">Email addresses do not match</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={emailLoading || !password || !newEmail || !confirmEmail || newEmail !== confirmEmail}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                      >
                        {emailLoading ? 'Sending...' : 'Send Verification Email'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
