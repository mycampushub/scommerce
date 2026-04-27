'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Calendar,
  Star,
  Ban,
  Download,
  Filter,
  Users,
  CheckCircle,
  Loader2,
  XCircle,
  UserPlus,
  Eye,
  RefreshCw,
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  orders?: number
  totalSpent: number
  status: 'active' | 'inactive' | 'banned'
  isVIP: boolean
  joined: string
  avatar?: string | null
}

export default function CustomersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Form state
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
    isVIP: false,
  })

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/customers?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setCustomers(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch customers')
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching customers:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const openAddModal = () => {
    setAddFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    })
    setIsAddModalOpen(true)
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      status: customer.status,
      isVIP: customer.isVIP,
    })
    setIsEditModalOpen(true)
  }

  const openDetailModal = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailModalOpen(true)
    setLoadingOrders(true)
    try {
      const response = await fetch(`/api/admin/orders?userId=${customer.id}`)
      const result = await response.json()
      if (result.success) {
        setCustomerOrders(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addFormData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Customer created successfully',
        })
        setIsAddModalOpen(false)
        setAddFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
        })
        fetchCustomers()
      } else {
        throw new Error(result.error || 'Failed to create customer')
      }
    } catch (err: any) {
      console.error('Error adding customer:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to add customer',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      const response = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        })
        setIsEditModalOpen(false)
        fetchCustomers()
      } else {
        throw new Error(result.error || 'Failed to update customer')
      }
    } catch (err: any) {
      console.error('Error updating customer:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update customer',
        variant: 'destructive',
      })
    }
  }

  const handleToggleVIP = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVIP: !customer.isVIP,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: customer.isVIP ? 'VIP status removed' : 'Customer marked as VIP',
        })
        fetchCustomers()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to toggle VIP status',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Error toggling VIP status:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to toggle VIP status',
        variant: 'destructive',
      })
    }
  }

  const handleBanCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to ban ${customer.name}? This action will prevent them from placing orders.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'banned',
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: `${customer.name} has been banned`,
        })
        fetchCustomers()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to ban customer',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Error banning customer:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to ban customer',
        variant: 'destructive',
      })
    }
  }

  const handleUnbanCustomer = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: `${customer.name} has been unbanned`,
        })
        fetchCustomers()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to unban customer',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Error unbanning customer:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to unban customer',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Customer deleted successfully',
        })
        fetchCustomers()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete customer',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('Error deleting customer:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete customer',
        variant: 'destructive',
      })
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = customers.reduce(
    (acc, customer) => {
      acc.total++
      if (customer.status === 'active') acc.active++
      if (customer.isVIP) acc.vip++
      if (customer.status === 'banned') acc.banned++
      if (customer.status === 'inactive') acc.inactive++
      return acc
    },
    { total: 0, active: 0, inactive: 0, banned: 0, vip: 0 }
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const exportCustomers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Address', 'Orders', 'Total Spent', 'Status', 'VIP', 'Joined Date'].join(','),
      ...customers.map(customer => [
        customer.name,
        customer.email,
        customer.phone || '',
        customer.address || '',
        customer.orders || 0,
        customer.totalSpent.toFixed(2),
        customer.status,
        customer.isVIP ? 'Yes' : 'No',
        formatDate(customer.joined),
      ]).join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Success',
      description: 'Customers exported successfully',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer accounts and relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Customers</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Inactive</p>
                <p className="text-2xl font-bold mt-1">{stats.inactive}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Banned</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{stats.banned}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <Ban className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">VIP Customers</p>
                <p className="text-2xl font-bold mt-1 text-purple-600">{stats.vip}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Star className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchCustomers} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700">Orders</TableHead>
                  <TableHead className="font-semibold text-gray-700">Total Spent</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">VIP</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24">
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No customers found</p>
                          <p className="text-sm text-gray-400">Click "Add Customer" to create one</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                            {customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                            {customer.isVIP && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 ml-2">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                VIP
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span>{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{customer.orders || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">${customer.totalSpent.toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900">{formatDate(customer.joined)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.status === 'active' ? 'default' : customer.status === 'banned' ? 'destructive' : 'secondary'}
                          className={customer.status === 'active' ? 'bg-green-100 text-green-700' : customer.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDetailModal(customer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(customer)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Edit Customer
                            </DropdownMenuItem>
                            {!customer.isVIP && (
                              <DropdownMenuItem onClick={() => handleToggleVIP(customer)}>
                                <Star className="h-4 w-4 mr-2" />
                                Mark as VIP
                              </DropdownMenuItem>
                            )}
                            {customer.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handleBanCustomer(customer)} className="text-red-600">
                                <Ban className="h-4 w-4 mr-2" />
                                Ban Customer
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUnbanCustomer(customer)} className="text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unban Customer
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteCustomer(customer)} className="text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Create a new customer account
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer}>
              Add Customer
            </Button>
          </DialogFooter>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={addFormData.email}
                onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01712345678"
                value={addFormData.phone}
                onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="123 Main Street, City"
                value={addFormData.address}
                onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                rows={3}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Update customer information
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCustomer}>
              Update Customer
            </Button>
          </DialogFooter>
          <form onSubmit={handleUpdateCustomer} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john@example.com"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="01712345678"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                placeholder="123 Main Street, City"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.isVIP}
                  onChange={(e) => setEditFormData({ ...editFormData, isVIP: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Mark as VIP</span>
              </label>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            View complete customer information and order history
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            <Button onClick={() => openEditModal(selectedCustomer!)}>Edit</Button>
          </DialogFooter>
          {selectedCustomer && (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-xl">
                    {selectedCustomer.name.substring(0, 2)}
                  </div>
                  {selectedCustomer.isVIP && (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      VIP Customer
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{selectedCustomer.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-sm text-gray-900 break-all-words">{selectedCustomer.address || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge
                      variant={selectedCustomer.status === 'active' ? 'default' : selectedCustomer.status === 'banned' ? 'destructive' : 'secondary'}
                      className={selectedCustomer.status === 'active' ? 'bg-green-100 text-green-700' : selectedCustomer.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="text-sm font-medium text-gray-900">{selectedCustomer.orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Spent</p>
                    <p className="text-sm font-medium text-gray-900">${selectedCustomer.totalSpent.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Joined Date</p>
                    <p className="text-sm text-gray-900">{formatDate(selectedCustomer.joined)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">VIP Status</p>
                    <Badge variant={selectedCustomer.isVIP ? 'outline' : 'secondary'}>
                      {selectedCustomer.isVIP ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  )
}
