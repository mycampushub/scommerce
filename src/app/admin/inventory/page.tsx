'use client'

import React from 'react'
import Link from 'next/link'
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
  RefreshCw,
  ArrowRight,
  FileText,
  BarChart3,
  GitCompare,
  ChevronDown,
  ChevronRight,
  Layers
} from 'lucide-react'

interface ProductVariant {
  id: string
  sku: string
  name: string
  price: number
  comparePrice: number | null
  stock: number
  lowStockAlert: number
  reorderLevel: number
  reorderQty: number
  size: string | null
  color: string | null
  material: string | null
  isActive: boolean
  isDefault: boolean
  sizeType?: 'unit' | 'label' | null
  sizeValue?: number | null
  sizeUnit?: string | null
  sizeLabel?: string | null
  countryOfOrigin?: string | null
  averageCost?: number | null
  totalCost?: number | null
  totalPurchased?: number | null
  totalSold?: number | null
  costPrice?: number | null
}

interface Product {
  id: string
  name: string
  slug: string
  sku?: string | null
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
  hasVariants: boolean
  brandName?: string | null
  brandLogo?: string | null
  countryOfOrigin?: string | null
  sizeType?: 'unit' | 'label' | null
  sizeValue?: number | null
  sizeUnit?: string | null
  sizeLabel?: string | null
  averageCost?: number | null
  totalCost?: number | null
  lastPurchaseAt?: string | null
  lastPurchaseCost?: number | null
  totalPurchased?: number | null
  totalSold?: number | null
  variants?: ProductVariant[]
}

interface InventoryAlert {
  id: string
  productId: string | null
  variantId: string | null
  alertType: string
  quantity: number
  isRead: boolean
  isResolved: boolean
  createdAt: string
  product: Product
  variant?: ProductVariant
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
  const [brandFilter, setBrandFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [sizeTypeFilter, setSizeTypeFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30000)

  // Expanded products for variant view
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  // Add Stock modal state
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [addStockQty, setAddStockQty] = useState<number>(0)
  const [addStockError, setAddStockError] = useState<string>('')

  // Edit Stock modal state
  const [isEditStockOpen, setIsEditStockOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [editStockQty, setEditStockQty] = useState<number>(0)
  const [editLowStockAlert, setEditLowStockAlert] = useState<number>(0)
  const [editReorderLevel, setEditReorderLevel] = useState<number>(0)
  const [editReorderQty, setEditReorderQty] = useState<number>(0)
  const [editStockErrors, setEditStockErrors] = useState<Record<string, string>>({})

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
      // Map category fields to match frontend expectations
      const productsWithCategory = (result.products || []).map((p: any) => ({
        ...p,
        category: {
          id: p.categoryId,
          name: p.categoryName || null,
          slug: p.categorySlug || null,
        },
      }))

      const productsWithVariants = await Promise.all(
        productsWithCategory.map(async (product: Product) => {
          if (product.hasVariants) {
            const variantsResponse = await fetch(`/api/admin/products/${product.id}/variants`)
            const variantsResult = await variantsResponse.json() as any
            return {
              ...product,
              variants: variantsResult.variants || [],
            }
          }
          return product
        })
      )
      setProducts(productsWithVariants)
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

  const handleReorder = async (product: Product, variant?: ProductVariant) => {
    try {
      const endpoint = variant
        ? `/api/admin/products/${product.id}/variants/${variant.id}`
        : `/api/admin/products/${product.id}`

      const currentStock = variant ? variant.stock : product.stock
      const reorderQty = variant ? variant.reorderQty : product.reorderQty

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: currentStock + reorderQty,
        }),
      })

      if (response.ok) {
        const item = variant ? `${variant.name} (${variant.sku})` : product.name
        toast({
          title: 'Success',
          description: `Reordered ${reorderQty} units of ${item}`,
        })
        fetchData()
      }
    } catch (err) {
      console.error('Error reordering:', err)
      toast({
        title: 'Error',
        description: 'Failed to reorder',
        variant: 'destructive',
      })
    }
  }

  const toggleExpandProduct = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const openAddStockModal = (product: Product, variant?: ProductVariant) => {
    setSelectedProduct(product)
    setSelectedVariant(variant || null)
    setAddStockQty(10)
    setAddStockError('')
    setIsAddStockOpen(true)
  }

  const openEditStockModal = (product: Product, variant?: ProductVariant) => {
    setEditingProduct(product)
    setEditingVariant(variant || null)
    setEditStockQty(variant ? variant.stock : product.stock)
    setEditLowStockAlert(variant ? variant.lowStockAlert : product.lowStockAlert)
    setEditReorderLevel(variant ? variant.reorderLevel : product.reorderLevel)
    setEditReorderQty(variant ? variant.reorderQty : product.reorderQty)
    setEditStockErrors({})
    setIsEditStockOpen(true)
  }

  const handleEditStock = async () => {
    if (!editingProduct && !editingVariant) {
      toast({
        title: 'Validation Error',
        description: 'Please select a product or variant first',
        variant: 'destructive',
      })
      return
    }

    // Validate form
    const errors: Record<string, string> = {}
    
    if (editStockQty < 0) {
      errors.editStockQty = 'Stock quantity must be zero or positive'
    }
    if (editLowStockAlert < 0) {
      errors.editLowStockAlert = 'Low stock alert must be zero or positive'
    }
    if (editReorderLevel < 0) {
      errors.editReorderLevel = 'Reorder level must be zero or positive'
    }
    if (editReorderQty < 1) {
      errors.editReorderQty = 'Reorder quantity must be at least 1'
    }
    
    if (Object.keys(errors).length > 0) {
      setEditStockErrors(errors)
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    try {
      if (!editingProduct) {
        toast({
          title: 'Error',
          description: 'No product selected',
          variant: 'destructive',
        })
        return
      }

      const endpoint = editingVariant
        ? `/api/admin/products/${editingProduct.id}/variants/${editingVariant.id}`
        : `/api/admin/products/${editingProduct.id}`

      const response = await fetch(endpoint, {
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
        const itemName = editingVariant ? editingVariant.name : editingProduct.name
        toast({
          title: 'Success',
          description: `Updated stock settings for ${itemName}`,
        })
        setIsEditStockOpen(false)
        setEditingProduct(null)
        setEditingVariant(null)
        setEditStockErrors({})
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
        title: 'Validation Error',
        description: 'A product must be selected',
        variant: 'destructive',
      })
      return
    }

    // Check if variant is required but not selected
    if (selectedProduct.hasVariants && !selectedVariant) {
      setAddStockError('Please select a variant for this product')
      toast({
        title: 'Validation Error',
        description: 'Please select a variant for this product',
        variant: 'destructive',
      })
      return
    }

    // Validate quantity - must be a positive integer
    if (addStockQty <= 0 || !Number.isInteger(addStockQty)) {
      setAddStockError('Quantity must be a positive whole number (1 or more)')
      toast({
        title: 'Validation Error',
        description: 'Quantity must be a positive whole number (1 or more)',
        variant: 'destructive',
      })
      return
    }

    try {
      const endpoint = selectedVariant
        ? `/api/admin/products/${selectedProduct.id}/variants/${selectedVariant.id}`
        : `/api/admin/products/${selectedProduct.id}`

      const currentStock = selectedVariant ? selectedVariant.stock : selectedProduct.stock

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: currentStock + addStockQty,
        }),
      })

      if (response.ok) {
        const itemName = selectedVariant ? selectedVariant.name : selectedProduct.name
        toast({
          title: 'Success',
          description: `Added ${addStockQty} units to ${itemName}`,
        })
        setIsAddStockOpen(false)
        setSelectedProduct(null)
        setSelectedVariant(null)
        setAddStockQty(0)
        setAddStockError('')
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

  const getStockStatus = (stock: number, lowStockAlert: number) => {
    if (stock === 0) return 'out-of-stock'
    if (stock < lowStockAlert) return 'low-stock'
    return 'in-stock'
  }

  const getTotalStock = (product: Product) => {
    if (product.hasVariants && product.variants) {
      return product.variants.reduce((sum, v) => sum + v.stock, 0)
    }
    return product.stock
  }

  const getAverageLowStockAlert = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      return Math.round(product.variants.reduce((sum, v) => sum + v.lowStockAlert, 0) / product.variants.length)
    }
    return product.lowStockAlert
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.slug.toLowerCase().includes(searchTerm.toLowerCase())

    // For products with variants, also check variant names
    const matchesVariantSearch = product.hasVariants && product.variants
      ? product.variants.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      : false

    const totalStock = getTotalStock(product)
    const avgLowStock = getAverageLowStockAlert(product)
    const stockStatus = getStockStatus(totalStock, avgLowStock)

    const matchesStock = stockFilter === 'all' || stockStatus === stockFilter
    const matchesBrand = brandFilter === 'all' || (brandFilter === 'unbranded' ? !product.brandName : product.brandName === brandFilter)
    const matchesCountry = countryFilter === 'all' || (countryFilter === 'unspecified' ? !product.countryOfOrigin : product.countryOfOrigin === countryFilter)
    const matchesSizeType = sizeTypeFilter === 'all' || product.sizeType === sizeTypeFilter

    return (matchesSearch || matchesVariantSearch) && matchesStock && matchesBrand && matchesCountry && matchesSizeType
  })

  const brands = Array.from(new Set(products.map(p => p.brandName).filter(Boolean)))
  const countries = Array.from(new Set(products.map(p => p.countryOfOrigin).filter(Boolean)))

  const totalInventoryValue = products.reduce((sum, p) => {
    let stockValue = 0
    if (p.hasVariants && p.variants) {
      stockValue = p.variants.reduce((variantSum, v) => {
        if (v.stock > 0 && v.averageCost && v.averageCost !== null) {
          return variantSum + (v.stock * v.averageCost)
        }
        return variantSum
      }, 0)
    } else if (p.stock > 0 && p.averageCost) {
      stockValue = p.stock * p.averageCost
    }
    return sum + stockValue
  }, 0)

  const stats = products.reduce(
    (acc, product) => {
      acc.total++
      const totalStock = getTotalStock(product)
      const avgLowStock = getAverageLowStockAlert(product)

      if (totalStock > 0) acc.inStock++
      if (totalStock > 0 && totalStock < avgLowStock) acc.lowStock++
      if (totalStock === 0) acc.outOfStock++

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
      ['Alert ID', 'Product', 'Variant', 'Alert Type', 'Quantity', 'Created At', 'Status'].join(','),
      ...alerts.map(alert =>
        [
          alert.id,
          alert.product.name,
          alert.variant ? alert.variant.name : '-',
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
          <p className="text-sm text-gray-500 mt-1">Manage product and variant stock levels</p>
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
            onClick={() => openAddStockModal(products[0])}
          >
            <PackagePlus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/admin/inventory" className="group">
          <Card className="border-2 border-violet-500 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-violet-600 transition-colors">Stock Overview</p>
                  <p className="text-xs text-gray-500">View all products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/inventory/movements" className="group">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-violet-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <GitCompare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-violet-600 transition-colors">Movements</p>
                  <p className="text-xs text-gray-500">Track inventory changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/inventory/adjustments" className="group">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-violet-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-violet-600 transition-colors">Adjustments</p>
                  <p className="text-xs text-gray-500">Stock corrections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/inventory/reports" className="group">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-violet-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-violet-600 transition-colors">Reports</p>
                  <p className="text-xs text-gray-500">Analytics & insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/suppliers" className="group">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-violet-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-violet-600 transition-colors">Suppliers</p>
                  <p className="text-xs text-gray-500">Manage vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Inventory Value</p>
                <p className="text-2xl font-bold mt-1">৳{totalInventoryValue.toLocaleString('en-BD')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white/80" />
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
                const itemName = alert.variant
                  ? `${alert.product.name} - ${alert.variant.name}`
                  : alert.product.name

                const item = alert.variant || alert.product
                const reorderQty = alert.variant ? alert.variant.reorderQty : alert.product.reorderQty

                return (
                  <div key={alert.id} className={`p-4 rounded-lg border ${alert.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-orange-200 shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-full ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm text-gray-900">{itemName}</p>
                            {alert.variant && (
                              <Badge variant="outline" className="text-xs">
                                {alert.variant.sku}
                              </Badge>
                            )}
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
                          onClick={() => handleReorder(alert.product, alert.variant)}
                          className="text-xs"
                        >
                          Reorder (+{reorderQty})
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
                placeholder="Search products or variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="unbranded">No Brand</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="unspecified">Unspecified</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country!}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sizeTypeFilter} onValueChange={setSizeTypeFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Size Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="unit">Unit Size</SelectItem>
                <SelectItem value="label">Label Size</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
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
          <div className="w-full overflow-x-auto -mx-4 px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[40px]"></TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Product/Variant</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">SKU</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Attributes</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Stock</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-right min-w-[120px]">Avg Cost</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-right min-w-[130px]">Total Cost</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const totalStock = getTotalStock(product)
                  const avgLowStock = getAverageLowStockAlert(product)
                  const stockStatus = getStockStatus(totalStock, avgLowStock)
                  const isExpanded = expandedProducts.has(product.id)
                  const hasVariants = product.hasVariants && product.variants && product.variants.length > 0

                  return (
                    <React.Fragment key={product.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>
                          {hasVariants && (
                            <button
                              onClick={() => toggleExpandProduct(product.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                              {product.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900">{product.name}</p>
                              {hasVariants && (
                                <p className="text-xs text-gray-500">{product.variants?.length} variants</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {!hasVariants ? (
                            <Badge variant="outline" className="text-xs font-mono">
                              {product.sku || product.slug || '-'}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-100 whitespace-nowrap">
                            {product.category?.name || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 space-y-1">
                            {product.brandName && (
                              <div className="flex items-center gap-2">
                                {product.brandLogo && (
                                  <img src={product.brandLogo} alt={product.brandName} className="h-4 w-4 object-contain rounded" />
                                )}
                                <span className="truncate">{product.brandName}</span>
                              </div>
                            )}
                            {product.sizeType === 'label' && product.sizeLabel && (
                              <div>Size: {product.sizeLabel}</div>
                            )}
                            {product.sizeType === 'unit' && product.sizeValue && product.sizeUnit && (
                              <div>Size: {product.sizeValue} {product.sizeUnit}</div>
                            )}
                            {product.countryOfOrigin && (
                              <div>🇦🇧 {product.countryOfOrigin}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <button
                              onClick={() => openEditStockModal(product)}
                              className={`font-semibold hover:underline cursor-pointer bg-transparent border-none p-0 whitespace-nowrap ${
                                totalStock === 0 ? 'text-red-600' :
                                totalStock < avgLowStock ? 'text-orange-600' :
                                'text-gray-900'
                              }`}
                            >
                              {totalStock}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {product.averageCost ? `৳${product.averageCost.toFixed(2)}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {product.totalCost ? `৳${product.totalCost.toLocaleString('en-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StockStatusBadge status={stockStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReorder(product)}
                              className="h-8"
                            >
                              <PackagePlus className="h-3 w-3 mr-1 flex-shrink-0" />
                              +{product.reorderQty}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Variant rows */}
                      {isExpanded && hasVariants && product.variants?.map((variant) => {
                        const variantStatus = getStockStatus(variant.stock, variant.lowStockAlert)
                        return (
                          <TableRow key={variant.id} className="bg-violet-50/50 hover:bg-violet-100/50">
                            <TableCell></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 min-w-[200px] pl-6">
                                <div className="h-8 w-8 rounded bg-violet-200 flex items-center justify-center text-xs font-bold text-violet-700 flex-shrink-0">
                                  <Layers className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{variant.name}</p>
                                  <p className="text-xs text-gray-500">{variant.sku}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-mono">
                                {variant.sku}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-400">-</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600 space-y-1">
                                {variant.size && <div>Size: {variant.size}</div>}
                                {variant.color && <div>Color: {variant.color}</div>}
                                {variant.material && <div>Material: {variant.material}</div>}
                                {variant.countryOfOrigin && <div>🇦🇧 {variant.countryOfOrigin}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <button
                                  onClick={() => openEditStockModal(product, variant)}
                                  className={`font-semibold hover:underline cursor-pointer bg-transparent border-none p-0 whitespace-nowrap ${
                                    variant.stock === 0 ? 'text-red-600' :
                                    variant.stock < variant.lowStockAlert ? 'text-orange-600' :
                                    'text-gray-900'
                                  }`}
                                >
                                  {variant.stock}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                {variant.averageCost ? `৳${variant.averageCost.toFixed(2)}` : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                {variant.totalCost ? `৳${variant.totalCost.toLocaleString('en-BD', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <StockStatusBadge status={variantStatus} />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReorder(product, variant)}
                                  className="h-8"
                                >
                                  <PackagePlus className="h-3 w-3 mr-1 flex-shrink-0" />
                                  +{variant.reorderQty}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Stock Dialog */}
      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent className="overflow-x-hidden sm:rounded-lg" aria-describedby="add-stock-description">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription id="add-stock-description">
              {selectedVariant
                ? `Add stock to variant: ${selectedVariant.name}`
                : 'Select a product and add stock quantity'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProduct && (
              <div>
                <Label htmlFor="product-select">Product (Optional)</Label>
                <Input
                  value={selectedProduct.name}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            )}
            {selectedProduct?.hasVariants && !selectedVariant && (
              <div>
                <Label htmlFor="variant-select">Select Variant *</Label>
                <Select
                  value=""
                  onValueChange={(val) => {
                    const variant = selectedProduct?.variants?.find(v => v.id === val)
                    setSelectedVariant(variant || null)
                    setAddStockError('')
                  }}
                >
                  <SelectTrigger id="variant-select">
                    <SelectValue placeholder="Choose a variant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct?.variants?.map(variant => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name} (Current: {variant.stock} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addStockError && addStockError.includes('variant') && (
                  <p className="text-xs text-destructive mt-1">{addStockError}</p>
                )}
              </div>
            )}
            <div>
              <Label htmlFor="stock-qty">Quantity to Add *</Label>
              <Input
                id="stock-qty"
                type="number"
                min="1"
                value={addStockQty}
                onChange={(e) => {
                  setAddStockQty(parseInt(e.target.value) || 0)
                  setAddStockError('')
                }}
                placeholder="Enter quantity (must be positive integer)"
                className={addStockError ? 'border-destructive' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">Must be a positive whole number (1 or more)</p>
              {addStockError && (
                <p className="text-xs text-destructive mt-1">{addStockError}</p>
              )}
            </div>
            {(selectedVariant || selectedProduct) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>{selectedVariant ? selectedVariant.name : selectedProduct?.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Current Stock: {selectedVariant ? selectedVariant.stock : selectedProduct?.stock}
                </p>
                <p className="text-sm text-gray-600">
                  New Stock: {(selectedVariant ? selectedVariant.stock : selectedProduct?.stock || 0) + addStockQty}
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
              disabled={!selectedProduct || (selectedProduct.hasVariants && !selectedVariant)}
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
            <DialogDescription id="edit-stock-description">
              Update stock levels and alert thresholds for {editingVariant ? editingVariant.name : editingProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(editingProduct || editingVariant) && (
              <>
                {editingProduct && !editingVariant && (
                  <div>
                    <Label htmlFor="product-name">Product (Optional)</Label>
                    <Input
                      id="product-name"
                      value={editingProduct.name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}
                {editingVariant && (
                  <div>
                    <Label htmlFor="variant-name">Variant (Optional)</Label>
                    <Input
                      id="variant-name"
                      value={`${editingProduct?.name} - ${editingVariant.name} (${editingVariant.sku})`}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="edit-stock-qty">Current Stock Level *</Label>
                  <Input
                    id="edit-stock-qty"
                    type="number"
                    min="0"
                    value={editStockQty}
                    onChange={(e) => {
                      setEditStockQty(parseInt(e.target.value) || 0)
                      setEditStockErrors(prev => ({ ...prev, editStockQty: '' }))
                    }}
                    placeholder="Current stock quantity"
                    className={editStockErrors.editStockQty ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the new stock quantity</p>
                  {editStockErrors.editStockQty && (
                    <p className="text-xs text-destructive mt-1">{editStockErrors.editStockQty}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-low-stock">Low Stock Alert Level *</Label>
                  <Input
                    id="edit-low-stock"
                    type="number"
                    min="0"
                    value={editLowStockAlert}
                    onChange={(e) => {
                      setEditLowStockAlert(parseInt(e.target.value) || 0)
                      setEditStockErrors(prev => ({ ...prev, editLowStockAlert: '' }))
                    }}
                    placeholder="Alert when stock below this level"
                    className={editStockErrors.editLowStockAlert ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: {editingVariant ? editingVariant.lowStockAlert : editingProduct?.lowStockAlert}</p>
                  {editStockErrors.editLowStockAlert && (
                    <p className="text-xs text-destructive mt-1">{editStockErrors.editLowStockAlert}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-reorder-level">Reorder Level *</Label>
                  <Input
                    id="edit-reorder-level"
                    type="number"
                    min="0"
                    value={editReorderLevel}
                    onChange={(e) => {
                      setEditReorderLevel(parseInt(e.target.value) || 0)
                      setEditStockErrors(prev => ({ ...prev, editReorderLevel: '' }))
                    }}
                    placeholder="Stock level to trigger reorder"
                    className={editStockErrors.editReorderLevel ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: {editingVariant ? editingVariant.reorderLevel : editingProduct?.reorderLevel}</p>
                  {editStockErrors.editReorderLevel && (
                    <p className="text-xs text-destructive mt-1">{editStockErrors.editReorderLevel}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-reorder-qty">Reorder Quantity *</Label>
                  <Input
                    id="edit-reorder-qty"
                    type="number"
                    min="1"
                    value={editReorderQty}
                    onChange={(e) => {
                      setEditReorderQty(parseInt(e.target.value) || 0)
                      setEditStockErrors(prev => ({ ...prev, editReorderQty: '' }))
                    }}
                    placeholder="Quantity to reorder when stock is low"
                    className={editStockErrors.editReorderQty ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Current: {editingVariant ? editingVariant.reorderQty : editingProduct?.reorderQty}</p>
                  {editStockErrors.editReorderQty && (
                    <p className="text-xs text-destructive mt-1">{editStockErrors.editReorderQty}</p>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>{editingVariant ? editingVariant.name : editingProduct?.name}</strong>
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Current Stock: <span className="font-semibold">{editingVariant ? editingVariant.stock : editingProduct?.stock}</span></p>
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
              disabled={!editingProduct && !editingVariant}
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
