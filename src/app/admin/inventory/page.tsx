'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  MoreVertical,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PackagePlus,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string | null
  stock: number
  lowStockAlert: number
  reorderLevel: number
  reorderQty: number
  category: {
    name: string
  } | null
  createdAt: string
}

interface InventoryAlert {
  id: string
  productId: string
  alertType: string
  quantity: number
  isRead: boolean
  isResolved: boolean
  createdAt: string
  product: Product
}

export default function InventoryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [alertFilter, setAlertFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds default

  // Add Stock modal state
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [addStockQty, setAddStockQty] = useState<number>(0)

  // Edit Stock modal state
  const [isEditStockOpen, setIsEditStockOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editStockQty, setEditStockQty] = useState<number>(0)
  const [editLowStockAlert, setEditLowStockAlert] = useState<number>(0)
  const [editReorderLevel, setEditReorderLevel] = useState<number>(0)
  const [editReorderQty, setEditReorderQty] = useState<number>(0)

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchAlerts()])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching data:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    const response = await fetch('/api/admin/products')
    const result = await response.json() as any

    if (result.success) {
      setProducts(result.data || [])
    }
  }

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams()
      if (alertFilter !== 'all') params.append('alertType', alertFilter.toUpperCase())
      params.append('isResolved', 'false')

      const response = await fetch(`/api/admin/inventory/alerts?${params.toString()}`)
      const result = await response.json() as any

      if (result.success) {
        setAlerts(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching alerts:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [stockFilter, alertFilter])

  // Auto-refresh polling for live stock updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchData()
      toast({
        title: 'Data Updated',
        description: 'Inventory data has been refreshed',
      })
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/inventory/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Alert marked as read',
        })
        fetchAlerts()
      }
    } catch (err) {
      console.error('Error marking alert as read:', err)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/inventory/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isResolved: true }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Alert resolved',
        })
        fetchAlerts()
      }
    } catch (err) {
      console.error('Error resolving alert:', err)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/inventory/alerts/${alertId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Alert deleted',
        })
        fetchAlerts()
      }
    } catch (err) {
      console.error('Error deleting alert:', err)
    }
  }

  const handleReorder = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: product.stock + product.reorderQty,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Reordered ${product.reorderQty} units of ${product.name}`,
        })
        fetchData()
      }
    } catch (err) {
      console.error('Error reordering:', err)
      toast({
        title: 'Error',
        description: 'Failed to reorder product',
        variant: 'destructive',
      })
    }
  }

  const openAddStockModal = () => {
    setAddStockQty(10)
    setIsAddStockOpen(true)
  }

  const openEditStockModal = (product: Product) => {
    setEditingProduct(product)
    setEditStockQty(product.stock)
    setEditLowStockAlert(product.lowStockAlert)
    setEditReorderLevel(product.reorderLevel)
    setEditReorderQty(product.reorderQty)
    setIsEditStockOpen(true)
  }

  const handleEditStock = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: editStockQty,
          lowStockAlert: editLowStockAlert,
          reorderLevel: editReorderLevel,
          reorderQty: editReorderQty,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Updated stock settings for ${editingProduct.name}`,
        })
        setIsEditStockOpen(false)
        setEditingProduct(null)
        fetchData()
      }
    } catch (err) {
      console.error('Error updating stock:', err)
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      })
    }
  }

  const handleAddStock = async () => {
    if (!selectedProduct) {
      toast({
        title: 'Error',
        description: 'Please select a product first',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: selectedProduct.stock + addStockQty,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Added ${addStockQty} units to ${selectedProduct.name}`,
        })
        setIsAddStockOpen(false)
        setSelectedProduct(null)
        setAddStockQty(0)
        fetchData()
      }
    } catch (err) {
      console.error('Error adding stock:', err)
      toast({
        title: 'Error',
        description: 'Failed to add stock',
        variant: 'destructive',
      })
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return 'out-of-stock'
    if (product.stock < product.lowStockAlert) return 'low-stock'
    return 'in-stock'
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const stockStatus = getStockStatus(product)
    const matchesStock = stockFilter === 'all' || stockStatus === stockFilter
    return matchesSearch && matchesStock
  })

  const stats = products.reduce(
    (acc, product) => {
      acc.total++
      if (product.stock > 0) acc.inStock++
      if (product.stock > 0 && product.stock < product.lowStockAlert) acc.lowStock++
      if (product.stock === 0) acc.outOfStock++
      return acc
    },
    { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
  )

  const getAlertTypeConfig = (type: string) => {
    const configs = {
      LOW_STOCK: { label: 'Low Stock', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
      OUT_OF_STOCK: { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: XCircle },
      REORDER_NEEDED: { label: 'Reorder Needed', color: 'bg-yellow-100 text-yellow-700', icon: PackagePlus },
    }
    return configs[type as keyof typeof configs] || configs.LOW_STOCK
  }

  const exportAlerts = () => {
    const csvContent = [
      ['Alert ID', 'Product Name', 'Alert Type', 'Quantity', 'Created At', 'Status'].join(','),
      ...alerts.map(alert =>
        [
          alert.id,
          alert.product.name,
          alert.alertType,
          alert.quantity,
          alert.createdAt,
          alert.isResolved ? 'Resolved' : 'Active'
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-alerts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: 'Success',
      description: 'Alerts exported successfully',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product stock and inventory alerts</p>
        </div>
        <div className="flex gap-2">
          <Select value={refreshInterval.toString()} onValueChange={(val) => setRefreshInterval(parseInt(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Refresh every" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15000">15 seconds</SelectItem>
              <SelectItem value="30000">30 seconds</SelectItem>
              <SelectItem value="60000">1 minute</SelectItem>
              <SelectItem value="120000">2 minutes</SelectItem>
              <SelectItem value="300000">5 minutes</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            onClick={openAddStockModal}
          >
            <PackagePlus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Products</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">In Stock</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.inStock}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStock}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Alerts */}
      <Card className="border-0 shadow-lg border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Inventory Alerts ({alerts.length})
            </CardTitle>
            <div className="flex gap-2">
              <Select value={alertFilter} onValueChange={setAlertFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter alerts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="reorder_needed">Reorder Needed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportAlerts} disabled={alerts.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">No active inventory alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = getAlertTypeConfig(alert.alertType)
                const Icon = config.icon
                return (
                  <div key={alert.id} className={`p-4 rounded-lg border ${alert.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-orange-200 shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-gray-900">{alert.product.name}</p>
                            {!alert.isRead && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {config.label} - {alert.quantity} units remaining
                          </p>
                          <p className="text-xs text-gray-400">
                            Alert created {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(alert.product)}
                          className="text-xs"
                        >
                          Reorder (+{alert.product.reorderQty})
                        </Button>
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="text-xs"
                          >
                            Mark Read
                          </Button>
                        )}
                        {!alert.isResolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                            className="text-xs text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-xs text-red-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Product</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Category</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Low Stock Alert</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Reorder Level</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Reorder Qty</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-violet-600">
                          {product.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{product.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-100">
                        {product.category?.name || 'Uncategorized'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <button
                          onClick={() => openEditStockModal(product)}
                          className={`font-semibold hover:underline cursor-pointer bg-transparent border-none p-0 ${
                            product.stock === 0 ? 'text-red-600' :
                            product.stock < product.lowStockAlert ? 'text-orange-600' :
                            'text-gray-900'
                          }`}
                        >
                          {product.stock}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">{product.lowStockAlert}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">{product.reorderLevel}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">{product.reorderQty}</p>
                    </TableCell>
                    <TableCell>
                      <StockStatusBadge status={getStockStatus(product)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(product)}
                          className="h-8"
                        >
                          <PackagePlus className="h-3 w-3 mr-1" />
                          +{product.reorderQty}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent className="overflow-x-hidden sm:rounded-lg" aria-describedby="add-stock-description">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription id="add-stock-description">Select a product and add stock quantity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="product-select">Select Product</Label>
              <Select
                value={selectedProduct?.id || ''}
                onValueChange={(val) => {
                  const product = products.find(p => p.id === val)
                  setSelectedProduct(product || null)
                }}
              >
                <SelectTrigger id="product-select">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (Current: {product.stock} units)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stock-qty">Quantity to Add</Label>
              <Input
                id="stock-qty"
                type="number"
                min="1"
                value={addStockQty}
                onChange={(e) => setAddStockQty(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
              />
            </div>
            {selectedProduct && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{selectedProduct.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Current Stock: {selectedProduct.stock}
                </p>
                <p className="text-sm text-gray-600">
                  New Stock: {selectedProduct.stock + addStockQty}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddStockOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStock}
              disabled={!selectedProduct}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={isEditStockOpen} onOpenChange={setIsEditStockOpen}>
        <DialogContent className="overflow-x-hidden sm:rounded-lg" aria-describedby="edit-stock-description">
          <DialogHeader>
            <DialogTitle>Edit Stock Settings</DialogTitle>
            <DialogDescription id="edit-stock-description">Update stock levels and alert thresholds for {editingProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingProduct && (
              <>
                <div>
                  <Label htmlFor="edit-stock-qty">Current Stock Level</Label>
                  <Input
                    id="edit-stock-qty"
                    type="number"
                    min="0"
                    value={editStockQty}
                    onChange={(e) => setEditStockQty(parseInt(e.target.value) || 0)}
                    placeholder="Current stock quantity"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the new stock quantity</p>
                </div>
                <div>
                  <Label htmlFor="edit-low-stock">Low Stock Alert Level</Label>
                  <Input
                    id="edit-low-stock"
                    type="number"
                    min="0"
                    value={editLowStockAlert}
                    onChange={(e) => setEditLowStockAlert(parseInt(e.target.value) || 0)}
                    placeholder="Alert when stock below this level"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: {editingProduct.lowStockAlert}</p>
                </div>
                <div>
                  <Label htmlFor="edit-reorder-level">Reorder Level</Label>
                  <Input
                    id="edit-reorder-level"
                    type="number"
                    min="0"
                    value={editReorderLevel}
                    onChange={(e) => setEditReorderLevel(parseInt(e.target.value) || 0)}
                    placeholder="Stock level to trigger reorder"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: {editingProduct.reorderLevel}</p>
                </div>
                <div>
                  <Label htmlFor="edit-reorder-qty">Reorder Quantity</Label>
                  <Input
                    id="edit-reorder-qty"
                    type="number"
                    min="1"
                    value={editReorderQty}
                    onChange={(e) => setEditReorderQty(parseInt(e.target.value) || 0)}
                    placeholder="Quantity to reorder when stock is low"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: {editingProduct.reorderQty}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>{editingProduct.name}</strong>
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Current Stock: <span className="font-semibold">{editingProduct.stock}</span></p>
                    <p>Will Update To: <span className="font-semibold text-violet-600">{editStockQty}</span></p>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditStockOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditStock}
              disabled={!editingProduct}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StockStatusBadge({ status }: { status: string }) {
  const config = {
    'in-stock': { color: 'bg-green-100 text-green-700', label: 'In Stock' },
    'low-stock': { color: 'bg-orange-100 text-orange-700', label: 'Low Stock' },
    'out-of-stock': { color: 'bg-red-100 text-red-700', label: 'Out of Stock' },
  }

  const { color, label } = config[status as keyof typeof config] || config['in-stock']

  return (
    <Badge variant="secondary" className={color}>
      {label}
    </Badge>
  )
}
