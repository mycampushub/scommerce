'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Trash2, CheckCircle2, XCircle, Play, Link2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface PaymentGateway {
  id: string
  name: string
  provider: string
  isActive: boolean
  isDefault: boolean
  lastTested?: string
  testStatus?: string
}

interface ShippingCarrier {
  id: string
  name: string
  provider: string
  isActive: boolean
  isDefault: boolean
  lastTested?: string
  testStatus?: string
}

interface AnalyticsIntegration {
  id: string
  name: string
  provider: string
  trackingId?: string
  pixelId?: string
  isActive: boolean
}

interface EmailService {
  id: string
  name: string
  provider: string
  fromEmail?: string
  isActive: boolean
  isDefault: boolean
  lastTested?: string
  testStatus?: string
}

export default function IntegrationsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([])
  const [shippingCarriers, setShippingCarriers] = useState<ShippingCarrier[]>([])
  const [analyticsIntegrations, setAnalyticsIntegrations] = useState<AnalyticsIntegration[]>([])
  const [emailServices, setEmailServices] = useState<EmailService[]>([])

  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showShippingDialog, setShowShippingDialog] = useState(false)
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string; name: string }>({
    open: false,
    type: '',
    id: '',
    name: ''
  })

  // Form states
  const [paymentForm, setPaymentForm] = useState({ name: '', provider: 'stripe', apiKey: '', apiSecret: '', webhookUrl: '' })
  const [shippingForm, setShippingForm] = useState({ name: '', provider: 'fedex', apiKey: '', apiSecret: '', accountNumber: '' })
  const [analyticsForm, setAnalyticsForm] = useState({ name: '', provider: 'google', trackingId: '', pixelId: '' })
  const [emailForm, setEmailForm] = useState({ name: '', provider: 'sendgrid', apiKey: '', apiSecret: '', fromEmail: '', fromName: '' })

  // Load integrations
  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const [paymentsRes, shippingRes, analyticsRes, emailRes] = await Promise.all([
        fetch('/api/admin/integrations/payment-gateways'),
        fetch('/api/admin/integrations/shipping-carriers'),
        fetch('/api/admin/integrations/analytics'),
        fetch('/api/admin/integrations/email-services')
      ])

      const [paymentsData, shippingData, analyticsData, emailData] = await Promise.all([
        paymentsRes.json(),
        shippingRes.json(),
        analyticsRes.json(),
        emailRes.json()
      ])

      if (paymentsData.success) setPaymentGateways(paymentsData.data || [])
      if (shippingData.success) setShippingCarriers(shippingData.data || [])
      if (analyticsData.success) setAnalyticsIntegrations(analyticsData.data || [])
      if (emailData.success) setEmailServices(emailData.data || [])
    } catch (error) {
      console.error('Error loading integrations:', error)
      toast({ title: 'Error', description: 'Failed to load integrations', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIntegrations()
  }, [])

  // Test integration
  const testIntegration = async (type: string, id: string) => {
    try {
      setSaving(true)
      const endpoint = `/api/admin/integrations/${type}/${id}/test`
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: data.message })
        await loadIntegrations()
      } else {
        toast({ title: 'Error', description: data.message || 'Test failed', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Test failed', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Set default integration
  const setDefault = async (type: string, id: string) => {
    try {
      setSaving(true)
      const endpoint = `/api/admin/integrations/${type}/${id}/set-default`
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: data.message })
        await loadIntegrations()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to set default', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to set default', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Delete integration
  const deleteIntegration = async () => {
    try {
      setSaving(true)
      const endpoint = `/api/admin/integrations/${deleteDialog.type}/${deleteDialog.id}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: 'Integration deleted successfully' })
        setDeleteDialog({ open: false, type: '', id: '', name: '' })
        await loadIntegrations()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Create payment gateway
  const createPaymentGateway = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/integrations/payment-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: 'Payment gateway created' })
        setShowPaymentDialog(false)
        setPaymentForm({ name: '', provider: 'stripe', apiKey: '', apiSecret: '', webhookUrl: '' })
        await loadIntegrations()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Create shipping carrier
  const createShippingCarrier = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/integrations/shipping-carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shippingForm)
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: 'Shipping carrier created' })
        setShowShippingDialog(false)
        setShippingForm({ name: '', provider: 'fedex', apiKey: '', apiSecret: '', accountNumber: '' })
        await loadIntegrations()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Create analytics integration
  const createAnalyticsIntegration = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/integrations/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsForm)
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: 'Analytics integration created' })
        setShowAnalyticsDialog(false)
        setAnalyticsForm({ name: '', provider: 'google', trackingId: '', pixelId: '' })
        await loadIntegrations()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Create email service
  const createEmailService = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/integrations/email-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm)
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: 'Success', description: 'Email service created' })
        setShowEmailDialog(false)
        setEmailForm({ name: '', provider: 'sendgrid', apiKey: '', apiSecret: '', fromEmail: '', fromName: '' })
        await loadIntegrations()
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Gateways */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Payment Gateways</CardTitle>
              <CardDescription>Accept payments from your customers</CardDescription>
            </div>
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gateway
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Gateway</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Gateway Name</Label>
                    <Input
                      value={paymentForm.name}
                      onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                      placeholder="e.g., Stripe Production"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={paymentForm.provider}
                      onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                    >
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      value={paymentForm.apiKey}
                      onChange={(e) => setPaymentForm({ ...paymentForm, apiKey: e.target.value })}
                      placeholder="pk_live_xxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret</Label>
                    <Input
                      type="password"
                      value={paymentForm.apiSecret}
                      onChange={(e) => setPaymentForm({ ...paymentForm, apiSecret: e.target.value })}
                      placeholder="sk_live_xxxx"
                    />
                  </div>
                  <Button onClick={createPaymentGateway} disabled={saving} className="w-full">
                    {saving ? 'Creating...' : 'Create Gateway'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : paymentGateways.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payment gateways configured</p>
          ) : (
            <div className="space-y-3">
              {paymentGateways.map((gateway) => (
                <div key={gateway.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-violet-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{gateway.name}</p>
                        {gateway.isDefault && <Badge variant="default">Default</Badge>}
                        {!gateway.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{gateway.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {gateway.lastTested && (
                      <Badge variant={gateway.testStatus === 'success' ? 'default' : 'destructive'}>
                        {gateway.testStatus === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        Tested {new Date(gateway.lastTested).toLocaleDateString()}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testIntegration('payment-gateways', gateway.id)}
                      disabled={saving}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    {!gateway.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefault('payment-gateways', gateway.id)}
                        disabled={saving}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog({ open: true, type: 'payment-gateways', id: gateway.id, name: gateway.name })}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Carriers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Shipping Carriers</CardTitle>
              <CardDescription>Calculate live shipping rates</CardDescription>
            </div>
            <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Carrier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Shipping Carrier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Carrier Name</Label>
                    <Input
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                      placeholder="e.g., FedEx Production"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={shippingForm.provider}
                      onChange={(e) => setShippingForm({ ...shippingForm, provider: e.target.value })}
                    >
                      <option value="fedex">FedEx</option>
                      <option value="ups">UPS</option>
                      <option value="dhl">DHL</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      value={shippingForm.apiKey}
                      onChange={(e) => setShippingForm({ ...shippingForm, apiKey: e.target.value })}
                      placeholder="Your API key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret</Label>
                    <Input
                      type="password"
                      value={shippingForm.apiSecret}
                      onChange={(e) => setShippingForm({ ...shippingForm, apiSecret: e.target.value })}
                      placeholder="Your API secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      value={shippingForm.accountNumber}
                      onChange={(e) => setShippingForm({ ...shippingForm, accountNumber: e.target.value })}
                      placeholder="Your account number"
                    />
                  </div>
                  <Button onClick={createShippingCarrier} disabled={saving} className="w-full">
                    {saving ? 'Creating...' : 'Create Carrier'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : shippingCarriers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No shipping carriers configured</p>
          ) : (
            <div className="space-y-3">
              {shippingCarriers.map((carrier) => (
                <div key={carrier.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{carrier.name}</p>
                        {carrier.isDefault && <Badge variant="default">Default</Badge>}
                        {!carrier.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{carrier.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {carrier.lastTested && (
                      <Badge variant={carrier.testStatus === 'success' ? 'default' : 'destructive'}>
                        {carrier.testStatus === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        Tested {new Date(carrier.lastTested).toLocaleDateString()}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testIntegration('shipping-carriers', carrier.id)}
                      disabled={saving}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    {!carrier.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefault('shipping-carriers', carrier.id)}
                        disabled={saving}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog({ open: true, type: 'shipping-carriers', id: carrier.id, name: carrier.name })}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Analytics & Tracking</CardTitle>
              <CardDescription>Track visitor behavior and conversions</CardDescription>
            </div>
            <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Analytics Integration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Integration Name</Label>
                    <Input
                      value={analyticsForm.name}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, name: e.target.value })}
                      placeholder="e.g., Google Analytics 4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={analyticsForm.provider}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, provider: e.target.value })}
                    >
                      <option value="google">Google Analytics</option>
                      <option value="facebook">Facebook Pixel</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking ID / Pixel ID</Label>
                    <Input
                      value={analyticsForm.trackingId}
                      onChange={(e) => setAnalyticsForm({ ...analyticsForm, trackingId: e.target.value })}
                      placeholder="G-XXXXXXXXXX or 1234567890123456"
                    />
                  </div>
                  <Button onClick={createAnalyticsIntegration} disabled={saving} className="w-full">
                    {saving ? 'Creating...' : 'Create Integration'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : analyticsIntegrations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No analytics integrations configured</p>
          ) : (
            <div className="space-y-3">
              {analyticsIntegrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{integration.name}</p>
                        {!integration.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{integration.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog({ open: true, type: 'analytics', id: integration.id, name: integration.name })}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Email Services</CardTitle>
              <CardDescription>Send transactional emails to customers</CardDescription>
            </div>
            <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Email Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={emailForm.name}
                      onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                      placeholder="e.g., SendGrid Production"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={emailForm.provider}
                      onChange={(e) => setEmailForm({ ...emailForm, provider: e.target.value })}
                    >
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="ses">Amazon SES</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <Input
                      value={emailForm.apiKey}
                      onChange={(e) => setEmailForm({ ...emailForm, apiKey: e.target.value })}
                      placeholder="SG.xxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Secret (optional)</Label>
                    <Input
                      type="password"
                      value={emailForm.apiSecret}
                      onChange={(e) => setEmailForm({ ...emailForm, apiSecret: e.target.value })}
                      placeholder="Your API secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input
                      type="email"
                      value={emailForm.fromEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, fromEmail: e.target.value })}
                      placeholder="noreply@store.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From Name (optional)</Label>
                    <Input
                      value={emailForm.fromName}
                      onChange={(e) => setEmailForm({ ...emailForm, fromName: e.target.value })}
                      placeholder="Store Name"
                    />
                  </div>
                  <Button onClick={createEmailService} disabled={saving} className="w-full">
                    {saving ? 'Creating...' : 'Create Service'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : emailServices.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No email services configured</p>
          ) : (
            <div className="space-y-3">
              {emailServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Link2 className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{service.name}</p>
                        {service.isDefault && <Badge variant="default">Default</Badge>}
                        {!service.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-gray-500">{service.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.lastTested && (
                      <Badge variant={service.testStatus === 'success' ? 'default' : 'destructive'}>
                        {service.testStatus === 'success' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        Tested {new Date(service.lastTested).toLocaleDateString()}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testIntegration('email-services', service.id)}
                      disabled={saving}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    {!service.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefault('email-services', service.id)}
                        disabled={saving}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog({ open: true, type: 'email-services', id: service.id, name: service.name })}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent aria-describedby="delete-integration-description">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription id="delete-integration-description">
              This will permanently delete the integration "{deleteDialog.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteIntegration} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
