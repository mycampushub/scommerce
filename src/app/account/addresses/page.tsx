'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { MapPin, Plus, Edit, Trash2, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'

interface Address {
  id: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  district?: string
  division: string
  postalCode?: string
  isDefault: boolean
  createdAt: string
}

function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    division: '',
    postalCode: '',
    isDefault: false
  })

  // Bangladesh divisions
  const bangladeshDivisions = [
    'Dhaka',
    'Chittagong',
    'Khulna',
    'Rajshahi',
    'Barisal',
    'Sylhet',
    'Rangpur',
    'Mymensingh'
  ]

  // Fetch addresses
  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('session')
      if (!token) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAddresses(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      toast.error('Failed to load addresses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem('session')
      if (!token) {
        toast.error('Please log in to manage addresses')
        return
      }

      const url = editingAddress ? `/api/addresses/${editingAddress.id}` : '/api/addresses'
      const method = editingAddress ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully')
          setIsDialogOpen(false)
          setEditingAddress(null)
          resetForm()
          fetchAddresses()
        } else {
          toast.error(data.error || 'Failed to save address')
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save address')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      district: address.district || '',
      division: address.division,
      postalCode: address.postalCode || '',
      isDefault: address.isDefault
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return
    }

    try {
      const token = localStorage.getItem('session')
      if (!token) {
        toast.error('Please log in to manage addresses')
        return
      }

      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Address deleted successfully')
          fetchAddresses()
        } else {
          toast.error(data.error || 'Failed to delete address')
        }
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      const token = localStorage.getItem('session')
      if (!token) {
        toast.error('Please log in to manage addresses')
        return
      }

      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isDefault: true })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Default address updated successfully')
          fetchAddresses()
        } else {
          toast.error(data.error || 'Failed to update default address')
        }
      }
    } catch (error) {
      console.error('Error setting default address:', error)
      toast.error('Failed to update default address')
    }
  }

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      division: 'Dhaka',
      postalCode: '',
      isDefault: false
    })
  }

  const openNewAddressDialog = () => {
    setEditingAddress(null)
    resetForm()
    setIsDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading addresses...</p>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
                <p className="text-gray-600 mt-1">
                  {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'}
                </p>
              </div>
              <Link href="/account/settings">
                <Button variant="outline">Back to Settings</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Add Address Button */}
        <div className="container mx-auto px-4 py-4">
          <Button onClick={openNewAddressDialog} className="w-full sm:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Add New Address
          </Button>
        </div>

        {/* Address List */}
        <div className="container mx-auto px-4 py-6">
          {addresses.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No addresses saved
                </h3>
                <p className="text-gray-600 mb-6">
                  Add your first address to make checkout faster
                </p>
                <Button onClick={openNewAddressDialog} className="mx-auto">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Address
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {addresses.map((address) => (
                <Card key={address.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    {address.isDefault && (
                      <div className="flex items-center text-green-600 text-sm mb-4">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Default Address
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{address.fullName}</p>
                      <p className="text-sm text-gray-600">{address.phone}</p>
                      <p className="text-sm text-gray-700">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}{address.district && `, ${address.district}`}
                        {address.postalCode && ` - ${address.postalCode}`}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {address.division}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-6 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(address)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={address.isDefault}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {address.isDefault ? 'Default' : 'Set Default'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />

      {/* Add/Edit Address Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] overflow-x-hidden" aria-describedby="address-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
            <DialogDescription id="address-dialog-description">
              {editingAddress ? 'Update your address details' : 'Add a new address to your address book'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1 *</Label>
              <Input
                id="addressLine1"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="Street address, house number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="Apartment, suite, unit, building, floor, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="District name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="division">Division *</Label>
                <select
                  id="division"
                  required
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                >
                  <option value="">Select Division</option>
                  {bangladeshDivisions.map((division) => (
                    <option key={division} value={division}>{division}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Set as default address
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                {editingAddress ? 'Update Address' : 'Save Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AddressBookPage
