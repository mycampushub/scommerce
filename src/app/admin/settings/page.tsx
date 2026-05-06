'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Save, Settings as SettingsIcon, RefreshCw, Loader2, Package, Building, Truck, CreditCard, Bell, Palette, Plug } from 'lucide-react'

type TabValue = 'general' | 'integrations' | 'store' | 'shipping' | 'payment' | 'notifications' | 'appearance'

interface Integration {
  name: string
  desc: string
  connected: boolean
  apiKey?: string
}

interface Carrier {
  name: string
  rate: string
  days: string
  enabled: boolean
}

interface PaymentMethod {
  name: string
  desc: string
  connected: boolean
  enabled: boolean
  apiKey?: string
  sandbox?: boolean
}

interface NotificationSetting {
  label: string
  desc: string
  enabled: boolean
}

interface GeneralSettings {
  storeName: string
  storeEmail: string
  storePhone: string
  timezone: string
  currency: string
  businessName: string
  businessAddress: string
  taxId: string
  businessType: string
  storeDesc: string
  enableStore: boolean
  maintenanceMode: boolean
}

interface StoreDetails {
  logo: string
  banner: string
  announcements: string[]
}

interface ShippingConfig {
  freeShippingMin: number
  freeShippingMessage: string
  shippingZones: any[]
}

interface PaymentConfig {
  gateway: string
  apiKey: string
  enabled: boolean
  sandbox: boolean
  storeCreditCard: boolean
  paypal: boolean
  bankTransfer: boolean
}

interface NotificationConfig {
  email: boolean
  sms: boolean
  push: boolean
  inApp: boolean
  desktop: boolean
}

interface AppearanceConfig {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  borderRadius: string
  customCSS: string
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabValue>('general')
  
  // General Settings State
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    storeName: 'Fashion Store',
    storeEmail: 'store@fashion.com',
    storePhone: '+1 234 567890',
    timezone: 'Asia/Dhaka',
    currency: 'BDT (৳)',
    businessName: 'Fashion Inc.',
    businessAddress: '123 Fashion Street, New York, NY 10001',
    taxId: 'TAX-001',
    businessType: 'LLC',
    storeDesc: 'Welcome to Fashion Store - your destination for trendy and traditional clothing.',
    enableStore: false,
    maintenanceMode: false,
  })

  // Store Details State
  const [storeDetails, setStoreDetails] = useState<StoreDetails>({
    logo: '',
    banner: '',
    announcements: [],
  })

  // Shipping Config State
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>({
    freeShippingMin: 1000,
    freeShippingMessage: 'Free shipping on orders above ৳1000',
    shippingZones: [],
  })

  // Payment Config State
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    gateway: 'stripe',
    apiKey: '',
    enabled: true,
    sandbox: true,
    storeCreditCard: false,
    paypal: true,
    bankTransfer: false,
  })

  // Notification Config State
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    email: true,
    sms: false,
    push: true,
    inApp: true,
    desktop: false,
  })

  // Appearance Config State
  const [appearanceConfig, setAppearanceConfig] = useState<AppearanceConfig>({
    primaryColor: '#8b5cf6',
    secondaryColor: '#6366f1',
    fontFamily: 'Inter',
    borderRadius: '8px',
    customCSS: '',
  })

  // Integrations State
  const [integrations, setIntegrations] = useState<Integration[]>([
    { name: 'Google Analytics', desc: 'Track visitor behavior and conversions', connected: false },
    { name: 'Facebook Pixel', desc: 'Track Facebook ads conversions', connected: false },
    { name: 'Google Tag Manager', desc: 'Manage all tags in one place', connected: false },
    { name: 'Hotjar', desc: 'Understand user behavior with heatmaps', connected: false },
  ])

  // Fetch settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/settings')
        const data = await response.json() as any
        
        if (data.success && data.data) {
          if (data.data.general) {
            setGeneralSettings(prev => ({
              ...prev,
              ...data.data.general,
            }))
          }
          if (data.data.storeDetails) {
            setStoreDetails(prev => ({
              ...prev,
              ...data.data.storeDetails,
            }))
          }
          if (data.data.shipping) {
            setShippingConfig(prev => ({
              ...prev,
              ...data.data.shipping,
            }))
          }
          if (data.data.payment) {
            setPaymentConfig(prev => ({
              ...prev,
              ...data.data.payment,
            }))
          }
          if (data.data.notifications) {
            setNotificationConfig(prev => ({
              ...prev,
              ...data.data.notifications,
            }))
          }
          if (data.data.appearance) {
            setAppearanceConfig(prev => ({
              ...prev,
              ...data.data.appearance,
            }))
          }
          if (data.data.integrations) {
            setIntegrations(data.data.integrations)
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Save handler with persistence
  const handleSave = async () => {
    if (saving) return
    try {
      setSaving(true)

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          general: generalSettings,
          storeDetails,
          shipping: shippingConfig,
          payment: paymentConfig,
          notifications: notificationConfig,
          appearance: appearanceConfig,
          integrations,
        }),
      })

      const data = await response.json() as any

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        })
        
        // Refetch settings after save
        const fetchResponse = await fetch('/api/admin/settings')
        const fetchData = await fetchResponse.json() as any
        if (fetchData.success && fetchData.data) {
          if (fetchData.data.general) {
            setGeneralSettings(prev => ({
              ...prev,
              ...fetchData.data.general,
            }))
          }
          if (fetchData.data.storeDetails) {
            setStoreDetails(prev => ({
              ...prev,
              ...fetchData.data.storeDetails,
            }))
          }
          if (fetchData.data.shipping) {
            setShippingConfig(prev => ({
              ...prev,
              ...fetchData.data.shipping,
            }))
          }
          if (fetchData.data.payment) {
            setPaymentConfig(prev => ({
              ...prev,
              ...fetchData.data.payment,
            }))
          }
          if (fetchData.data.notifications) {
            setNotificationConfig(prev => ({
              ...prev,
              ...fetchData.data.notifications,
            }))
          }
          if (fetchData.data.appearance) {
            setAppearanceConfig(prev => ({
              ...prev,
              ...fetchData.data.appearance,
            }))
          }
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Reset handler
  const handleReset = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json() as any

      if (data.success && data.data) {
        if (data.data.general) {
          setGeneralSettings(data.data.general)
        }
        if (data.data.storeDetails) {
          setStoreDetails(data.data.storeDetails)
        }
        if (data.data.shipping) {
          setShippingConfig(data.data.shipping)
        }
        if (data.data.payment) {
          setPaymentConfig(data.data.payment)
        }
        if (data.data.notifications) {
          setNotificationConfig(data.data.notifications)
        }
        if (data.data.appearance) {
          setAppearanceConfig(data.data.appearance)
        }
        if (data.data.integrations) {
          setIntegrations(data.data.integrations)
        }
        toast({
          title: 'Changes discarded',
          description: 'Unsaved changes have been discarded',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue)
  }

  const handleToggleStoreStatus = (checked: boolean) => {
    setGeneralSettings(prev => ({
      ...prev,
      enableStore: checked,
      maintenanceMode: checked ? false : prev.maintenanceMode,
    }))
  }

  const handleMaintenanceMode = (checked: boolean) => {
    // Warn about maintenance mode
    if (checked && !generalSettings.maintenanceMode) {
      toast({
        title: 'Maintenance Mode',
        description: 'Users will see maintenance page when enabled',
        variant: 'default',
      })
    }
    
    // If enabling maintenance mode, disable store
    if (checked && generalSettings.enableStore) {
      setGeneralSettings(prev => ({
        ...prev,
        maintenanceMode: checked,
        enableStore: false,
      }))
    } else {
      setGeneralSettings(prev => ({
        ...prev,
        maintenanceMode: checked,
      }))
    }
  }

  const toggleIntegration = (index: number) => {
    setIntegrations(prev => {
      const newIntegrations = [...prev]
      newIntegrations[index] = {
        ...newIntegrations[index],
        connected: !newIntegrations[index].connected,
      }
      return newIntegrations
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your store configuration and preferences</p>
      </div>

      {/* Settings Form */}
      <Tabs defaultValue="general" value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-white shadow-md flex-wrap gap-2">
          <TabsTrigger value="general" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="store" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Building className="h-4 w-4 mr-2" />
            Store Details
          </TabsTrigger>
          <TabsTrigger value="shipping" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Truck className="h-4 w-4 mr-2" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">General Settings</CardTitle>
              <CardDescription className="text-gray-500">Basic configuration for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input id="store-name" value={generalSettings.storeName} onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Store Email</Label>
                  <Input id="store-email" type="email" value={generalSettings.storeEmail} onChange={(e) => setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })} disabled={loading} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input id="store-phone" type="tel" value={generalSettings.storePhone} onChange={(e) => setGeneralSettings({ ...generalSettings, storePhone: e.target.value })} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({ ...generalSettings, timezone: value })} disabled={loading}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Dhaka">Asia/Dhaka (UTC+6)</SelectItem>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</SelectItem>
                      <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" value={generalSettings.currency} onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input id="business-name" value={generalSettings.businessName} onChange={(e) => setGeneralSettings({ ...generalSettings, businessName: e.target.value })} disabled={loading} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-address">Business Address</Label>
                  <Textarea id="business-address" value={generalSettings.businessAddress} onChange={(e) => setGeneralSettings({ ...generalSettings, businessAddress: e.target.value })} rows={3} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input id="tax-id" value={generalSettings.taxId} onChange={(e) => setGeneralSettings({ ...generalSettings, taxId: e.target.value })} disabled={loading} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-type">Business Type</Label>
                  <Select value={generalSettings.businessType} onValueChange={(value) => setGeneralSettings({ ...generalSettings, businessType: value })} disabled={loading}>
                    <SelectTrigger id="business-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LLC">LLC</SelectItem>
                      <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="Corporation">Corporation</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-desc">Store Description</Label>
                  <Textarea id="store-desc" value={generalSettings.storeDesc} onChange={(e) => setGeneralSettings({ ...generalSettings, storeDesc: e.target.value })} rows={3} disabled={loading} />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Store Status</h3>
                <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Enable Store</p>
                    <p className="text-xs text-gray-500">Allow customers to browse and purchase</p>
                  </div>
                  <Switch
                    checked={generalSettings.enableStore}
                    onCheckedChange={handleToggleStoreStatus}
                    className="data-[state=disabled]:opacity-50"
                    aria-label="Toggle store availability"
                    disabled={loading || saving}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Maintenance Mode</p>
                    <p className="text-xs text-gray-500">Temporarily disable store access</p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={handleMaintenanceMode}
                    className="data-[state=disabled]:opacity-50"
                    aria-label="Toggle maintenance mode"
                    disabled={loading || saving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Integrations</CardTitle>
              <CardDescription>Connect analytics and tracking platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{integration.name}</p>
                      {integration.connected && <Badge className="bg-green-100 text-green-800">Connected</Badge>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{integration.desc}</p>
                  </div>
                  <Switch
                    checked={integration.connected}
                    onCheckedChange={() => toggleIntegration(index)}
                    aria-label={`Toggle ${integration.name}`}
                    disabled={loading || saving}
                  />
                </div>
              ))}
              {integrations.length === 0 && (
                <div className="text-center py-12">
                  <Plug className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No integrations available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Details Tab */}
        <TabsContent value="store" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Store Details</CardTitle>
              <CardDescription>Information about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input id="logo-url" value={storeDetails.logo} onChange={(e) => setStoreDetails({ ...storeDetails, logo: e.target.value })} placeholder="https://example.com/logo.png" disabled={loading || saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banner-url">Banner URL</Label>
                <Input id="banner-url" value={storeDetails.banner} onChange={(e) => setStoreDetails({ ...storeDetails, banner: e.target.value })} placeholder="https://example.com/banner.png" disabled={loading || saving} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcements">Announcements</Label>
                <Textarea id="announcements" value={storeDetails.announcements.join('\n')} onChange={(e) => setStoreDetails({ ...storeDetails, announcements: e.target.value.split('\n') })} rows={3} placeholder="Enter announcements, one per line" disabled={loading || saving} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Settings</CardTitle>
              <CardDescription>Configure shipping options and rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="free-shipping-min">Free Shipping Minimum</Label>
                  <Input id="free-shipping-min" type="number" value={shippingConfig.freeShippingMin} onChange={(e) => setShippingConfig({ ...shippingConfig, freeShippingMin: parseFloat(e.target.value) || 0 })} disabled={loading || saving} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="free-shipping-msg">Free Shipping Message</Label>
                  <Input id="free-shipping-msg" value={shippingConfig.freeShippingMessage} onChange={(e) => setShippingConfig({ ...shippingConfig, freeShippingMessage: e.target.value })} disabled={loading || saving} />
                </div>
              </div>
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Shipping zones configuration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Payment Gateways</CardTitle>
              <CardDescription>Configure payment processing integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment-gateway">Default Gateway</Label>
                <Select value={paymentConfig.gateway} onValueChange={(value) => setPaymentConfig({ ...paymentConfig, gateway: value })} disabled={loading || saving}>
                  <SelectTrigger id="payment-gateway">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" type="password" value={paymentConfig.apiKey} onChange={(e) => setPaymentConfig({ ...paymentConfig, apiKey: e.target.value })} placeholder="Enter API key" disabled={loading || saving} />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Enable Payments</p>
                    <p className="text-xs text-gray-500">Accept online payments</p>
                  </div>
                  <Switch checked={paymentConfig.enabled} onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, enabled: checked })} disabled={loading || saving} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Sandbox Mode</p>
                    <p className="text-xs text-gray-500">Test payments without real money</p>
                  </div>
                  <Switch checked={paymentConfig.sandbox} onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, sandbox: checked })} disabled={loading || saving} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Credit Card</p>
                    <p className="text-xs text-gray-500">Accept credit card payments</p>
                  </div>
                  <Switch checked={paymentConfig.storeCreditCard} onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, storeCreditCard: checked })} disabled={loading || saving} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">PayPal</p>
                    <p className="text-xs text-gray-500">Accept PayPal payments</p>
                  </div>
                  <Switch checked={paymentConfig.paypal} onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, paypal: checked })} disabled={loading || saving} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg md:col-span-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Bank Transfer</p>
                    <p className="text-xs text-gray-500">Accept bank transfer payments</p>
                  </div>
                  <Switch checked={paymentConfig.bankTransfer} onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, bankTransfer: checked })} disabled={loading || saving} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <Switch checked={notificationConfig.email} onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, email: checked })} disabled={loading || saving} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">SMS Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                </div>
                <Switch checked={notificationConfig.sms} onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, sms: checked })} disabled={loading || saving} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Receive push notifications</p>
                </div>
                <Switch checked={notificationConfig.push} onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, push: checked })} disabled={loading || saving} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">In-App Notifications</p>
                  <p className="text-xs text-gray-500">Receive notifications in the app</p>
                </div>
                <Switch checked={notificationConfig.inApp} onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, inApp: checked })} disabled={loading || saving} />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">Desktop Notifications</p>
                  <p className="text-xs text-gray-500">Receive desktop notifications</p>
                </div>
                <Switch checked={notificationConfig.desktop} onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, desktop: checked })} disabled={loading || saving} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Store Appearance</CardTitle>
              <CardDescription>Customize your store look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input id="primary-color" type="color" value={appearanceConfig.primaryColor} onChange={(e) => setAppearanceConfig({ ...appearanceConfig, primaryColor: e.target.value })} className="w-20 h-10" disabled={loading || saving} />
                    <Input value={appearanceConfig.primaryColor} onChange={(e) => setAppearanceConfig({ ...appearanceConfig, primaryColor: e.target.value })} disabled={loading || saving} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input id="secondary-color" type="color" value={appearanceConfig.secondaryColor} onChange={(e) => setAppearanceConfig({ ...appearanceConfig, secondaryColor: e.target.value })} className="w-20 h-10" disabled={loading || saving} />
                    <Input value={appearanceConfig.secondaryColor} onChange={(e) => setAppearanceConfig({ ...appearanceConfig, secondaryColor: e.target.value })} disabled={loading || saving} />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select value={appearanceConfig.fontFamily} onValueChange={(value) => setAppearanceConfig({ ...appearanceConfig, fontFamily: value })} disabled={loading || saving}>
                    <SelectTrigger id="font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="border-radius">Border Radius</Label>
                  <Select value={appearanceConfig.borderRadius} onValueChange={(value) => setAppearanceConfig({ ...appearanceConfig, borderRadius: value })} disabled={loading || saving}>
                    <SelectTrigger id="border-radius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0px">None</SelectItem>
                      <SelectItem value="4px">Small</SelectItem>
                      <SelectItem value="8px">Medium</SelectItem>
                      <SelectItem value="12px">Large</SelectItem>
                      <SelectItem value="16px">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea id="custom-css" value={appearanceConfig.customCSS} onChange={(e) => setAppearanceConfig({ ...appearanceConfig, customCSS: e.target.value })} rows={6} placeholder="Enter custom CSS code" disabled={loading || saving} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={loading || saving} aria-label="Reset settings to default values">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || saving}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          aria-label="Save all settings"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
