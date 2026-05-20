'use client'

import { useEffect, useState } from 'react'
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
  X,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  Clock,
  Loader2,
  FileText,
  Eye,
} from 'lucide-react'

interface POItem {
  productId: string
  productName: string
  quantity: number
  unitCost: number
  variantId?: string
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  totalQuantity: number
  expectedDate: string | null
  receivedDate: string | null
  notes: string | null
  createdAt: string
  items?: POItem[]
}

interface Supplier {
  id: string
  name: string
  isActive: boolean
}

interface Product {
  id: string
  name: string
  sku: string | null
  hasVariants: boolean
}

interface ProductVariant {
  id: string
  name: string
  productId: string
  stock: number
}

export default function PurchaseOrdersPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null)

  // Create PO modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    supplierId: '',
    expectedDate: '',
    notes: '',
    items: [] as POItem[],
  })

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/purchase-orders')
      const result = await response.json()

      if (result.success) {
        setPurchaseOrders(result.data || [])
      }
    } catch (err: any) {
      console.error('Error fetching POs:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch purchase orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/suppliers?activeOnly=true')
      const result = await response.json()

      if (result.success) {
        setSuppliers(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products?isActive=true')
      const result = await response.json()

      if (result.success) {
        setProducts(result.products || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const fetchVariants = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`)
      const result = await response.json()
      setVariants(result.variants || [])
    } catch (err) {
      console.error('Error fetching variants:', err)
      setVariants([])
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
    fetchSuppliers()
    fetchProducts()
  }, [])

  const openCreateModal = () => {
    setFormData({
      supplierId: '',
      expectedDate: '',
      notes: '',
      items: [],
    })
    setVariants([])
    setIsModalOpen(true)
  }

  const addItem = () => {
    if (!formData.supplierId) {
      toast({
        title: 'Error',
        description: 'Please select a supplier first',
        variant: 'destructive',
      })
      return
    }
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', productName: '', quantity: 1, unitCost: 0, variantId: 'none' }],
    })
  }

  const updateItem = (index: number, field: keyof POItem | 'variantId', value: any) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Update product name when product is selected
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        updatedItems[index].productName = product.name
        // Fetch variants if product has variants
        if (product.hasVariants) {
          fetchVariants(value)
        }
      }
    }

    setFormData({ ...formData, items: updatedItems })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleCreate = async () => {
    if (!formData.supplierId || formData.items.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a supplier and add at least one item',
        variant: 'destructive',
      })
      return
    }

    // Validate items
    const invalidItem = formData.items.find(item => !item.productId || item.quantity <= 0 || item.unitCost <= 0)
    if (invalidItem) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all item fields with valid values',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: formData.supplierId,
          expectedDate: formData.expectedDate || null,
          notes: formData.notes || null,
          items: formData.items.map(item => ({
            productId: item.productId,
            variantId: (item as any).variantId === 'none' ? undefined : (item as any).variantId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order created successfully',
        })
        setIsModalOpen(false)
        fetchPurchaseOrders()
      } else {
        throw new Error(result.error || 'Failed to create PO')
      }
    } catch (err: any) {
      console.error('Error creating PO:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to create purchase order',
        variant: 'destructive',
      })
    }
  }

  const handleReceive = async (po: PurchaseOrder) => {
    if (!confirm(`Are you sure you want to receive PO ${po.orderNumber}? This will update inventory and costs.`)) {
      return
    }

    try {
      // Get PO details to fetch items
      const poResponse = await fetch(`/api/admin/purchase-orders/${po.id}`)
      const poResult = await poResponse.json()

      if (!poResult.success || !poResult.data.items) {
        throw new Error('Could not fetch PO items')
      }

      // Prepare received items - receive all items in full
      const receivedItems = poResult.data.items.map((item: any) => ({
        itemId: item.id,
        quantity: item.quantity,
      }))

      const response = await fetch(`/api/admin/purchase-orders/${po.id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: receivedItems }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order received successfully. Inventory updated.',
        })
        fetchPurchaseOrders()
      } else {
        throw new Error(result.error || 'Failed to receive PO')
      }
    } catch (err: any) {
      console.error('Error receiving PO:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to receive purchase order',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = async (po: PurchaseOrder) => {
    if (!confirm(`Are you sure you want to cancel PO ${po.orderNumber}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/purchase-orders/${po.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Purchase order cancelled successfully',
        })
        fetchPurchaseOrders()
      } else {
        throw new Error(result.error || 'Failed to cancel PO')
      }
    } catch (err: any) {
      console.error('Error cancelling PO:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel purchase order',
        variant: 'destructive',
      })
    }
  }

  const handleView = async (po: PurchaseOrder) => {
    try {
      const response = await fetch(`/api/admin/purchase-orders/${po.id}`)
      const result = await response.json()

      if (result.success) {
        setViewPO(result.data)
        setViewModalOpen(true)
      }
    } catch (err) {
      console.error('Error fetching PO details:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch PO details',
        variant: 'destructive',
      })
    }
  }

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch =
      po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      RECEIVED: { label: 'Received', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
    }
    return configs[status as keyof typeof configs] || configs.PENDING
  }

  const totalPOAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
  const totalPOQuantity = formData.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage purchase orders from suppliers</p>
        </div>
        <Button onClick={openCreateModal} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total POs</p>
                <p className="text-2xl font-bold mt-1">{purchaseOrders.length}</p>
              </div>
              <FileText className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{purchaseOrders.filter(p => p.status === 'PENDING').length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Received</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{purchaseOrders.filter(p => p.status === 'RECEIVED').length}</p>
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
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{purchaseOrders.filter(p => p.status === 'CANCELLED').length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PO Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search POs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RECEIVED">Received</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No purchase orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">PO Number</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Supplier</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Total Qty</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Total Amount</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Expected Date</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map((po) => {
                  const statusConfig = getStatusConfig(po.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <TableRow key={po.id} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-gray-900">{po.orderNumber}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{po.supplierName || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">{po.totalQuantity}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">৳{po.totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusConfig.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(po)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {po.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReceive(po)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Truck className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(po)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create PO Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="overflow-x-hidden sm:rounded-lg max-h-[90vh] overflow-y-auto max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>Add products and set pricing for a new purchase order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Supplier *</Label>
                <Select value={formData.supplierId} onValueChange={(val) => { setFormData({ ...formData, supplierId: val }); setVariants([]); }}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expectedDate">Expected Date</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Items</Label>
              <div className="mt-2 space-y-2">
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId)
                  const hasVariants = product?.hasVariants
                  return (
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1 space-y-2">
                        <Select value={item.productId} onValueChange={(val) => updateItem(index, 'productId', val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} {product.sku && `(${product.sku})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {hasVariants && variants.length > 0 && (
                          <Select
                            value={(item as any).variantId || 'none'}
                            onValueChange={(val) => updateItem(index, 'variantId', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select variant" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No variant</SelectItem>
                              {variants.map(variant => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Cost"
                          value={item.unitCost}
                          onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="w-32 text-sm text-gray-600 flex items-center">
                        ৳{(item.quantity * item.unitCost).toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="w-full border-dashed"
                  disabled={!formData.supplierId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {formData.items.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Items: {totalPOQuantity}</p>
                  <p className="text-xs text-gray-500">Total PO Value</p>
                </div>
                <p className="text-2xl font-bold text-violet-700">৳{totalPOAmount.toFixed(2)}</p>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes for this purchase order..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.supplierId || formData.items.length === 0}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              {viewPO?.orderNumber} - {viewPO?.supplierName}
            </DialogDescription>
          </DialogHeader>
          {viewPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="font-medium">{viewPO.status}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <div className="text-sm">{new Date(viewPO.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expected Date</Label>
                  <div className="text-sm">{viewPO.expectedDate ? new Date(viewPO.expectedDate).toLocaleDateString() : '-'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Received Date</Label>
                  <div className="text-sm">{viewPO.receivedDate ? new Date(viewPO.receivedDate).toLocaleDateString() : '-'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Quantity</Label>
                  <div className="font-medium">{viewPO.totalQuantity}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <div className="font-medium">৳{viewPO.totalAmount.toFixed(2)}</div>
                </div>
                {viewPO.notes && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <div className="text-sm">{viewPO.notes}</div>
                  </div>
                )}
              </div>

              {viewPO.items && viewPO.items.length > 0 && (
                <div>
                  <Label className="mb-2 block">Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewPO.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{item.productName || 'Unknown Product'}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">৳{item.unitCost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell className="text-right">৳{(item.quantity * item.unitCost).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
