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

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your store configuration and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
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
                  <Input id="store-name" defaultValue="Fashion Store" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Store Email</Label>
                  <Input id="store-email" type="email" defaultValue="store@fashion.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone Number</Label>
                <Input id="store-phone" type="tel" defaultValue="+1 234 567 890" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="UTC" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" defaultValue="USD ($)" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Store Status</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Enable Store</p>
                    <p className="text-xs text-gray-500">Allow customers to browse and purchase</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Maintenance Mode</p>
                    <p className="text-xs text-gray-500">Temporarily disable store access</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Analytics & Tracking */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Analytics & Tracking</CardTitle>
              <CardDescription className="text-gray-500">Connect analytics and tracking platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { name: 'Google Analytics 4', key: 'GA_MEASUREMENT_ID', desc: 'Track user behavior and conversions', connected: false, placeholder: 'G-XXXXXXXXXX' },
                  { name: 'Google Tag Manager', key: 'GTM_ID', desc: 'Manage all your tracking codes', connected: false, placeholder: 'GTM-XXXXXX' },
                  { name: 'Google Search Console', key: 'GOOGLE_SITE_VERIFICATION', desc: 'Monitor and maintain your site presence', connected: false, placeholder: 'Verification code' },
                  { name: 'Facebook Pixel', key: 'FACEBOOK_PIXEL_ID', desc: 'Track Facebook ad conversions', connected: false, placeholder: 'XXXXXXXXXXXXXXXX' },
                ].map((integration, i) => (
                  <div key={i} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        <p className="font-medium text-sm text-gray-900">{integration.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{integration.desc}</p>
                      <div className="mt-3 space-y-2">
                        <Label htmlFor={integration.key} className="text-xs font-medium">API Key / ID</Label>
                        <Input
                          id={integration.key}
                          type="password"
                          placeholder={integration.placeholder}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <Badge variant={integration.connected ? 'default' : 'outline'}>
                      {integration.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Gateways */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Payment Gateways</CardTitle>
              <CardDescription className="text-gray-500">Configure payment processing integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { name: 'Stripe', desc: 'Accept credit cards worldwide', keys: ['Publishable Key', 'Secret Key'], connected: false },
                  { name: 'PayPal', desc: 'Popular payment method', keys: ['Client ID', 'Secret'], connected: false },
                  { name: 'bKash', desc: 'Bangladesh mobile payment', keys: ['App Key', 'App Secret'], connected: false },
                  { name: 'Nagad', desc: 'Bangladesh mobile payment', keys: ['Merchant ID', 'Public Key'], connected: false },
                ].map((gateway, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-gray-600" />
                          <p className="font-medium text-sm text-gray-900">{gateway.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{gateway.desc}</p>
                      </div>
                      <Badge variant={gateway.connected ? 'default' : 'outline'}>
                        {gateway.connected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    {gateway.keys.map((keyName, j) => (
                      <div key={j} className="space-y-2">
                        <Label htmlFor={`${gateway.name}-${keyName}`} className="text-xs font-medium">{keyName}</Label>
                        <Input
                          id={`${gateway.name}-${keyName}`}
                          type="password"
                          placeholder={`Enter ${keyName}`}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Integrations */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Integrations</CardTitle>
              <CardDescription className="text-gray-500">Connect shipping carriers for real-time rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { name: 'Pathao', desc: 'Local delivery in Bangladesh', keys: ['API Key', 'Store ID'], connected: false },
                  { name: 'SteadFast', desc: 'Logistics solutions', keys: ['API Key', 'Secret Key'], connected: false },
                  { name: 'Paperfly', desc: 'Courier services', keys: ['API Key', 'Client ID'], connected: false },
                ].map((carrier, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-5 w-5 text-gray-600" />
                          <p className="font-medium text-sm text-gray-900">{carrier.name}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{carrier.desc}</p>
                      </div>
                      <Badge variant={carrier.connected ? 'default' : 'outline'}>
                        {carrier.connected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    {carrier.keys.map((keyName, j) => (
                      <div key={j} className="space-y-2">
                        <Label htmlFor={`${carrier.name}-${keyName}`} className="text-xs font-medium">{keyName}</Label>
                        <Input
                          id={`${carrier.name}-${keyName}`}
                          type="password"
                          placeholder={`Enter ${keyName}`}
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              <Save className="h-4 w-4 mr-2" />
              Save Integrations
            </Button>
          </div>
        </TabsContent>

        {/* Store Settings */}
        <TabsContent value="store" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Store Details</CardTitle>
              <CardDescription className="text-gray-500">Information about your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input id="business-name" defaultValue="Fashion Inc." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-address">Business Address</Label>
                <Textarea id="business-address" rows={3} defaultValue="123 Fashion Street, New York, NY 10001" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tax-id">Tax ID</Label>
                  <Input id="tax-id" placeholder="Enter tax ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-type">Business Type</Label>
                  <Input id="business-type" defaultValue="LLC" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Store Description</h3>
                <div className="space-y-2">
                  <Label htmlFor="store-desc">About Your Store</Label>
                  <Textarea id="store-desc" rows={4} defaultValue="Welcome to Fashion Store - your destination for trendy and traditional clothing." />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Shipping Settings</CardTitle>
              <CardDescription className="text-gray-500">Configure shipping options and rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="free-shipping-threshold">Free Shipping Threshold</Label>
                <Input id="free-shipping-threshold" type="number" defaultValue="50" />
                <p className="text-xs text-gray-500">Orders above this amount get free shipping</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-shipping-fee">Default Shipping Fee</Label>
                <Input id="default-shipping-fee" type="number" defaultValue="5.99" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Shipping Zones</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Domestic (USA)', rate: '$5.99', days: '3-5' },
                    { name: 'Canada', rate: '$12.99', days: '5-7' },
                    { name: 'International', rate: '$19.99', days: '7-14' },
                  ].map((zone, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{zone.name}</p>
                        <p className="text-xs text-gray-500">{zone.days} business days</p>
                      </div>
                      <Badge variant="outline">{zone.rate}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <Truck className="h-4 w-4 mr-2" />
                  Add Shipping Zone
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Payment Methods</CardTitle>
              <CardDescription className="text-gray-500">Configure payment gateways</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { name: 'Stripe', desc: 'Accept credit cards worldwide', connected: true },
                { name: 'PayPal', desc: 'Popular payment method', connected: true },
                { name: 'Cash on Delivery', desc: 'Pay when you receive', connected: false },
                { name: 'Bank Transfer', desc: 'Direct bank transfer', connected: false },
              ].map((method, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                  </div>
                  {method.connected ? (
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  ) : (
                    <Button variant="outline" size="sm">Connect</Button>
                  )}
                </div>
              ))}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Refund Policy</h3>
                <div className="space-y-2">
                  <Label htmlFor="refund-days">Refund Period (Days)</Label>
                  <Input id="refund-days" type="number" defaultValue="30" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-500">Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                {[
                  { label: 'New order received', desc: 'Get notified when a new order is placed' },
                  { label: 'Low stock alert', desc: 'Get notified when products are low on stock' },
                  { label: 'Out of stock', desc: 'Get notified when products are out of stock' },
                  { label: 'Customer registration', desc: 'Get notified when a new customer registers' },
                  { label: 'Order status changes', desc: 'Get notified when order status is updated' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={i < 3} />
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Admin Alerts</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">Push Notifications</p>
                    <p className="text-xs text-gray-500">Receive alerts in browser</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Store Appearance</CardTitle>
              <CardDescription className="text-gray-500">Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Brand Colors</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: 'Primary Color', value: '#8b5cf6' },
                    { label: 'Secondary Color', value: '#6366f1' },
                    { label: 'Accent Color', value: '#a855f7' },
                  ].map((color, i) => (
                    <div key={i} className="space-y-2">
                      <Label htmlFor={color.label}>{color.label}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={color.label}
                          type="color"
                          defaultValue={color.value}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          defaultValue={color.value}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Logo</h3>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                    FS
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">Store Logo</p>
                    <p className="text-xs text-gray-500">Recommended: 200x200px PNG</p>
                  </div>
                  <Button variant="outline">Upload</Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
