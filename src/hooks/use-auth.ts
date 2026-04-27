'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.success && data.data.user) {
        setUser(data.data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Session check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check session on mount
    checkSession()
  }, [checkSession])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (data.success) {
      setUser(data.data.user)
      return { success: true }
    } else {
      return { success: false, error: data.error }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isAdmin = user?.role === 'admin'

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    login,
    logout,
    checkSession,
  }
}
