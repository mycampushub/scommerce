'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { escapeCSVField, arrayToCSV, downloadCSV } from '@/lib/csv-utils'
import { Skeleton } from '@/components/ui/skeleton'

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

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)

  // Intersection Observer ref
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const fetchCustomers = async (pageNum: number = 1, append: boolean = false) => {
    if (append && isLoadingMore) return

    try {
      if (!append) setLoading(true)
      else setIsLoadingMore(true)

      const params = new URLSearchParams()
      params.append('page', pageNum.toString())
      params.append('limit', '20')
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/customers?${params.toString()}`)
      const result = await response.json() as any

      if (result.success) {
        if (append) {
          setCustomers(prev => [...prev, ...(Array.isArray(result.data) ? result.data : [])])
        } else {
          setCustomers(Array.isArray(result.data) ? result.data : [])
        }

        if (result.pagination) {
          setHasMore(result.pagination.hasNextPage)
          setTotal(result.pagination.totalCount)
          setPage(pageNum)
        }
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
      if (!append) setLoading(false)
      else setIsLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !loading) {
      fetchCustomers(page + 1, true)
    }
  }, [hasMore, isLoadingMore, loading, page])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore()
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [sentinelRef, hasMore, isLoadingMore, loading, loadMore])

  useEffect(() => {
    fetchCustomers(1, false)
  }, [])

  useEffect(() => {
    fetchCustomers(1, false)
  }, [statusFilter])

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
      const result = await response.json() as any
      if (result.success) {
        setCustomerOrders(result.data || [])
      }
    } catch (err: any) {
      console.error('Error fetching customer orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addFormData),
      })

      const result = await response.json() as any

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
        fetchCustomers(1, false)
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      const result = await response.json() as any

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        })
        setIsEditModalOpen(false)
        fetchCustomers(1, false)
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
    } finally {
      setIsSubmitting(false)
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

      const result = await response.json() as any

      if (result.success) {
        toast({
          title: 'Success',
          description: customer.isVIP ? 'VIP status removed' : 'Customer marked as VIP',
        })
        fetchCustomers(1, false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to toggle VIP status',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
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

      const result = await response.json() as any

      if (result.success) {
        toast({
          title: 'Success',
          description: `${customer.name} has been banned`,
        })
        fetchCustomers(1, false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to ban customer',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
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

      const result = await response.json() as any

      if (result.success) {
        toast({
          title: 'Success',
          description: `${customer.name} has been unbanned`,
        })
        fetchCustomers(1, false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to unban customer',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
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

      const result = await response.json() as any

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Customer deleted successfully',
        })
        fetchCustomers(1, false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete customer',
          variant: 'destructive',
        })
      }
    } catch (err: any) {
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
    if (!dateStr) return 'Invalid Date'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const exportCustomers = () => {
    const csvData = customers.map(customer => ({
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone || '',
      Address: customer.address || '',
      Orders: customer.orders || 0,
      'Total Spent': (customer.totalSpent || 0).toFixed(2),
      Status: customer.status,
      VIP: customer.isVIP ? 'Yes' : 'No',
      'Joined Date': formatDate(customer.joined),
    }))

    const csvContent = arrayToCSV(csvData)
    downloadCSV(csvContent, `customers-export-${new Date().toISOString().split('T')[0]}.csv`)

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
          <Button variant="outline" onClick={exportCustomers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={openAddModal} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
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
            <Button variant="outline" onClick={() => fetchCustomers(1, false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          {total > 0 && (
            <div className="text-xs text-gray-500">
              Showing {customers.length} of {total} customers
              {!hasMore && customers.length < total && <span className="ml-2"> (all loaded)</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Customer</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[250px]">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Orders</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Total Spent</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Joined</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">VIP</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-12" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
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
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div
                            className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {customer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                            {customer.isVIP && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 ml-2">
                                <Star className="h-3 w-3 mr-1 fill-current flex-shrink-0" />
                                VIP
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[250px]">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="break-all">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="break-all">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 whitespace-nowrap">{customer.orders || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900 whitespace-nowrap">${(customer.totalSpent || 0).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900 whitespace-nowrap">{formatDate(customer.joined)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={customer.status === 'active' ? 'default' : customer.status === 'banned' ? 'destructive' : 'secondary'}
                          className={customer.status === 'active' ? 'bg-green-100 text-green-700' : customer.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More options">
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
                            {!customer.isVIP ? (
                              <DropdownMenuItem onClick={() => handleToggleVIP(customer)}>
                                <Star className="h-4 w-4 mr-2" />
                                Mark as VIP
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleToggleVIP(customer)}>
                                <Star className="h-4 w-4 mr-2" />
                                Remove VIP
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
                {isLoadingMore && (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={9}>
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                          <span className="ml-2 text-sm text-gray-500">Loading more customers...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div ref={sentinelRef} className="h-4" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md w-full overflow-x-hidden sm:rounded-lg" aria-describedby="add-customer-description">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription id="add-customer-description">
              Create a new customer account
            </DialogDescription>
          </DialogHeader>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md w-full overflow-x-hidden sm:rounded-lg" aria-describedby="edit-customer-description">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription id="edit-customer-description">
              Update customer information
            </DialogDescription>
          </DialogHeader>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md w-full overflow-x-hidden sm:rounded-lg" aria-describedby="customer-detail-description">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription id="customer-detail-description">
              View complete customer information and order history
            </DialogDescription>
          </DialogHeader>
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
                    {selectedCustomer.status ? selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1) : 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-sm font-medium text-gray-900">{selectedCustomer.orders || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-sm font-medium text-gray-900">${(selectedCustomer.totalSpent || 0).toFixed(2)}</p>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
            <Button type="button" onClick={() => openEditModal(selectedCustomer!)}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
