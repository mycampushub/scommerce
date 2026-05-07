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
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

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

  // Save handler
  const handleSave = async () => {
    if (saving) return

    setSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: generalSettings.storeName,
          siteEmail: generalSettings.storeEmail,
          contactPhone: generalSettings.storePhone,
          timezone: generalSettings.timezone,
          currency: generalSettings.currency,
          businessName: generalSettings.businessName,
          businessAddress: generalSettings.businessAddress,
          taxId: generalSettings.taxId,
          businessType: generalSettings.businessType,
          storeDesc: generalSettings.storeDesc,
          enableStore: generalSettings.enableStore,
          maintenanceMode: generalSettings.maintenanceMode,
        }),
      })

      const data = await response.json() as any

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
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

        {/* Integrations Tab - Placeholder - Simplified for now */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Analytics & Tracking</CardTitle>
              <CardDescription>Connect analytics and tracking platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">Analytics & Tracking integrations coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Tab - Placeholder */}
        <TabsContent value="store" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Store Details</CardTitle>
              <CardDescription className="text-gray-500">Information about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">Store settings in General Settings tab.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Tab - Placeholder */}
        <TabsContent value="shipping" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Settings</CardTitle>
              <CardDescription className="text-gray-500">Configure shipping options and rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">Shipping settings in General Settings tab.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab - Placeholder */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Payment Gateways</CardTitle>
              <CardDescription className="text-gray-500">Configure payment processing integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">Payment settings in General Settings tab.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab - Placeholder */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 SettingsPage-shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-0">Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">Notification settings in General Settings tab.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab - Placeholder */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Store Appearance</CardTitle>
              <CardDescription>Customize your store look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-500">Appearance settings in General Settings tab.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={saving}>
          Cancel
        </Button>
        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
