'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
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
    const result = await response.json()

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
      const result = await response.json()

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
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
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
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Product</TableHead>
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                  <TableHead className="font-semibold text-gray-700">Low Stock Alert</TableHead>
                  <TableHead className="font-semibold text-gray-700">Reorder Level</TableHead>
                  <TableHead className="font-semibold text-gray-700">Reorder Qty</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
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
                        <span className={`font-semibold ${
                          product.stock === 0 ? 'text-red-600' :
                          product.stock < product.lowStockAlert ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {product.stock}
                        </span>
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
          </ScrollArea>
        </CardContent>
      </Card>
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
