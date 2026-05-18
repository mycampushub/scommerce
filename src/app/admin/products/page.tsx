'use client'

import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  Edit,
  Trash2,
  Eye,
  Package,
  PackagePlus,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Layers,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { ImageUpload } from '@/components/admin/image-upload'
import { VariantBuilder, GeneratedVariant } from '@/components/admin/variant-builder'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceDisplay } from '@/components/price-display'
import { apiFetch } from '@/lib/api-client'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  costPrice: number | null
  categoryId: string | null
  category: { name: string } | null
  images: string[] | null
  stock: number
  lowStockAlert: number
  reorderLevel: number
  reorderQty: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  hasVariants?: boolean
  _count?: {
    orderItems: number
  }
}

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductVariant {
  id: string
  sku: string
  name: string
  price: number
  comparePrice: number | null
  costPrice: number | null
  stock: number
  images: string[] | null
  size: string | null
  color: string | null
  material: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lowStockAlert?: number
  reorderLevel?: number
  reorderQty?: number
}

export default function ProductsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddVariantForm, setShowAddVariantForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    categoryId: '',
    images: [] as string[],
    stock: '',
    isActive: true,
    isFeatured: false,
  })

  // Add product modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addFormData, setAddFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    categoryId: '',
    images: [] as string[],
    stock: '0',
    size: '',
    color: '',
    material: '',
    isActive: true,
    isFeatured: false,
  })

  // Delete modal state
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)

  // Variant management modal state
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false)
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [activeVariantTab, setActiveVariantTab] = useState<'list' | 'matrix'>('list')

  // Collect unique sizes, colors, materials from existing variants for select options
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [availableColors, setAvailableColors] = useState<string[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([])

  // Variant form state
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantFormData, setVariantFormData] = useState({
    sku: '',
    name: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    stock: '',
    size: '',
    color: '',
    material: '',
    images: [] as string[],
    isDefault: false,
    isActive: true,
    lowStockAlert: '10',
    reorderLevel: '5',
    reorderQty: '20',
  })

  // Helper function to reset variant form
  const resetVariantForm = () => ({
    sku: '',
    name: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    stock: '',
    size: '',
    color: '',
    material: '',
    images: [] as string[],
    isDefault: false,
    isActive: true,
    lowStockAlert: '10',
    reorderLevel: '5',
    reorderQty: '20',
  })

  // Matrix builder state
  const [matrixSizes, setMatrixSizes] = useState('')
  const [matrixColors, setMatrixColors] = useState('')
  const [matrixMaterials, setMatrixMaterials] = useState('')
  const [matrixBasePrice, setMatrixBasePrice] = useState('')
  const [matrixStock, setMatrixStock] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)

      const response = await fetch(`/api/admin/products?${params.toString()}`)
      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch products')
      }

      // Map category fields to match frontend expectations
      const productsWithCategory = (result.data || []).map((p: any) => ({
        ...p,
        category: {
          id: p.categoryId,
          name: p.categoryName || null,
          slug: p.categorySlug || null,
        },
      }))

      setProducts(productsWithCategory)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching products:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories')
      const result = await response.json() as any

      if (result.success) {
        setCategories(result.data || [])
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [categoryFilter, statusFilter, debouncedSearchTerm])

  const handleSearch = () => {
    fetchProducts()
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setEditFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      costPrice: product.costPrice?.toString() || '',
      categoryId: product.categoryId || '',
      images: product.images || [],
      stock: product.stock.toString(),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    try {
      const response = await apiFetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'update',
        },
        body: JSON.stringify({
          name: editFormData.name,
          slug: editFormData.slug,
          description: editFormData.description,
          price: parseFloat(editFormData.price),
          comparePrice: editFormData.comparePrice ? parseFloat(editFormData.comparePrice) : null,
          costPrice: editFormData.costPrice ? parseFloat(editFormData.costPrice) : null,
          categoryId: editFormData.categoryId || null,
          images: editFormData.images,
          stock: parseInt(editFormData.stock),
          isActive: editFormData.isActive,
          isFeatured: editFormData.isFeatured,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to update product')
      }

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      })

      setIsEditModalOpen(false)
      fetchProducts()
    } catch (err: any) {
      console.error('Error updating product:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update product',
        variant: 'destructive',
      })
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await apiFetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addFormData.name,
          slug: addFormData.slug || addFormData.name.toLowerCase().replace(/\s+/g, '-'),
          description: addFormData.description,
          price: parseFloat(addFormData.price),
          comparePrice: addFormData.comparePrice ? parseFloat(addFormData.comparePrice) : null,
          costPrice: addFormData.costPrice ? parseFloat(addFormData.costPrice) : null,
          categoryId: addFormData.categoryId || null,
          images: addFormData.images,
          stock: parseInt(addFormData.stock),
          basePrice: parseFloat(addFormData.price),
          hasVariants: false,
          size: addFormData.size || null,
          color: addFormData.color || null,
          material: addFormData.material || null,
          isActive: addFormData.isActive,
          isFeatured: addFormData.isFeatured,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to create product')
      }

      toast({
        title: 'Success',
        description: 'Product created successfully',
      })

      setIsAddModalOpen(false)
      setAddFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        comparePrice: '',
        costPrice: '',
        categoryId: '',
        images: [],
        stock: '0',
        size: '',
        color: '',
        material: '',
        isActive: true,
        isFeatured: false,
      })
      fetchProducts()
    } catch (err: any) {
      console.error('Error adding product:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to create product',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return

    try {
      const response = await apiFetch(`/api/admin/products/${deleteProductId}`, {
        method: 'DELETE',
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete product')
      }

      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      })

      setDeleteProductId(null)
      fetchProducts()
    } catch (err: any) {
      console.error('Error deleting product:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete product',
        variant: 'destructive',
      })
    }
  }

  const handleReorder = async (product: Product) => {
    try {
      const response = await apiFetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: product.stock + product.reorderQty,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder product')
      }

      toast({
        title: 'Success',
        description: `Reordered ${product.reorderQty} units of ${product.name}`,
      })

      fetchProducts()
    } catch (err: any) {
      console.error('Error reordering product:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to reorder product',
        variant: 'destructive',
      })
    }
  }

  // Variant management functions
  const openVariantsModal = async (product: Product) => {
    setSelectedProductForVariants(product)
    setIsVariantsModalOpen(true)
    await fetchVariants(product.id)
  }

  const fetchVariants = async (productId: string) => {
    try {
      setVariantsLoading(true)
      const response = await fetch(`/api/admin/products/${productId}/variants`)
      const result = await response.json() as any

      if (result.success) {
        const fetchedVariants = result.data.variants || []
        setVariants(fetchedVariants)

        // Collect unique sizes, colors, materials from existing variants for select options
        const uniqueSizes = Array.from(new Set(fetchedVariants.map((v: ProductVariant) => v.size).filter(Boolean) as string[])).sort()
        const uniqueColors = Array.from(new Set(fetchedVariants.map((v: ProductVariant) => v.color).filter(Boolean) as string[])).sort()
        const uniqueMaterials = Array.from(new Set(fetchedVariants.map((v: ProductVariant) => v.material).filter(Boolean) as string[])).sort()

        setAvailableSizes(uniqueSizes)
        setAvailableColors(uniqueColors)
        setAvailableMaterials(uniqueMaterials)
      }
    } catch (err: any) {
      console.error('Error fetching variants:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch variants',
        variant: 'destructive',
      })
    } finally {
      setVariantsLoading(false)
    }
  }

  const openAddVariantModal = () => {
    setEditingVariant(null)
    setVariantFormData(resetVariantForm())
    setVariantFormData(prev => ({
      ...prev,
      isDefault: variants.length === 0,
    }))
    setShowAddVariantForm(true)
  }

  const openEditVariantModal = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setVariantFormData({
      sku: variant.sku,
      name: variant.name,
      price: variant.price.toString(),
      comparePrice: variant.comparePrice?.toString() || '',
      costPrice: variant.costPrice?.toString() || '',
      stock: variant.stock.toString(),
      size: variant.size || '',
      color: variant.color || '',
      material: variant.material || '',
      images: variant.images || [],
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      lowStockAlert: variant.lowStockAlert?.toString() || '10',
      reorderLevel: variant.reorderLevel?.toString() || '5',
      reorderQty: variant.reorderQty?.toString() || '20',
    })
    setShowAddVariantForm(true)
  }

  const handleSaveVariant = async () => {
    if (!selectedProductForVariants) return

    try {
      const payload = {
        name: variantFormData.name || `${variantFormData.size} / ${variantFormData.color}`,
        price: parseFloat(variantFormData.price),
        comparePrice: variantFormData.comparePrice ? parseFloat(variantFormData.comparePrice) : null,
        costPrice: variantFormData.costPrice ? parseFloat(variantFormData.costPrice) : null,
        stock: parseInt(variantFormData.stock),
        size: variantFormData.size || null,
        color: variantFormData.color || null,
        material: variantFormData.material || null,
        images: variantFormData.images,
        isDefault: variantFormData.isDefault,
        isActive: variantFormData.isActive,
        lowStockAlert: variantFormData.lowStockAlert ? parseInt(variantFormData.lowStockAlert) : 10,
        reorderLevel: variantFormData.reorderLevel ? parseInt(variantFormData.reorderLevel) : 5,
        reorderQty: variantFormData.reorderQty ? parseInt(variantFormData.reorderQty) : 20,
      }

      let response
      if (editingVariant) {
        // Update existing variant
        response = await apiFetch(`/api/admin/products/${selectedProductForVariants.id}/variants/${editingVariant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        // Create new variant
        response = await apiFetch(`/api/admin/products/${selectedProductForVariants.id}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to save variant')
      }

      toast({
        title: 'Success',
        description: editingVariant ? 'Variant updated successfully' : 'Variant created successfully',
      })

      await fetchVariants(selectedProductForVariants.id)
      // Also refresh the main products list to update hasVariants flag
      fetchProducts()
      setShowAddVariantForm(false)
      setVariantFormData(resetVariantForm())
    } catch (err: any) {
      console.error('Error saving variant:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to save variant',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!selectedProductForVariants) return

    try {
      const response = await apiFetch(`/api/admin/products/${selectedProductForVariants.id}/variants/${variantId}`, {
        method: 'DELETE',
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete variant')
      }

      toast({
        title: 'Success',
        description: 'Variant deleted successfully',
      })

      // Close form if deleting the variant being edited
      if (editingVariant && editingVariant.id === variantId) {
        setShowAddVariantForm(false)
        setEditingVariant(null)
      }

      await fetchVariants(selectedProductForVariants.id)
    } catch (err: any) {
      console.error('Error deleting variant:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete variant',
        variant: 'destructive',
      })
    }
  }

  const handleReorderVariant = async (variant: ProductVariant) => {
    if (!selectedProductForVariants) return

    try {
      const response = await apiFetch(`/api/admin/products/${selectedProductForVariants.id}/variants/${variant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: variant.stock + (variant.reorderQty || 20),
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder variant')
      }

      toast({
        title: 'Success',
        description: `Reordered ${variant.reorderQty || 20} units of ${variant.name}`,
      })

      await fetchVariants(selectedProductForVariants.id)
    } catch (err: any) {
      console.error('Error reordering variant:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to reorder variant',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateMatrix = async () => {
    if (!selectedProductForVariants) return

    try {
      const sizes = matrixSizes.split(',').map(s => s.trim()).filter(Boolean)
      const colors = matrixColors.split(',').map(c => c.trim()).filter(Boolean)
      const materials = matrixMaterials.split(',').map(m => m.trim()).filter(Boolean)
      const basePrice = parseFloat(matrixBasePrice) || selectedProductForVariants.price
      const stock = parseInt(matrixStock) || 0

      if (sizes.length === 0 && colors.length === 0 && materials.length === 0) {
        toast({
          title: 'Error',
          description: 'Please enter at least one size, color, or material',
          variant: 'destructive',
        })
        return
      }

      // Generate all combinations
      const combinations: Array<{ size: string | null; color: string | null; material: string | null }> = []

      sizes.forEach(size => {
        colors.forEach(color => {
          materials.forEach(material => {
            combinations.push({ size, color, material })
          })
        })
      })

      // Create variants for each combination
      for (const combo of combinations) {
        const variantName = [combo.size, combo.color, combo.material].filter(Boolean).join(' / ')
        const payload = {
          name: variantName,
          price: basePrice,
          comparePrice: null,
          stock,
          size: combo.size || null,
          color: combo.color || null,
          material: combo.material || null,
          images: [],
          isDefault: false,
          isActive: true,
        }

        await apiFetch(`/api/admin/products/${selectedProductForVariants.id}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      toast({
        title: 'Success',
        description: `Created ${combinations.length} variants successfully`,
      })

      await fetchVariants(selectedProductForVariants.id)

      // Reset matrix form
      setMatrixSizes('')
      setMatrixColors('')
      setMatrixMaterials('')
      setMatrixBasePrice('')
      setMatrixStock('')
    } catch (err: any) {
      console.error('Error generating matrix:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate variants',
        variant: 'destructive',
      })
    }
  }

  const handleVariantBuilderGenerate = async (variants: GeneratedVariant[]) => {
    if (!selectedProductForVariants) return

    try {
      // Create each variant via API - use Promise.all to ensure all complete
      const createPromises = variants.map(async (variant) => {
        const payload = {
          name: variant.name,
          price: variant.price,
          comparePrice: variant.comparePrice || null,
          costPrice: variant.costPrice || null,
          stock: variant.stock,
          size: variant.size || null,
          color: variant.color || null,
          material: variant.material || null,
          images: variant.images || [],
          isDefault: variant.isDefault,
          isActive: variant.isActive,
          lowStockAlert: variant.lowStockAlert || 10,
          reorderLevel: variant.reorderLevel || 5,
          reorderQty: variant.reorderQty || 20,
        }

        const response = await apiFetch(`/api/admin/products/${selectedProductForVariants.id}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to create variant: ${variant.name}`)
        }

        const result = await response.json() as any
        if (!result.success) {
          throw new Error(result.error || `Failed to create variant: ${variant.name}`)
        }

        return result.data
      })

      // Wait for all variants to be created
      await Promise.all(createPromises)

      toast({
        title: 'Success',
        description: `Created ${variants.length} variants successfully`,
      })

      // Refresh variants list
      await fetchVariants(selectedProductForVariants.id)
      // Also refresh the main products list to update hasVariants flag
      fetchProducts()

      // Switch to list tab to see results
      setActiveVariantTab('list')
    } catch (err: any) {
      console.error('Error generating variants:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate variants',
        variant: 'destructive',
      })
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (product.stock < product.lowStockAlert) return { label: 'Low Stock', color: 'text-orange-600', bgColor: 'bg-orange-100' }
    return { label: `${product.stock} in stock`, color: 'text-green-600', bgColor: 'bg-green-100' }
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inStock}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
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
                <TrendingDown className="h-4 w-4 text-orange-600" />
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
                <Package className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchProducts} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Product</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Price</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Stock</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Sales</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={product.images[0] || '/placeholder.svg'}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                              {product.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-100">
                          {product.category?.name || 'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <PriceDisplay value={product.price} originalPrice={product.comparePrice || undefined} showDecimals={true} className="font-semibold text-gray-900" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getStockStatus(product).bgColor}`} />
                            <span className="font-semibold text-gray-900">{product.stock}</span>
                          </div>
                          <p className="text-xs text-gray-500">Alert: {product.lowStockAlert}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{product._count?.orderItems || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.isActive ? 'default' : 'secondary'}
                          className={product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => openVariantsModal(product)}>
                              <Layers className="h-4 w-4 mr-2" />
                              Manage Variants
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {product.hasVariants ? (
                              <DropdownMenuItem disabled className="text-gray-400 cursor-not-allowed">
                                <PackagePlus className="h-4 w-4 mr-2" />
                                Use Variant Management
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleReorder(product)}>
                                <PackagePlus className="h-4 w-4 mr-2" />
                                Quick Reorder (+{product.reorderQty})
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    setDeleteProductId(product.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent aria-describedby="delete-product-description">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription id="delete-product-description">
                                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteProductId(null)}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteProduct}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto sm:rounded-lg" aria-describedby="edit-product-description">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription id="edit-product-description">Update product information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug *</label>
                <Input
                  value={editFormData.slug}
                  onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Compare Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.comparePrice}
                  onChange={(e) => setEditFormData({ ...editFormData, comparePrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.costPrice}
                  onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })}
                  placeholder="Purchase cost"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock *</label>
                <Input
                  type="number"
                  value={editFormData.stock}
                  onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={editFormData.categoryId}
                onValueChange={(value) => setEditFormData({ ...editFormData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Images</label>
              <ImageUpload
                images={editFormData.images}
                onImagesChange={(images) => setEditFormData({ ...editFormData, images })}
                maxImages={10}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.isFeatured}
                  onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600">
                Update Product
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto sm:rounded-lg" aria-describedby="add-product-description">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription id="add-product-description">Create a new product for your store</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={addFormData.slug}
                  onChange={(e) => setAddFormData({ ...addFormData, slug: e.target.value })}
                  placeholder="Auto-generated from name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={addFormData.price}
                  onChange={(e) => setAddFormData({ ...addFormData, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Compare Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={addFormData.comparePrice}
                  onChange={(e) => setAddFormData({ ...addFormData, comparePrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={addFormData.costPrice}
                  onChange={(e) => setAddFormData({ ...addFormData, costPrice: e.target.value })}
                  placeholder="Purchase cost"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Stock *</label>
                <Input
                  type="number"
                  value={addFormData.stock}
                  onChange={(e) => setAddFormData({ ...addFormData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <Input
                  value={addFormData.color}
                  onChange={(e) => setAddFormData({ ...addFormData, color: e.target.value })}
                  placeholder="e.g., Red, Blue"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Size</label>
                <Input
                  value={addFormData.size}
                  onChange={(e) => setAddFormData({ ...addFormData, size: e.target.value })}
                  placeholder="e.g., S, M, L, XL"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Material</label>
                <Input
                  value={addFormData.material}
                  onChange={(e) => setAddFormData({ ...addFormData, material: e.target.value })}
                  placeholder="e.g., Cotton, Silk"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={addFormData.categoryId}
                onValueChange={(value) => setAddFormData({ ...addFormData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Images</label>
              <ImageUpload
                images={addFormData.images}
                onImagesChange={(images) => setAddFormData({ ...addFormData, images })}
                maxImages={10}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFormData.isActive}
                  onChange={(e) => setAddFormData({ ...addFormData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addFormData.isFeatured}
                  onChange={(e) => setAddFormData({ ...addFormData, isFeatured: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600">
                Create Product
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Variant Management Modal */}
      <Dialog open={isVariantsModalOpen} onOpenChange={setIsVariantsModalOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto sm:rounded-lg" aria-describedby="manage-variants-description">
          <DialogHeader>
            <DialogTitle>Manage Variants - {selectedProductForVariants?.name}</DialogTitle>
            <DialogDescription id="manage-variants-description">Create and manage product variants (sizes, colors, materials)</DialogDescription>
          </DialogHeader>

          <Tabs value={activeVariantTab} onValueChange={(v) => setActiveVariantTab(v as 'list' | 'matrix')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Variant List</TabsTrigger>
              <TabsTrigger value="matrix">Matrix Builder</TabsTrigger>
            </TabsList>

            {/* Variant List Tab */}
            <TabsContent value="list" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Existing Variants ({variants.length})</h3>
                <Button onClick={openAddVariantModal} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </div>

              {variantsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                </div>
              ) : variants.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No variants yet</p>
                  <p className="text-sm text-gray-400">Add your first variant or use the Matrix Builder</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Variant</TableHead>
                        <TableHead className="font-semibold">SKU</TableHead>
                        <TableHead className="font-semibold">Price</TableHead>
                        <TableHead className="font-semibold">Stock</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-sm">{variant.name}</p>
                              <div className="flex gap-1 flex-wrap">
                                {variant.size && <Badge variant="outline" className="text-xs">{variant.size}</Badge>}
                                {variant.color && <Badge variant="outline" className="text-xs bg-purple-50">{variant.color}</Badge>}
                                {variant.material && <Badge variant="outline" className="text-xs bg-blue-50">{variant.material}</Badge>}
                              </div>
                              {variant.isDefault && (
                                <Badge className="text-xs bg-green-100 text-green-700">Default</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{variant.sku}</code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <PriceDisplay value={variant.price} originalPrice={variant.comparePrice || undefined} showDecimals={true} className="font-semibold" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${
                              variant.stock === 0 ? 'text-red-600' :
                              variant.stock < 5 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {variant.stock}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant.isActive ? 'default' : 'secondary'} className={
                              variant.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }>
                              {variant.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditVariantModal(variant)}
                                title="Edit variant"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleReorderVariant(variant)}
                                title="Quick reorder (+{variant.reorderQty || 20})"
                              >
                                <PackagePlus className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" title="Delete variant">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              <AlertDialogContent aria-describedby="delete-variant-description">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Variant</AlertDialogTitle>
                                  <AlertDialogDescription id="delete-variant-description">
                                    Are you sure you want to delete "{variant.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteVariant(variant.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Add/Edit Variant Form */}
              {showAddVariantForm && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4">{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <div className="flex gap-2">
                        <Input
                          value={variantFormData.sku}
                          onChange={(e) => setVariantFormData({ ...variantFormData, sku: e.target.value })}
                          placeholder="Auto-generated if empty"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Variant Name</Label>
                      <Input
                        value={variantFormData.name}
                        onChange={(e) => setVariantFormData({ ...variantFormData, name: e.target.value })}
                        placeholder="e.g., Red - XL - Cotton"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variantFormData.price}
                        onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Compare Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variantFormData.comparePrice}
                        onChange={(e) => setVariantFormData({ ...variantFormData, comparePrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variantFormData.costPrice}
                        onChange={(e) => setVariantFormData({ ...variantFormData, costPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={variantFormData.stock}
                        onChange={(e) => setVariantFormData({ ...variantFormData, stock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select
                        value={variantFormData.size}
                        onValueChange={(value) => {
                          if (value === '__custom__') {
                            const customSize = prompt('Enter custom size:')
                            if (customSize) {
                              setVariantFormData({ ...variantFormData, size: customSize })
                            }
                          } else {
                            setVariantFormData({ ...variantFormData, size: value })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSizes.length === 0 && (
                            <SelectItem value="">No sizes yet</SelectItem>
                          )}
                          {availableSizes.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">+ Add Custom Size</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select
                        value={variantFormData.color}
                        onValueChange={(value) => {
                          if (value === '__custom__') {
                            const customColor = prompt('Enter custom color:')
                            if (customColor) {
                              setVariantFormData({ ...variantFormData, color: customColor })
                            }
                          } else {
                            setVariantFormData({ ...variantFormData, color: value })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColors.length === 0 && (
                            <SelectItem value="">No colors yet</SelectItem>
                          )}
                          {availableColors.map((color) => (
                            <SelectItem key={color} value={color}>{color}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">+ Add Custom Color</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Select
                        value={variantFormData.material}
                        onValueChange={(value) => {
                          if (value === '__custom__') {
                            const customMaterial = prompt('Enter custom material:')
                            if (customMaterial) {
                              setVariantFormData({ ...variantFormData, material: customMaterial })
                            }
                          } else {
                            setVariantFormData({ ...variantFormData, material: value })
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaterials.length === 0 && (
                            <SelectItem value="">No materials yet</SelectItem>
                          )}
                          {availableMaterials.map((material) => (
                            <SelectItem key={material} value={material}>{material}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">+ Add Custom Material</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Images</Label>
                      <ImageUpload
                        images={variantFormData.images}
                        onImagesChange={(images) => setVariantFormData({ ...variantFormData, images })}
                        maxImages={5}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Low Stock Alert</Label>
                        <Input
                          type="number"
                          value={variantFormData.lowStockAlert || ''}
                          onChange={(e) => setVariantFormData({ ...variantFormData, lowStockAlert: e.target.value })}
                          placeholder="10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reorder Level</Label>
                        <Input
                          type="number"
                          value={variantFormData.reorderLevel || ''}
                          onChange={(e) => setVariantFormData({ ...variantFormData, reorderLevel: e.target.value })}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reorder Quantity</Label>
                        <Input
                          type="number"
                          value={variantFormData.reorderQty || ''}
                          onChange={(e) => setVariantFormData({ ...variantFormData, reorderQty: e.target.value })}
                          placeholder="20"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={variantFormData.isDefault}
                        onChange={(e) => setVariantFormData({ ...variantFormData, isDefault: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">Default Variant</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={variantFormData.isActive}
                        onChange={(e) => setVariantFormData({ ...variantFormData, isActive: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveVariant} className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {editingVariant ? 'Update Variant' : 'Create Variant'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowAddVariantForm(false)
                      setEditingVariant(null)
                      setVariantFormData(resetVariantForm())
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Matrix Builder Tab - Visual Variant Builder */}
            <TabsContent value="matrix" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Visual Variant Builder</h3>
                <p className="text-sm text-gray-600">
                  Create multiple variants at once by defining attributes like Size, Color, and Material. The builder will automatically generate all combinations.
                </p>
              </div>

              <VariantBuilder
                basePrice={selectedProductForVariants?.price}
                existingVariants={variants.map(v => ({
                  id: v.id,
                  sku: v.sku,
                  name: v.name,
                  price: v.price,
                  comparePrice: v.comparePrice || undefined,
                  costPrice: v.costPrice || undefined,
                  stock: v.stock,
                  size: v.size || undefined,
                  color: v.color || undefined,
                  material: v.material || undefined,
                  images: v.images || undefined,
                  isDefault: v.isDefault,
                  isActive: v.isActive,
                  lowStockAlert: v.lowStockAlert,
                  reorderLevel: v.reorderLevel,
                  reorderQty: v.reorderQty,
                }))}
                onGenerate={handleVariantBuilderGenerate}
                loading={variantsLoading}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
