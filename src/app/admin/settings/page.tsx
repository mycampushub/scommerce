'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, CreditCard, Truck, Mail, BarChart3, Facebook, Twitter, Instagram, Youtube, Globe, CheckCircle2, XCircle } from 'lucide-react'

// Types
interface SiteSettings {
  id: string
  siteName: string
  siteLogo?: string
  currency: string
  currencySymbol: string
  taxRate: number
  freeShippingThreshold: number
  baseShippingCost: number
  contactEmail?: string
  contactPhone?: string
  socialMedia?: {
    facebook?: string
    instagram?: string
    twitter?: string
    youtube?: string
  }
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string
  }
}

// Integration Types
interface PaymentGateway {
  id: string
  name: string
  provider: string
  apiKey: string | null
  apiSecret: string | null
  webhookUrl: string | null
  isActive: boolean
  isDefault: boolean
  settings: string | null
  lastTested: string | null
  testStatus: string | null
  createdAt: string
  updatedAt: string
}

interface ShippingCarrier {
  id: string
  name: string
  provider: string
  apiKey: string | null
  apiSecret: string | null
  accountNumber: string | null
  webhookUrl: string | null
  isActive: boolean
  isDefault: boolean
  settings: string | null
  lastTested: string | null
  testStatus: string | null
  createdAt: string
  updatedAt: string
}

interface AnalyticsIntegration {
  id: string
  name: string
  provider: string
  trackingId: string | null
  apiKey: string | null
  pixelId: string | null
  isActive: boolean
  settings: string | null
  createdAt: string
  updatedAt: string
}

interface EmailService {
  id: string
  name: string
  provider: string
  apiKey: string | null
  apiSecret: string | null
  fromEmail: string | null
  fromName: string | null
  webhookUrl: string | null
  isActive: boolean
  isDefault: boolean
  settings: string | null
  lastTested: string | null
  testStatus: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  // Site Settings
  const [settings, setSettings] = useState<SiteSettings>({
    id: 'default',
    siteName: 'SCommerce',
    currency: 'BDT',
    currencySymbol: '৳',
    taxRate: 0.18,
    freeShippingThreshold: 5000,
    baseShippingCost: 150,
    contactEmail: 'contact@scommerce.com',
    contactPhone: '+8801XXXXXXXXX',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
    },
    seo: {
      metaTitle: 'SCommerce - Your Online Fashion Store',
      metaDescription: 'Discover the latest fashion trends at SCommerce. Shop sarees, salwar suits, lehengas, and more.',
      keywords: 'fashion, saree, salwar, lehenga, online shopping',
    },
  })

  // Integrations
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [shippingCarriers, setShippingCarriers] = useState<ShippingCarrier[]>([])
  const [analyticsIntegrations, setAnalyticsIntegrations] = useState<AnalyticsIntegration[]>([])
  const [emailServices, setEmailServices] = useState<EmailService[]>([])

  // Form states for integrations
  const [paymentForm, setPaymentForm] = useState({
    name: '',
    provider: 'stripe',
    apiKey: '',
    apiSecret: '',
    webhookUrl: ''
  })
  const [shippingForm, setShippingForm] = useState({
    name: '',
    provider: 'fedex',
    apiKey: '',
    apiSecret: '',
    accountNumber: '',
    webhookUrl: ''
  })
  const [analyticsForm, setAnalyticsForm] = useState({
    name: '',
    provider: 'google_analytics',
    trackingId: '',
    apiKey: '',
    pixelId: ''
  })
  const [emailForm, setEmailForm] = useState({
    name: '',
    provider: 'sendgrid',
    apiKey: '',
    apiSecret: '',
    fromEmail: '',
    fromName: '',
    webhookUrl: ''
  })

  // Fetch settings
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

  // Fetch integrations
  const fetchIntegrations = async () => {
    try {
      const [payments, shippings, analytics, emails] = await Promise.all([
        fetch('/api/admin/integrations/payment-gateways'),
        fetch('/api/admin/integrations/shipping-carriers'),
        fetch('/api/admin/integrations/analytics'),
        fetch('/api/admin/integrations/email-services')
      ])

      if (payments.ok) {
        const data = await payments.json()
        if (data.success) setPaymentGateways(data.data)
      }
      if (shippings.ok) {
        const data = await shippings.json()
        if (data.success) setShippingCarriers(data.data)
      }
      if (analytics.ok) {
        const data = await analytics.json()
        if (data.success) setAnalyticsIntegrations(data.data)
      }
      if (emails.ok) {
        const data = await emails.json()
        if (data.success) setEmailServices(data.data)
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
    }
  }

  useEffect(() => {
    fetchIntegrations()
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
      id: 'default',
      siteName: 'SCommerce',
      currency: 'BDT',
      currencySymbol: '৳',
      taxRate: 0.18,
      freeShippingThreshold: 5000,
      baseShippingCost: 150,
      contactEmail: 'contact@scommerce.com',
      contactPhone: '+8801XXXXXXXXX',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
      },
      seo: {
        metaTitle: 'SCommerce - Your Online Fashion Store',
        metaDescription: 'Discover the latest fashion trends at SCommerce. Shop sarees, salwar suits, lehengas, and more.',
        keywords: 'fashion, saree, salwar, lehenga, online shopping',
      },
    })
    toast.info('Settings reset to defaults. Click Save to apply.')
  }

  // Test integration
  const testIntegration = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/${type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || 'Test successful')
        fetchIntegrations()
      } else {
        toast.error(data.error || 'Test failed')
      }
    } catch (error) {
      toast.error('Test failed')
    }
  }

  // Set default integration
  const setDefault = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/${type}/${id}/set-default`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Default updated')
        fetchIntegrations()
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  // Delete integration
  const deleteIntegration = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return

    try {
      const response = await fetch(`/api/admin/integrations/${type}/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Integration deleted')
        fetchIntegrations()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  // Save payment gateway
  const savePaymentGateway = async () => {
    try {
      const response = await fetch('/api/admin/integrations/payment-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          isActive: true,
          isDefault: paymentGateways.length === 0
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Payment gateway added')
        setPaymentForm({ name: '', provider: 'stripe', apiKey: '', apiSecret: '', webhookUrl: '' })
        fetchIntegrations()
      } else {
        toast.error(data.error || 'Failed to add payment gateway')
      }
    } catch (error) {
      toast.error('Failed to add payment gateway')
    }
  }

  // Save shipping carrier
  const saveShippingCarrier = async () => {
    try {
      const response = await fetch('/api/admin/integrations/shipping-carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shippingForm,
          isActive: true,
          isDefault: shippingCarriers.length === 0
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Shipping carrier added')
        setShippingForm({ name: '', provider: 'fedex', apiKey: '', apiSecret: '', accountNumber: '', webhookUrl: '' })
        fetchIntegrations()
      } else {
        toast.error(data.error || 'Failed to add shipping carrier')
      }
    } catch (error) {
      toast.error('Failed to add shipping carrier')
    }
  }

  // Save analytics integration
  const saveAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/integrations/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...analyticsForm,
          isActive: true
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Analytics integration added')
        setAnalyticsForm({ name: '', provider: 'google_analytics', trackingId: '', apiKey: '', pixelId: '' })
        fetchIntegrations()
      } else {
        toast.error(data.error || 'Failed to add analytics integration')
      }
    } catch (error) {
      toast.error('Failed to add analytics integration')
    }
  }

  // Save email service
  const saveEmailService = async () => {
    try {
      const response = await fetch('/api/admin/integrations/email-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailForm,
          isActive: true,
          isDefault: emailServices.length === 0
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Email service added')
        setEmailForm({ name: '', provider: 'sendgrid', apiKey: '', apiSecret: '', fromEmail: '', fromName: '', webhookUrl: '' })
        fetchIntegrations()
      } else {
        toast.error(data.error || 'Failed to add email service')
      }
    } catch (error) {
      toast.error('Failed to add email service')
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Manage your store settings, integrations, and preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
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
                    ({((settings.taxRate || 0) * 100).toFixed(0)}%)
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

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
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
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>
                Connect your store's social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-gray-400" />
                  <Input
                    id="facebook"
                    value={settings.socialMedia?.facebook || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, facebook: e.target.value } 
                    })}
                    placeholder="https://facebook.com/yourstore"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-gray-400" />
                  <Input
                    id="instagram"
                    value={settings.socialMedia?.instagram || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, instagram: e.target.value } 
                    })}
                    placeholder="https://instagram.com/yourstore"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-gray-400" />
                  <Input
                    id="twitter"
                    value={settings.socialMedia?.twitter || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, twitter: e.target.value } 
                    })}
                    placeholder="https://twitter.com/yourstore"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="youtube">YouTube</Label>
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-gray-400" />
                  <Input
                    id="youtube"
                    value={settings.socialMedia?.youtube || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      socialMedia: { ...settings.socialMedia, youtube: e.target.value } 
                    })}
                    placeholder="https://youtube.com/@yourstore"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure search engine optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={settings.seo?.metaTitle || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    seo: { ...settings.seo, metaTitle: e.target.value } 
                  })}
                  placeholder="SCommerce - Your Online Fashion Store"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default title for search results (recommended: 50-60 characters)
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={settings.seo?.metaDescription || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    seo: { ...settings.seo, metaDescription: e.target.value } 
                  })}
                  placeholder="Discover the latest fashion trends at SCommerce"
                  rows={4}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Description for search results (recommended: 150-160 characters)
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Textarea
                  id="keywords"
                  value={settings.seo?.keywords || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    seo: { ...settings.seo, keywords: e.target.value } 
                  })}
                  placeholder="fashion, saree, salwar, lehenga, online shopping"
                  rows={3}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Comma-separated keywords for search engines
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Carriers</CardTitle>
              <CardDescription>
                Manage shipping carriers and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Shipping Carrier Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Add New Shipping Carrier</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                      placeholder="My Shipping"
                    />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={shippingForm.provider}
                      onChange={(e) => setShippingForm({ ...shippingForm, provider: e.target.value })}
                      placeholder="fedex"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      value={shippingForm.apiKey}
                      onChange={(e) => setShippingForm({ ...shippingForm, apiKey: e.target.value })}
                      placeholder="Enter API key"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label>API Secret</Label>
                    <Input
                      value={shippingForm.apiSecret}
                      onChange={(e) => setShippingForm({ ...shippingForm, apiSecret: e.target.value })}
                      placeholder="Enter API secret"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={shippingForm.accountNumber}
                      onChange={(e) => setShippingForm({ ...shippingForm, accountNumber: e.target.value })}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      value={shippingForm.webhookUrl}
                      onChange={(e) => setShippingForm({ ...shippingForm, webhookUrl: e.target.value })}
                      placeholder="https://yourstore.com/webhook/shipping"
                    />
                  </div>
                </div>
                <Button onClick={saveShippingCarrier} className="w-full">
                  <Truck className="w-4 h-4 mr-2" />
                  Add Shipping Carrier
                </Button>
              </div>

              {/* Shipping Carriers List */}
              <div className="space-y-3">
                <h4 className="font-medium">Configured Carriers</h4>
                {shippingCarriers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No shipping carriers configured yet
                  </p>
                ) : (
                  shippingCarriers.map((carrier) => (
                    <div key={carrier.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{carrier.name}</p>
                            <p className="text-sm text-gray-500">{carrier.provider}</p>
                          </div>
                          <div className="flex gap-2">
                            {carrier.isActive && <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>}
                            {carrier.isDefault && <Badge className="bg-blue-100 text-blue-700">Default</Badge>}
                          </div>
                        </div>
                        {carrier.lastTested && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last tested: {new Date(carrier.lastTested).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testIntegration('shipping-carriers', carrier.id)}
                        >
                          Test
                        </Button>
                        {!carrier.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefault('shipping-carriers', carrier.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteIntegration('shipping-carriers', carrier.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateways</CardTitle>
              <CardDescription>
                Configure payment methods for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Payment Gateway Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Add New Payment Gateway</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={paymentForm.name}
                      onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                      placeholder="Stripe"
                    />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={paymentForm.provider}
                      onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                      placeholder="stripe"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      value={paymentForm.apiKey}
                      onChange={(e) => setPaymentForm({ ...paymentForm, apiKey: e.target.value })}
                      placeholder="Enter API key"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label>API Secret</Label>
                    <Input
                      value={paymentForm.apiSecret}
                      onChange={(e) => setPaymentForm({ ...paymentForm, apiSecret: e.target.value })}
                      placeholder="Enter API secret"
                      type="password"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Webhook URL</Label>
                    <Input
                      value={paymentForm.webhookUrl}
                      onChange={(e) => setPaymentForm({ ...paymentForm, webhookUrl: e.target.value })}
                      placeholder="https://yourstore.com/webhook/payment"
                    />
                  </div>
                </div>
                <Button onClick={savePaymentGateway} className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Gateway
                </Button>
              </div>

              {/* Payment Gateways List */}
              <div className="space-y-3">
                <h4 className="font-medium">Configured Gateways</h4>
                {paymentGateways.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No payment gateways configured yet
                  </p>
                ) : (
                  paymentGateways.map((gateway) => (
                    <div key={gateway.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{gateway.name}</p>
                            <p className="text-sm text-gray-500">{gateway.provider}</p>
                          </div>
                          <div className="flex gap-2">
                            {gateway.isActive && <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>}
                            {gateway.isDefault && <Badge className="bg-blue-100 text-blue-700">Default</Badge>}
                          </div>
                        </div>
                        {gateway.lastTested && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last tested: {new Date(gateway.lastTested).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testIntegration('payment-gateways', gateway.id)}
                        >
                          Test
                        </Button>
                        {!gateway.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefault('payment-gateways', gateway.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteIntegration('payment-gateways', gateway.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Tracking</CardTitle>
              <CardDescription>
                Configure analytics and tracking tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Analytics Integration Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Add New Integration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={analyticsForm.name}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, name: e.target.value })}
                      placeholder="Google Analytics"
                    />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={analyticsForm.provider}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, provider: e.target.value })}
                      placeholder="google_analytics"
                    />
                  </div>
                  <div>
                    <Label>Tracking ID</Label>
                    <Input
                      value={analyticsForm.trackingId}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, trackingId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      value={analyticsForm.apiKey}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, apiKey: e.target.value })}
                      placeholder="Enter API key"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label>Pixel ID</Label>
                    <Input
                      value={analyticsForm.pixelId}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, pixelId: e.target.value })}
                      placeholder="Enter pixel ID"
                    />
                  </div>
                </div>
                <Button onClick={saveAnalytics} className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Add Analytics Integration
                </Button>
              </div>

              {/* Analytics Integrations List */}
              <div className="space-y-3">
                <h4 className="font-medium">Configured Integrations</h4>
                {analyticsIntegrations.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No analytics integrations configured yet
                  </p>
                ) : (
                  analyticsIntegrations.map((analytics) => (
                    <div key={analytics.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{analytics.name}</p>
                            <p className="text-sm text-gray-500">{analytics.provider}</p>
                          </div>
                          {analytics.isActive && <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteIntegration('analytics', analytics.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Services</CardTitle>
              <CardDescription>
                Configure email service providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Email Service Form */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Add New Email Service</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={emailForm.name}
                      onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                      placeholder="SendGrid"
                    />
                  </div>
                  <div>
                    <Label>Provider</Label>
                    <Input
                      value={emailForm.provider}
                      onChange={(e) => setEmailForm({ ...emailForm, provider: e.target.value })}
                      placeholder="sendgrid"
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      value={emailForm.apiKey}
                      onChange={(e) => setEmailForm({ ...emailForm, apiKey: e.target.value })}
                      placeholder="Enter API key"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label>API Secret</Label>
                    <Input
                      value={emailForm.apiSecret}
                      onChange={(e) => setEmailForm({ ...emailForm, apiSecret: e.target.value })}
                      placeholder="Enter API secret"
                      type="password"
                    />
                  </div>
                  <div>
                    <Label>From Email</Label>
                    <Input
                      value={emailForm.fromEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, fromEmail: e.target.value })}
                      placeholder="noreply@scommerce.com"
                    />
                  </div>
                  <div>
                    <Label>From Name</Label>
                    <Input
                      value={emailForm.fromName}
                      onChange={(e) => setEmailForm({ ...emailForm, fromName: e.target.value })}
                      placeholder="SCommerce"
                    />
                  </div>
                </div>
                <Button onClick={saveEmailService} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Add Email Service
                </Button>
              </div>

              {/* Email Services List */}
              <div className="space-y-3">
                <h4 className="font-medium">Configured Services</h4>
                {emailServices.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No email services configured yet
                  </p>
                ) : (
                  emailServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.provider}</p>
                            {service.fromEmail && (
                              <p className="text-sm text-gray-500">From: {service.fromEmail}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {service.isActive && <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>}
                            {service.isDefault && <Badge className="bg-blue-100 text-blue-700">Default</Badge>}
                          </div>
                        </div>
                        {service.lastTested && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last tested: {new Date(service.lastTested).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testIntegration('email-services', service.id)}
                        >
                          Test
                        </Button>
                        {!service.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefault('email-services', service.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteIntegration('email-services', service.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Card */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>
            See how settings appear to customers
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
              <span>Tax ({((settings.taxRate || 0) * 100).toFixed(0)}%):</span>
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
