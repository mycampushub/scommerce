'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface SiteSettings {
  siteName: string
  siteLogo?: string
  currency: string
  currencySymbol: string
  taxRate: number
  freeShippingThreshold: number
  baseShippingCost: number
  contactEmail?: string
  contactPhone?: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'SCommerce',
    currency: 'BDT',
    currencySymbol: '৳',
    taxRate: 0.18,
    freeShippingThreshold: 5000,
    baseShippingCost: 150,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true)
        const response = await fetch('/api/settings')
        const data = await response.json()
        if (data.success && data.data) {
          setSettings(data.data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Settings saved successfully!')
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      siteName: 'SCommerce',
      currency: 'BDT',
      currencySymbol: '৳',
      taxRate: 0.18,
      freeShippingThreshold: 5000,
      baseShippingCost: 150,
    })
    toast.info('Settings reset to defaults. Click Save to apply.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Settings</h1>
        <p className="text-gray-600">
          Manage your store settings, currency, and shipping preferences.
        </p>
      </div>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure your store's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  placeholder="SCommerce"
                  className="max-w-md"
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value.toUpperCase() })}
                  placeholder="BDT"
                  maxLength={3}
                  className="max-w-md"
                />
                <p className="text-sm text-gray-500 mt-1">
                  3-letter currency code (e.g., USD, EUR, BDT)
                </p>
              </div>

              <div>
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  placeholder="৳"
                  maxLength={3}
                  className="max-w-md"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Symbol displayed before prices (e.g., $, €, £, ৳)
                </p>
              </div>

              <div>
                <Label htmlFor="siteLogo">Site Logo URL</Label>
                <Input
                  id="siteLogo"
                  value={settings.siteLogo || ''}
                  onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                  placeholder="/logo.svg"
                  className="max-w-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax & Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Tax & Shipping</CardTitle>
              <CardDescription>
                Configure tax rates and shipping costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taxRate">Tax Rate</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0.18"
                    className="max-w-32"
                  />
                  <span className="text-gray-600">
                    ({(settings.taxRate * 100).toFixed(0)}%)
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Tax rate as decimal (0.18 = 18%)
                </p>
              </div>

              <div>
                <Label htmlFor="baseShippingCost">Base Shipping Cost</Label>
                <Input
                  id="baseShippingCost"
                  type="number"
                  step="1"
                  min="0"
                  value={settings.baseShippingCost}
                  onChange={(e) => setSettings({ ...settings, baseShippingCost: parseFloat(e.target.value) || 0 })}
                  placeholder="150"
                  className="max-w-32"
                />
              </div>

              <div>
                <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  step="1"
                  min="0"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                  placeholder="5000"
                  className="max-w-32"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Orders above this amount get free shipping
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Store contact details for customer support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail || ''}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  placeholder="contact@scommerce.com"
                  className="max-w-md"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={settings.contactPhone || ''}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  placeholder="+8801XXXXXXXXX"
                  className="max-w-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>

          {/* Preview Card */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
              <CardDescription>
                See how prices will appear to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Sample Product Price:</span>
                  <span className="font-semibold text-xl">
                    {settings.currencySymbol}1,299.00
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>With Discount ({settings.currencySymbol}1,000.00):</span>
                  <span className="font-semibold text-xl">
                    {settings.currencySymbol}1,299.00
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping ({settings.currencySymbol}{settings.baseShippingCost}):</span>
                  <span className="text-sm text-gray-600">
                    Free for orders over {settings.currencySymbol}{settings.freeShippingThreshold.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax ({(settings.taxRate * 100).toFixed(0)}%):</span>
                  <span className="text-sm text-gray-600">
                    Applied at checkout
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
    </div>
  )
}
