'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  Bell,
  Shield,
  CreditCard,
  Truck,
  Mail,
  Globe,
  Building,
  Palette,
  Link as LinkIcon,
  BarChart3,
  Plug
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'
import IntegrationsSettings from './integrations'

type TabValue = 'general' | 'integrations' | 'store' | 'shipping' | 'payment' | 'notifications' | 'appearance'

interface Integration {
  name: string
  desc: string
  connected: boolean
  placeholder?: string
}

interface Carrier {
  name: string
  rate: string
  days: string
}

interface PaymentMethod {
  name: string
  desc: string
  connected: boolean
}

interface Notification {
  label: string
  desc: string
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

interface IntegrationSettings {
  googleAnalytics: { trackingId: string; enabled: boolean }
  facebookPixel: { pixelId: string; enabled: boolean }
  googleTagManager: { containerId: string; enabled: boolean }
  sendGrid: { apiKey: string; fromEmail: string; enabled: boolean }
  stripe: { apiKey: string; webhookSecret: string; enabled: boolean }
  paypal: { clientId: string; clientSecret: string; enabled: boolean }
}

interface StoreSettings {
  businessEmail: string
  supportEmail: string
  returnEmail: string
  businessPhone: string
  supportPhone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
  taxRate: number
  taxIdNumber: string
  taxIncluded: boolean
}

interface ShippingSettings {
  freeShippingThreshold: number
  baseShippingCost: number
  flatRateEnabled: boolean
  flatRatePrice: number
  localPickupEnabled: boolean
  localPickupPrice: number
  carriers: {
    fedex: { enabled: boolean; accountNumber: string }
    ups: { enabled: boolean; accountNumber: string }
    dhl: { enabled: boolean; accountNumber: string }
  }
  shippingZones: Array<{ name: string; rate: number; countries: string }>
}

interface PaymentSettings {
  stripe: { publicKey: string; secretKey: string; webhookSecret: string; enabled: boolean }
  paypal: { clientId: string; secretKey: string; enabled: boolean }
  cod: { enabled: boolean; instructions: string }
  bankTransfer: { enabled: boolean; accountDetails: string }
  currency: string
  currencySymbol: string
}

interface NotificationSettings {
  email: {
    newOrder: boolean
    orderShipped: boolean
    orderDelivered: boolean
    customerRegistration: boolean
    lowStock: boolean
  }
  sms: {
    enabled: boolean
    apiKey: string
    newOrder: boolean
    orderShipped: boolean
  }
  push: {
    enabled: boolean
    newOrder: boolean
    orderUpdates: boolean
  }
}

interface AppearanceSettings {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  fontSize: string
  logo: string
  favicon: string
  customCSS: string
  productCardStyle: string
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('general')

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue)
  }

  // State for general settings
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    storeName: 'Fashion Store',
    storeEmail: 'store@fashion.com',
    storePhone: '+1 234 567890',
    timezone: 'UTC',
    currency: 'USD ($)',
    businessName: 'Fashion Inc.',
    businessAddress: '123 Fashion Street, New York, NY 10001',
    taxId: 'TAX-001',
    businessType: 'LLC',
    storeDesc: 'Welcome to Fashion Store - your destination for trendy and traditional clothing.',
    enableStore: false,
    maintenanceMode: false,
  })

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    googleAnalytics: { trackingId: '', enabled: false },
    facebookPixel: { pixelId: '', enabled: false },
    googleTagManager: { containerId: '', enabled: false },
    sendGrid: { apiKey: '', fromEmail: '', enabled: false },
    stripe: { apiKey: '', webhookSecret: '', enabled: false },
    paypal: { clientId: '', clientSecret: '', enabled: false },
  })

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    businessEmail: 'business@fashion.com',
    supportEmail: 'support@fashion.com',
    returnEmail: 'returns@fashion.com',
    businessPhone: '+1 234 567890',
    supportPhone: '+1 234 567890',
    addressLine1: '123 Fashion Street',
    addressLine2: '',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    taxRate: 8.875,
    taxIdNumber: '',
    taxIncluded: false,
  })

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    freeShippingThreshold: 100,
    baseShippingCost: 9.99,
    flatRateEnabled: true,
    flatRatePrice: 9.99,
    localPickupEnabled: true,
    localPickupPrice: 0,
    carriers: {
      fedex: { enabled: false, accountNumber: '' },
      ups: { enabled: false, accountNumber: '' },
      dhl: { enabled: false, accountNumber: '' },
    },
    shippingZones: [
      { name: 'Domestic', rate: 9.99, countries: 'US' },
      { name: 'Canada', rate: 19.99, countries: 'CA' },
      { name: 'International', rate: 29.99, countries: '*' },
    ],
  })

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripe: { publicKey: '', secretKey: '', webhookSecret: '', enabled: false },
    paypal: { clientId: '', secretKey: '', enabled: false },
    cod: { enabled: true, instructions: 'Pay cash upon delivery.' },
    bankTransfer: { enabled: false, accountDetails: '' },
    currency: 'USD',
    currencySymbol: '$',
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      newOrder: true,
      orderShipped: true,
      orderDelivered: true,
      customerRegistration: true,
      lowStock: true,
    },
    sms: {
      enabled: false,
      apiKey: '',
      newOrder: true,
      orderShipped: true,
    },
    push: {
      enabled: false,
      newOrder: true,
      orderUpdates: true,
    },
  })

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    primaryColor: '#7c3aed',
    secondaryColor: '#6366f1',
    accentColor: '#8b5cf6',
    fontFamily: 'Inter',
    fontSize: '16',
    logo: '',
    favicon: '',
    customCSS: '',
    productCardStyle: 'modern',
  })

  // Load settings on mount
  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      const data = await response.json() as any
      if (data.success && data.data) {
        // Map API data to local state
        if (data.data.siteName) {
          setGeneralSettings(prev => ({ ...prev, storeName: data.data.siteName }))
        }
        if (data.data.contactEmail) {
          setGeneralSettings(prev => ({ ...prev, storeEmail: data.data.contactEmail }))
        }
        if (data.data.contactPhone) {
          setGeneralSettings(prev => ({ ...prev, storePhone: data.data.contactPhone }))
        }
        if (data.data.taxRate) {
          setStoreSettings(prev => ({ ...prev, taxRate: data.data.taxRate * 100 }))
        }
        if (data.data.currency) {
          setPaymentSettings(prev => ({ ...prev, currency: data.data.currency }))
        }
        if (data.data.currencySymbol) {
          setPaymentSettings(prev => ({ ...prev, currencySymbol: data.data.currencySymbol }))
        }
        if (data.data.freeShippingThreshold) {
          setShippingSettings(prev => ({ ...prev, freeShippingThreshold: data.data.freeShippingThreshold }))
        }
        if (data.data.baseShippingCost) {
          setShippingSettings(prev => ({ ...prev, baseShippingCost: data.data.baseShippingCost }))
        }
        // Load other settings from API data...
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Save handler for current tab
  const handleSave = async () => {
    if (saving) return

    setSaving(true)

    try {
      let body: any = {}

      // Build request body based on active tab
      switch (activeTab) {
        case 'general':
          body = {
            siteName: generalSettings.storeName,
            siteEmail: generalSettings.storeEmail,
            contactPhone: generalSettings.storePhone,
            timezone: generalSettings.timezone,
            businessName: generalSettings.businessName,
            businessAddress: generalSettings.businessAddress,
            storeDesc: generalSettings.storeDesc,
            seo: {
              metaTitle: generalSettings.storeName,
              metaDescription: generalSettings.storeDesc,
            },
          }
          break
        case 'store':
          body = {
            contactEmail: storeSettings.businessEmail,
            contactPhone: storeSettings.businessPhone,
            taxRate: storeSettings.taxRate / 100,
            businessAddress: `${storeSettings.addressLine1}, ${storeSettings.city}, ${storeSettings.state} ${storeSettings.zipCode}, ${storeSettings.country}`,
          }
          break
        case 'shipping':
          body = {
            freeShippingThreshold: shippingSettings.freeShippingThreshold,
            baseShippingCost: shippingSettings.baseShippingCost,
          }
          break
        case 'payment':
          body = {
            currency: paymentSettings.currency,
            currencySymbol: paymentSettings.currencySymbol,
          }
          break
        case 'integrations':
          body = {
            integrations: integrationSettings,
          }
          break
        case 'notifications':
          body = {
            notifications: notificationSettings,
          }
          break
        case 'appearance':
          body = {
            appearance: appearanceSettings,
          }
          break
      }

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json() as any

      if (data.success) {
        toast({
          title: 'Success',
          description: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings saved successfully`,
        })
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
            <Globe className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="store" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Building className="h-4 w-4 mr-2" />
            Store
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

        {/* General Settings */}
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
                  <Input id="store-name" value={generalSettings.storeName} onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Store Email</Label>
                  <Input id="store-email" type="email" value={generalSettings.storeEmail} onChange={(e) => setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone Number</Label>
                  <Input id="store-phone" type="tel" value={generalSettings.storePhone} onChange={(e) => setGeneralSettings({ ...generalSettings, storePhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" value={generalSettings.timezone} onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" value={generalSettings.currency} onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })} />
                </div>
              </div>
              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Store Status</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Enable Store</p>
                    <p className="text-xs text-gray-500">Allow customers to browse and purchase</p>
                  </div>
                  <Switch
                    defaultChecked={generalSettings.enableStore}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, enableStore: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Maintenance Mode</p>
                    <p className="text-xs text-gray-500">Temporarily disable store access</p>
                  </div>
                  <Switch
                    defaultChecked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                    />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleSave()} disabled={saving}>
                  Cancel
                </Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsSettings />
        </TabsContent>

        {/* Store Tab */}
        <TabsContent value="store" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
              <CardDescription>Manage your store contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={storeSettings.businessEmail}
                    onChange={(e) => setStoreSettings({ ...storeSettings, businessEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={storeSettings.supportEmail}
                    onChange={(e) => setStoreSettings({ ...storeSettings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return-email">Returns Email</Label>
                  <Input
                    id="return-email"
                    type="email"
                    value={storeSettings.returnEmail}
                    onChange={(e) => setStoreSettings({ ...storeSettings, returnEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Business Phone</Label>
                  <Input
                    id="business-phone"
                    type="tel"
                    value={storeSettings.businessPhone}
                    onChange={(e) => setStoreSettings({ ...storeSettings, businessPhone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Business Address</CardTitle>
              <CardDescription>Your physical store location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-line-1">Address Line 1</Label>
                  <Input
                    id="address-line-1"
                    value={storeSettings.addressLine1}
                    onChange={(e) => setStoreSettings({ ...storeSettings, addressLine1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-line-2">Address Line 2 (Optional)</Label>
                  <Input
                    id="address-line-2"
                    value={storeSettings.addressLine2}
                    onChange={(e) => setStoreSettings({ ...storeSettings, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={storeSettings.city}
                      onChange={(e) => setStoreSettings({ ...storeSettings, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={storeSettings.state}
                      onChange={(e) => setStoreSettings({ ...storeSettings, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip-code">Zip/Postal Code</Label>
                    <Input
                      id="zip-code"
                      value={storeSettings.zipCode}
                      onChange={(e) => setStoreSettings({ ...storeSettings, zipCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={storeSettings.country}
                      onChange={(e) => setStoreSettings({ ...storeSettings, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Tax Settings</CardTitle>
              <CardDescription>Configure tax collection for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    step="0.01"
                    value={storeSettings.taxRate}
                    onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-id-number">Tax ID Number (Optional)</Label>
                  <Input
                    id="tax-id-number"
                    value={storeSettings.taxIdNumber}
                    onChange={(e) => setStoreSettings({ ...storeSettings, taxIdNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm text-gray-900">Tax Included in Price</p>
                  <p className="text-xs text-gray-500">Display prices including tax</p>
                </div>
                <Switch
                  checked={storeSettings.taxIncluded}
                  onCheckedChange={(checked) => setStoreSettings({ ...storeSettings, taxIncluded: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setSaving(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Store Settings
            </Button>
          </div>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Options</CardTitle>
              <CardDescription>Configure basic shipping settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="free-shipping-threshold">Free Shipping Threshold</Label>
                  <Input
                    id="free-shipping-threshold"
                    type="number"
                    step="0.01"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">Orders above this amount get free shipping</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base-shipping-cost">Base Shipping Cost</Label>
                  <Input
                    id="base-shipping-cost"
                    type="number"
                    step="0.01"
                    value={shippingSettings.baseShippingCost}
                    onChange={(e) => setShippingSettings({ ...shippingSettings, baseShippingCost: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">Default shipping cost for orders below threshold</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Flat Rate Shipping</p>
                    <p className="text-xs text-gray-500">Charge a flat rate for all orders</p>
                  </div>
                  <Switch
                    checked={shippingSettings.flatRateEnabled}
                    onCheckedChange={(checked) => setShippingSettings({ ...shippingSettings, flatRateEnabled: checked })}
                  />
                </div>
                {shippingSettings.flatRateEnabled && (
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="flat-rate-price">Flat Rate Price</Label>
                    <Input
                      id="flat-rate-price"
                      type="number"
                      step="0.01"
                      value={shippingSettings.flatRatePrice}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, flatRatePrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Local Pickup</p>
                    <p className="text-xs text-gray-500">Allow customers to pick up orders</p>
                  </div>
                  <Switch
                    checked={shippingSettings.localPickupEnabled}
                    onCheckedChange={(checked) => setShippingSettings({ ...shippingSettings, localPickupEnabled: checked })}
                  />
                </div>
                {shippingSettings.localPickupEnabled && (
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="local-pickup-price">Local Pickup Price</Label>
                    <Input
                      id="local-pickup-price"
                      type="number"
                      step="0.01"
                      value={shippingSettings.localPickupPrice}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, localPickupPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Carriers</CardTitle>
              <CardDescription>Connect your carrier accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-purple-600 rounded" />
                      <div>
                        <p className="font-medium text-sm">FedEx</p>
                        <p className="text-xs text-gray-500">Calculate live FedEx rates</p>
                      </div>
                    </div>
                    <Switch
                      checked={shippingSettings.carriers.fedex.enabled}
                      onCheckedChange={(checked) => setShippingSettings({
                        ...shippingSettings,
                        carriers: { ...shippingSettings.carriers, fedex: { ...shippingSettings.carriers.fedex, enabled: checked } }
                      })}
                    />
                  </div>
                  {shippingSettings.carriers.fedex.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="fedex-account">Account Number</Label>
                      <Input
                        id="fedex-account"
                        placeholder="123456789"
                        value={shippingSettings.carriers.fedex.accountNumber}
                        onChange={(e) => setShippingSettings({
                          ...shippingSettings,
                          carriers: { ...shippingSettings.carriers, fedex: { ...shippingSettings.carriers.fedex, accountNumber: e.target.value } }
                        })}
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-yellow-600 rounded" />
                      <div>
                        <p className="font-medium text-sm">UPS</p>
                        <p className="text-xs text-gray-500">Calculate live UPS rates</p>
                      </div>
                    </div>
                    <Switch
                      checked={shippingSettings.carriers.ups.enabled}
                      onCheckedChange={(checked) => setShippingSettings({
                        ...shippingSettings,
                        carriers: { ...shippingSettings.carriers, ups: { ...shippingSettings.carriers.ups, enabled: checked } }
                      })}
                    />
                  </div>
                  {shippingSettings.carriers.ups.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="ups-account">Account Number</Label>
                      <Input
                        id="ups-account"
                        placeholder="A123456789"
                        value={shippingSettings.carriers.ups.accountNumber}
                        onChange={(e) => setShippingSettings({
                          ...shippingSettings,
                          carriers: { ...shippingSettings.carriers, ups: { ...shippingSettings.carriers.ups, accountNumber: e.target.value } }
                        })}
                      />
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-red-600 rounded" />
                      <div>
                        <p className="font-medium text-sm">DHL</p>
                        <p className="text-xs text-gray-500">Calculate live DHL rates</p>
                      </div>
                    </div>
                    <Switch
                      checked={shippingSettings.carriers.dhl.enabled}
                      onCheckedChange={(checked) => setShippingSettings({
                        ...shippingSettings,
                        carriers: { ...shippingSettings.carriers, dhl: { ...shippingSettings.carriers.dhl, enabled: checked } }
                      })}
                    />
                  </div>
                  {shippingSettings.carriers.dhl.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="dhl-account">Account Number</Label>
                      <Input
                        id="dhl-account"
                        placeholder="123456789"
                        value={shippingSettings.carriers.dhl.accountNumber}
                        onChange={(e) => setShippingSettings({
                          ...shippingSettings,
                          carriers: { ...shippingSettings.carriers, dhl: { ...shippingSettings.carriers.dhl, accountNumber: e.target.value } }
                        })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Zones</CardTitle>
              <CardDescription>Define shipping rates by geographic region</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shippingSettings.shippingZones.map((zone, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Zone Name</Label>
                      <Input
                        value={zone.name}
                        onChange={(e) => {
                          const newZones = [...shippingSettings.shippingZones]
                          newZones[index].name = e.target.value
                          setShippingSettings({ ...shippingSettings, shippingZones: newZones })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={zone.rate}
                        onChange={(e) => {
                          const newZones = [...shippingSettings.shippingZones]
                          newZones[index].rate = parseFloat(e.target.value) || 0
                          setShippingSettings({ ...shippingSettings, shippingZones: newZones })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Countries</Label>
                      <Input
                        value={zone.countries}
                        onChange={(e) => {
                          const newZones = [...shippingSettings.shippingZones]
                          newZones[index].countries = e.target.value
                          setShippingSettings({ ...shippingSettings, shippingZones: newZones })
                        }}
                        placeholder="US, CA, UK or * for all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setSaving(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Shipping Settings
            </Button>
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Currency Settings</CardTitle>
              <CardDescription>Configure your store currency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={paymentSettings.currency}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                    placeholder="USD, EUR, GBP, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency-symbol">Currency Symbol</Label>
                  <Input
                    id="currency-symbol"
                    value={paymentSettings.currencySymbol}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, currencySymbol: e.target.value })}
                    placeholder="$, €, £, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Payment Gateways</CardTitle>
              <CardDescription>Accept payments online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="font-medium text-sm">Stripe</p>
                        <p className="text-xs text-gray-500">Accept credit card payments</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings.stripe.enabled}
                      onCheckedChange={(checked) => setPaymentSettings({
                        ...paymentSettings,
                        stripe: { ...paymentSettings.stripe, enabled: checked }
                      })}
                    />
                  </div>
                  {paymentSettings.stripe.enabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="stripe-public-key">Public Key</Label>
                        <Input
                          id="stripe-public-key"
                          placeholder="pk_test_..."
                          value={paymentSettings.stripe.publicKey}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            stripe: { ...paymentSettings.stripe, publicKey: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stripe-secret-key">Secret Key</Label>
                        <Input
                          id="stripe-secret-key"
                          type="password"
                          placeholder="sk_test_..."
                          value={paymentSettings.stripe.secretKey}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            stripe: { ...paymentSettings.stripe, secretKey: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
                        <Input
                          id="stripe-webhook-secret"
                          type="password"
                          placeholder="whsec_..."
                          value={paymentSettings.stripe.webhookSecret}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            stripe: { ...paymentSettings.stripe, webhookSecret: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-blue-600 rounded" />
                      <div>
                        <p className="font-medium text-sm">PayPal</p>
                        <p className="text-xs text-gray-500">Accept PayPal payments</p>
                      </div>
                    </div>
                    <Switch
                      checked={paymentSettings.paypal.enabled}
                      onCheckedChange={(checked) => setPaymentSettings({
                        ...paymentSettings,
                        paypal: { ...paymentSettings.paypal, enabled: checked }
                      })}
                    />
                  </div>
                  {paymentSettings.paypal.enabled && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="paypal-client-id">Client ID</Label>
                        <Input
                          id="paypal-client-id"
                          placeholder="AXxxxxxxxxxxxxx"
                          value={paymentSettings.paypal.clientId}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            paypal: { ...paymentSettings.paypal, clientId: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paypal-secret-key">Secret Key</Label>
                        <Input
                          id="paypal-secret-key"
                          type="password"
                          placeholder="EKxxxxxxxxxxxxx"
                          value={paymentSettings.paypal.secretKey}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            paypal: { ...paymentSettings.paypal, secretKey: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Other Payment Methods</CardTitle>
              <CardDescription>Additional payment options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Cash on Delivery (COD)</p>
                  <p className="text-xs text-gray-500">Allow customers to pay when they receive their order</p>
                </div>
                <Switch
                  checked={paymentSettings.cod.enabled}
                  onCheckedChange={(checked) => setPaymentSettings({
                    ...paymentSettings,
                    cod: { ...paymentSettings.cod, enabled: checked }
                  })}
                />
              </div>
              {paymentSettings.cod.enabled && (
                <div className="ml-4 space-y-2">
                  <Label htmlFor="cod-instructions">COD Instructions</Label>
                  <Textarea
                    id="cod-instructions"
                    placeholder="Instructions for COD orders..."
                    value={paymentSettings.cod.instructions}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      cod: { ...paymentSettings.cod, instructions: e.target.value }
                    })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Bank Transfer</p>
                  <p className="text-xs text-gray-500">Allow direct bank transfer payments</p>
                </div>
                <Switch
                  checked={paymentSettings.bankTransfer.enabled}
                  onCheckedChange={(checked) => setPaymentSettings({
                    ...paymentSettings,
                    bankTransfer: { ...paymentSettings.bankTransfer, enabled: checked }
                  })}
                />
              </div>
              {paymentSettings.bankTransfer.enabled && (
                <div className="ml-4 space-y-2">
                  <Label htmlFor="bank-transfer-details">Bank Transfer Details</Label>
                  <Textarea
                    id="bank-transfer-details"
                    placeholder="Bank name, account number, routing number, etc..."
                    value={paymentSettings.bankTransfer.accountDetails}
                    onChange={(e) => setPaymentSettings({
                      ...paymentSettings,
                      bankTransfer: { ...paymentSettings.bankTransfer, accountDetails: e.target.value }
                    })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setSaving(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Payment Settings
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Email Notifications</CardTitle>
              <CardDescription>Configure email alerts for different events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">New Order</p>
                  <p className="text-xs text-gray-500">Receive email when a new order is placed</p>
                </div>
                <Switch
                  checked={notificationSettings.email.newOrder}
                  onCheckedChange={(checked) => setNotificationSettings({
                    ...notificationSettings,
                    email: { ...notificationSettings.email, newOrder: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Order Shipped</p>
                  <p className="text-xs text-gray-500">Receive email when an order is shipped</p>
                </div>
                <Switch
                  checked={notificationSettings.email.orderShipped}
                  onCheckedChange={(checked) => setNotificationSettings({
                    ...notificationSettings,
                    email: { ...notificationSettings.email, orderShipped: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Order Delivered</p>
                  <p className="text-xs text-gray-500">Receive email when an order is delivered</p>
                </div>
                <Switch
                  checked={notificationSettings.email.orderDelivered}
                  onCheckedChange={(checked) => setNotificationSettings({
                    ...notificationSettings,
                    email: { ...notificationSettings.email, orderDelivered: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Customer Registration</p>
                  <p className="text-xs text-gray-500">Receive email when a new customer registers</p>
                </div>
                <Switch
                  checked={notificationSettings.email.customerRegistration}
                  onCheckedChange={(checked) => setNotificationSettings({
                    ...notificationSettings,
                    email: { ...notificationSettings.email, customerRegistration: checked }
                  })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Low Stock Alert</p>
                  <p className="text-xs text-gray-500">Receive email when product stock is low</p>
                </div>
                <Switch
                  checked={notificationSettings.email.lowStock}
                  onCheckedChange={(checked) => setNotificationSettings({
                    ...notificationSettings,
                    email: { ...notificationSettings.email, lowStock: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">SMS Notifications</CardTitle>
              <CardDescription>Configure text message alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Enable SMS Notifications</p>
                  <p className="text-xs text-gray-500">Send SMS alerts for important events</p>
                </div>
                <Switch
                  checked={notificationSettings.sms.enabled}
                  onCheckedChange={(checked) => setNotificationSettings({
                    ...notificationSettings,
                    sms: { ...notificationSettings.sms, enabled: checked }
                  })}
                />
              </div>
              {notificationSettings.sms.enabled && (
                <>
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="sms-api-key">SMS API Key</Label>
                    <Input
                      id="sms-api-key"
                      type="password"
                      placeholder="Your SMS service API key"
                      value={notificationSettings.sms.apiKey}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        sms: { ...notificationSettings.sms, apiKey: e.target.value }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg ml-4">
                    <div>
                      <p className="font-medium text-sm">New Order</p>
                      <p className="text-xs text-gray-500">Receive SMS when a new order is placed</p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms.newOrder}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                        sms: { ...notificationSettings.sms, newOrder: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg ml-4">
                    <div>
                      <p className="font-medium text-sm">Order Shipped</p>
                      <p className="text-xs text-gray-500">Receive SMS when an order is shipped</p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms.orderShipped}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                        sms: { ...notificationSettings.sms, orderShipped: checked }
                      })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Push Notifications</CardTitle>
              <CardDescription>Configure browser push notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Enable Push Notifications</p>
                  <p className="text-xs text-gray-500">Send browser push notifications</p>
                </div>
                <Switch
                  checked={notificationSettings.push.enabled}
                  onCheckedChange={(checked) => setNotificationSettings({
                    ...notificationSettings,
                    push: { ...notificationSettings.push, enabled: checked }
                  })}
                />
              </div>
              {notificationSettings.push.enabled && (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">New Order</p>
                      <p className="text-xs text-gray-500">Receive push notification for new orders</p>
                    </div>
                    <Switch
                      checked={notificationSettings.push.newOrder}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                        push: { ...notificationSettings.push, newOrder: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Order Updates</p>
                      <p className="text-xs text-gray-500">Receive push notifications for order updates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.push.orderUpdates}
                      onCheckedChange={(checked) => setNotificationSettings({
                        ...notificationSettings,
                    push: { ...notificationSettings.push, orderUpdates: checked }
                  })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setSaving(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Notification Settings
            </Button>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Brand Colors</CardTitle>
              <CardDescription>Customize your store color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={appearanceSettings.primaryColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                      placeholder="#7c3aed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={appearanceSettings.secondaryColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={appearanceSettings.secondaryColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      value={appearanceSettings.accentColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={appearanceSettings.accentColor}
                      onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Typography</CardTitle>
              <CardDescription>Customize fonts and text sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <select
                    id="font-family"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={appearanceSettings.fontFamily}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontFamily: e.target.value })}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-size">Base Font Size (px)</Label>
                  <Input
                    id="font-size"
                    type="number"
                    value={appearanceSettings.fontSize}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontSize: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Branding</CardTitle>
              <CardDescription>Upload your store logo and favicon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  placeholder="https://yourstore.com/logo.png"
                  value={appearanceSettings.logo}
                  onChange={(e) => setAppearanceSettings({ ...appearanceSettings, logo: e.target.value })}
                />
                <p className="text-xs text-gray-500">Enter the URL of your store logo</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  placeholder="https://yourstore.com/favicon.ico"
                  value={appearanceSettings.favicon}
                  onChange={(e) => setAppearanceSettings({ ...appearanceSettings, favicon: e.target.value })}
                />
                <p className="text-xs text-gray-500">Enter the URL of your favicon</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Product Card Style</CardTitle>
              <CardDescription>Choose how products are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    appearanceSettings.productCardStyle === 'modern' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAppearanceSettings({ ...appearanceSettings, productCardStyle: 'modern' })}
                >
                  <div className="h-24 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-300 rounded mb-1 w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <p className="text-xs mt-2 font-medium">Modern</p>
                </div>
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    appearanceSettings.productCardStyle === 'classic' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAppearanceSettings({ ...appearanceSettings, productCardStyle: 'classic' })}
                >
                  <div className="h-24 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-300 rounded mb-1 w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <p className="text-xs mt-2 font-medium">Classic</p>
                </div>
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    appearanceSettings.productCardStyle === 'minimal' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setAppearanceSettings({ ...appearanceSettings, productCardStyle: 'minimal' })}
                >
                  <div className="h-24 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-300 rounded mb-1 w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <p className="text-xs mt-2 font-medium">Minimal</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Custom CSS</CardTitle>
              <CardDescription>Add custom styles to your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="custom-css">Custom CSS</Label>
                <Textarea
                  id="custom-css"
                  placeholder="/* Add your custom CSS here */"
                  value={appearanceSettings.customCSS}
                  onChange={(e) => setAppearanceSettings({ ...appearanceSettings, customCSS: e.target.value })}
                  className="font-mono text-sm"
                  rows={10}
                />
                <p className="text-xs text-gray-500">Add custom CSS to override default styles</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setSaving(false)}>
              Cancel
            </Button>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Appearance Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
