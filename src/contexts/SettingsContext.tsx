'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SiteSettings } from '@/db/settings.repository'

interface SettingsContextType {
  settings: SiteSettings
  isLoading: boolean
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const defaultSettings: SiteSettings = {
  id: 'default',
  siteName: 'SCommerce',
  currency: 'BDT',
  currencySymbol: '৳',
  taxRate: 0.18,
  freeShippingThreshold: 5000,
  baseShippingCost: 150,
  contactEmail: 'contact@scommerce.com',
  contactPhone: '+8801XXXXXXXXX',
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json()
      if (data.success && data.data) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshSettings = async () => {
    await fetchSettings()
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
