'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from 'lucide-react'

interface Supplier {
  id: string
  code: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  isActive: number | boolean
  createdAt: string
}

export default function SuppliersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)

  // Intersection Observer ref
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    notes: '',
    isActive: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSuppliers = async (pageNum: number = 1, append: boolean = false) => {
    if (append && isLoadingMore) return

    try {
      if (!append) setLoading(true)
      else setIsLoadingMore(true)

      const params = new URLSearchParams()
      params.append('page', pageNum.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/admin/suppliers?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        if (append) {
          setSuppliers(prev => [...prev, ...(result.data || [])])
        } else {
          setSuppliers(result.data || [])
        }

        if (result.pagination) {
          setHasMore(result.pagination.hasNextPage)
          setTotal(result.pagination.totalCount)
          setPage(pageNum)
        }
      }
    } catch (err: any) {
      console.error('Error fetching suppliers:', err)
      if (!append) {
        toast({
          title: 'Error',
          description: 'Failed to fetch suppliers',
          variant: 'destructive',
        })
      }
    } finally {
      if (!append) setLoading(false)
      else setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchSuppliers(1, false)
  }, [])

  // Load more data when sentinel is visible
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !loading) {
      fetchSuppliers(page + 1, true)
    }
  }, [hasMore, isLoadingMore, loading, page])

  // Setup IntersectionObserver
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

  const openAddModal = () => {
    setEditingSupplier(null)
    setFormData({
      code: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      notes: '',
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      code: supplier.code,
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      notes: supplier.notes || '',
      isActive: typeof supplier.isActive === 'boolean' ? supplier.isActive : supplier.isActive === 1,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      const url = editingSupplier
        ? `/api/admin/suppliers/${editingSupplier.id}`
        : '/api/admin/suppliers'

      const response = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully',
        })
        setIsModalOpen(false)
        fetchSuppliers(1, false)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save supplier')
      }
    } catch (err: any) {
      console.error('Error saving supplier:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to save supplier',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Supplier deleted successfully',
        })
        fetchSuppliers(1, false)
      } else {
        throw new Error(result.error || 'Failed to delete supplier')
      }
    } catch (err: any) {
      console.error('Error deleting supplier:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete supplier',
        variant: 'destructive',
      })
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.code && supplier.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.phone && supplier.phone.includes(searchTerm))

    const matchesActive = activeFilter === 'all' || (activeFilter === 'active' ? (typeof supplier.isActive === 'boolean' ? supplier.isActive : supplier.isActive === 1) : !(typeof supplier.isActive === 'boolean' ? supplier.isActive : supplier.isActive === 1))

    return matchesSearch && matchesActive
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your suppliers and vendors</p>
        </div>
        <Button onClick={openAddModal} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Suppliers</p>
                <p className="text-2xl font-bold mt-1">{total}</p>
              </div>
              <Building2 className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Suppliers</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{suppliers.filter(s => s.isActive).length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Inactive Suppliers</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{suppliers.filter(s => !s.isActive).length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {total > 0 && (
            <div className="text-xs text-gray-500">
              Showing {suppliers.length} of {total} suppliers
              {!hasMore && suppliers.length < total && <span className="ml-2"> (all loaded)</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No suppliers found</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Code</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">Supplier</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[250px]">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Location</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-gray-50">
                    <TableCell>
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">{supplier.code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[180px]">
                        <p className="font-medium text-sm text-gray-900">{supplier.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[250px]">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[200px]">
                        {supplier.address && (
                          <p className="text-xs text-gray-600 truncate">{supplier.address}</p>
                        )}
                        {(supplier.city || supplier.country) && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{supplier.city && `${supplier.city}, `}{supplier.country}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeof supplier.isActive === 'boolean' ? (supplier.isActive ? 'default' : 'secondary') : (supplier.isActive === 1 ? 'default' : 'secondary')} className={typeof supplier.isActive === 'boolean' ? (supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700') : (supplier.isActive === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700')}>
                        {typeof supplier.isActive === 'boolean' ? (supplier.isActive ? 'Active' : 'Inactive') : (supplier.isActive === 1 ? 'Active' : 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(supplier)}
                          className="min-h-[44px] min-w-[44px] p-2"
                          aria-label="Edit supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier)}
                          className="text-red-600 hover:text-red-700 min-h-[44px] min-w-[44px] p-2"
                          aria-label="Delete supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
                {isLoadingMore && (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                          <span className="ml-2 text-sm text-gray-500">Loading more suppliers...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div ref={sentinelRef} className="h-4" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="overflow-x-hidden sm:rounded-lg max-h-[90vh] overflow-y-auto" aria-describedby="supplier-modal-description">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            <DialogDescription id="supplier-modal-description">
              {editingSupplier ? 'Update supplier information' : 'Enter supplier details to add a new supplier'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Supplier Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUP-0001"
                  disabled={!!editingSupplier}
                  className="font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
              </div>
              <div>
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City name"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country name"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <Label htmlFor="isActive" className="text-sm text-gray-700">
                Active Supplier
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || isSubmitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isSubmitting ? 'Saving...' : (editingSupplier ? 'Update' : 'Create') + ' Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
