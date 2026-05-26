'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ImageUpload } from '@/components/admin/image-upload'
import { BrandSelector } from '@/components/admin/brand-selector'
import { CountrySelector } from '@/components/admin/country-selector'
import { SizeInput } from '@/components/admin/size-input'
import { SizeQuickSelect } from '@/components/admin/size-quick-select'
import { SizeMultiSelector, ALL_QUICK_SIZES } from '@/components/admin/size-multi-selector'
import { ColorMultiSelector } from '@/components/admin/color-multi-selector'
import { MaterialQuickSelect } from '@/components/admin/material-quick-select'
import { ColorQuickSelect } from '@/components/admin/color-quick-select'
import { VariantMatrixPreview } from '@/components/admin/variant-matrix-preview'
import { apiFetch } from '@/lib/api-client'
import { Plus, Edit2, Trash2, Package, Layers, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  costPrice: number | null
  categoryId: string | null
  category: { id?: string; name: string; slug?: string } | null
  images: string[] | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  brandId?: string | null
  brandName?: string | null
  brandLogo?: string | null
  countryOfOrigin?: string | null
  sizeType?: 'unit' | 'label' | null
  sizeValue?: number | null
  sizeUnit?: string | null
  sizeLabel?: string | null
  material?: string | null
  color?: string | null
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
  sizeType?: 'unit' | 'label' | null
  sizeValue?: number | null
  sizeUnit?: string | null
  sizeLabel?: string | null
}

interface ProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  product?: Product | null
  onSuccess?: () => void
}

export function ProductModal({ open, onOpenChange, mode, product, onSuccess }: ProductModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [editVariantData, setEditVariantData] = useState<Partial<ProductVariant>>({})
  const [isUpdatingVariant, setIsUpdatingVariant] = useState(false)

  // Multi-select system state
  const [useMultiSelectSystem, setUseMultiSelectSystem] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<Array<{ color: string; images: string[] }>>([])
  const [customSizes, setCustomSizes] = useState<string[]>([])
  const [material, setMaterial] = useState('')
  const [availableSizes] = useState<string[]>(ALL_QUICK_SIZES)
  
  // Single product size (merged unit/label)
  const [singleSize, setSingleSize] = useState('')
  // Single product material and color
  const [singleMaterial, setSingleMaterial] = useState('')
  const [singleColor, setSingleColor] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    categoryId: '',
    images: [] as string[],
    stock: '0',
    isActive: true,
    isFeatured: false,
    brandId: '',
    brandName: '',
    brandLogo: '',
    countryOfOrigin: '',
    sizeType: 'unit' as 'unit' | 'label',
    sizeValue: '',
    sizeUnit: '',
    sizeLabel: '',
  })

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/categories')
        const result = await response.json()
        if (result.success) {
          setCategories(result.data || [])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [])

  // Load product data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
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
        brandId: product.brandId || '',
        brandName: product.brandName || '',
        brandLogo: product.brandLogo || '',
        countryOfOrigin: product.countryOfOrigin || '',
        sizeType: product.sizeType || 'unit',
        sizeValue: product.sizeValue?.toString() || '',
        sizeUnit: product.sizeUnit || '',
        sizeLabel: product.sizeLabel || '',
      })
      
      // Load size for single product (backward compatible)
      if (product.sizeLabel) {
        setSingleSize(product.sizeLabel)
      } else if (product.sizeValue && product.sizeUnit) {
        setSingleSize(`${product.sizeValue}${product.sizeUnit}`)
      } else {
        setSingleSize('')
      }
      
      // Load material and color for single product
      setSingleMaterial(product.material || '')
      setSingleColor(product.color || '')
      
      // Fetch variants
      fetchProductVariants(product.id)
    } else if (mode === 'add') {
      // Reset form for add mode
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        comparePrice: '',
        costPrice: '',
        categoryId: '',
        images: [],
        stock: '0',
        isActive: true,
        isFeatured: false,
        brandId: '',
        brandName: '',
        brandLogo: '',
        countryOfOrigin: '',
        sizeType: 'unit',
        sizeValue: '',
        sizeUnit: '',
        sizeLabel: '',
      })
      setVariants([])
      // Reset multi-select state
      setSelectedSizes([])
      setSelectedColors([])
      setCustomSizes([])
      setMaterial('')
      setUseMultiSelectSystem(false)
      // Reset single product attributes
      setSingleSize('')
      setSingleMaterial('')
      setSingleColor('')
    }
  }, [mode, product, open])

  const fetchProductVariants = async (productId: string) => {
    try {
      setVariantsLoading(true)
      const response = await fetch(`/api/admin/products/${productId}/variants`)
      const result = await response.json()
      if (result.success) {
        setVariants(result.variants || [])
      }
    } catch (err) {
      console.error('Error fetching variants:', err)
    } finally {
      setVariantsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'add') {
        await handleCreateProduct()
      } else {
        await handleUpdateProduct()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async () => {
    // Validation: Check required fields
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      })
      return
    }

    if (!formData.categoryId || formData.categoryId.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      })
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      })
      return
    }

    try {
      // Check if we have variants from multi-select system
      const hasVariants = useMultiSelectSystem && selectedSizes.length > 0 && selectedColors.length > 0

      console.log('[ProductModal] Creating product:', {
        hasVariants,
        useMultiSelectSystem,
        selectedSizes,
        selectedColors: selectedColors.map(c => c.color),
      })

      const result = await apiFetch<{success: boolean; data?: any; products?: any; error?: string}>('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          basePrice: parseFloat(formData.price),
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          categoryId: formData.categoryId,
          images: formData.images,
          stock: hasVariants ? 0 : parseInt(formData.stock),
          hasVariants: hasVariants,
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          brandId: formData.brandId || null,
          brandName: formData.brandName || null,
          brandLogo: formData.brandLogo || null,
          countryOfOrigin: formData.countryOfOrigin || null,
          // Use merged size for single products, null for variants
          sizeLabel: hasVariants ? null : (singleSize || null),
          // Single product material and color (only for products without variants)
          material: hasVariants ? null : (singleMaterial || null),
          color: hasVariants ? null : (singleColor || null),
          // Include available sizes and colors for multi-select system
          availableSizes: useMultiSelectSystem ? selectedSizes : null,
          availableColors: useMultiSelectSystem ? selectedColors.map(c => c.color) : null,
        }),
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to create product')
      }

      const productId = result.data?.id || result.products?.id

      // Generate variants for multi-select system
      if (useMultiSelectSystem && selectedSizes.length > 0 && selectedColors.length > 0 && productId) {
        try {
          await handleGenerateVariants({
            sizes: selectedSizes,
            colors: selectedColors.map(c => c.color),
            basePrice: parseFloat(formData.price) || 0,
            baseStock: parseInt(formData.stock) || 0,
            material: material || undefined,
          })
        } catch (error: any) {
          // Don't fail the entire product creation if variant generation fails
          // But inform the user that product was created without variants
          console.error('Error generating variants:', error)
          toast({
            title: 'Warning',
            description: `Product created but variant generation failed: ${error.message || 'Unknown error'}. You can manually add variants later.`,
            variant: 'destructive',
          })
        }
      }

      toast({
        title: 'Success',
        description: `Product created${hasVariants ? ` with variants` : ''}`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      console.error('Error creating product:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to create product',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateProduct = async () => {
    if (!product) return

    // Validation: Check required fields
    if (!formData.name || formData.name.trim() === '') {
      toast({
        title: 'Error',
        description: 'Product name is required',
        variant: 'destructive',
      })
      return
    }

    if (!formData.categoryId || formData.categoryId.trim() === '') {
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      })
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await apiFetch<{success: boolean; error?: string}>(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'update',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          basePrice: parseFloat(formData.price),
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          categoryId: formData.categoryId || null,
          images: formData.images,
          stock: variants.length > 0 ? 0 : parseInt(formData.stock),
          isActive: formData.isActive,
          isFeatured: formData.isFeatured,
          brandId: formData.brandId || null,
          brandName: formData.brandName || null,
          brandLogo: formData.brandLogo || null,
          countryOfOrigin: formData.countryOfOrigin || null,
          // Use merged size for single products, null for variants
          sizeLabel: variants.length > 0 ? null : (singleSize || null),
          // Single product material and color (only for products without variants)
          material: variants.length > 0 ? null : (singleMaterial || null),
          color: variants.length > 0 ? null : (singleColor || null),
          // Include available sizes and colors for multi-select system
          availableSizes: useMultiSelectSystem ? selectedSizes : null,
          availableColors: useMultiSelectSystem ? selectedColors.map(c => c.color) : null,
        }),
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update product')
      }

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      console.error('Error updating product:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update product',
        variant: 'destructive',
      })
    }
  }

  const getVariantImage = (variant: ProductVariant) => {
    if (variant.images && variant.images.length > 0) {
      return variant.images[0]
    }
    return formData.images[0] || '/placeholder-product.png'
  }

  const hasVariants = variants.length > 0

  const handleUpdateVariant = async () => {
    if (!editingVariant || !product) return

    try {
      setIsUpdatingVariant(true)
      const result = await apiFetch<{success: boolean; error?: string}>(
        `/api/admin/products/${product.id}/variants/${editingVariant.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price: editVariantData.price || editingVariant.price,
            stock: editVariantData.stock !== undefined ? parseInt(editVariantData.stock.toString()) : editingVariant.stock,
            color: editVariantData.color !== undefined ? editVariantData.color : editingVariant.color,
            material: editVariantData.material !== undefined ? editVariantData.material : editingVariant.material,
            images: editVariantData.images || editingVariant.images,
          }),
        }
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to update variant')
      }

      toast({
        title: 'Success',
        description: 'Variant updated successfully',
      })

      setEditingVariant(null)
      setEditVariantData({})
      fetchProductVariants(product.id)
    } catch (err: any) {
      console.error('Error updating variant:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update variant',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingVariant(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!product) return

    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const result = await apiFetch<{success: boolean; error?: string}>(
        `/api/admin/products/${product.id}/variants/${variantId}`,
        {
          method: 'DELETE',
        }
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete variant')
      }

      toast({
        title: 'Success',
        description: 'Variant deleted successfully',
      })

      fetchProductVariants(product.id)
    } catch (err: any) {
      console.error('Error deleting variant:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete variant',
        variant: 'destructive',
      })
    }
  }

  const openEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setEditVariantData({
      price: variant.price,
      stock: variant.stock,
      images: variant.images || [],
      size: variant.size || '',
      color: variant.color || '',
      material: variant.material || '',
    })
  }

  // Handle variant generation using the API
  const handleGenerateVariants = async (data: {
    sizes: string[]
    colors: string[]
    basePrice: number
    baseStock: number
    material?: string
  }) => {
    if (!product) {
      toast({
        title: 'Error',
        description: 'Product ID is required for generating variants',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await apiFetch<{success: boolean; error?: string}>(`/api/admin/products/${product.id}/generate-variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate variants')
      }

      toast({
        title: 'Success',
        description: `Generated ${data.sizes.length * data.colors.length} variants successfully`,
      })

      // Refresh variants
      fetchProductVariants(product.id)
    } catch (error: any) {
      console.error('Error generating variants:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate variants',
        variant: 'destructive',
      })
      throw error
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Product' : 'Edit Product'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-140px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="product-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Compare Price</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Category, Brand, Country */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Classification</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                    required
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

                <div>
                  <BrandSelector
                    value={formData.brandId}
                    onChange={(value, brand) =>
                      setFormData({
                        ...formData,
                        brandId: value,
                        brandName: brand?.name || '',
                        brandLogo: brand?.logo || '',
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <CountrySelector
                  value={formData.countryOfOrigin}
                  onChange={(value) => setFormData({ ...formData, countryOfOrigin: value })}
                />
              </div>
            </div>

            {/* ADD VARIANTS BUTTON - Always visible below Country of Origin */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Product Variants
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasVariants
                      ? `${variants.length} variant${variants.length > 1 ? 's' : ''} defined`
                      : 'No variants yet'}
                  </p>
                </div>
              </div>

              {/* Variants List - Show when editing and variants exist */}
              {(mode === 'edit' && variants.length > 0) && (
                <div className="mt-4 space-y-3">
                  {variantsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Variant Thumbnail */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={getVariantImage(variant)}
                                alt={variant.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Variant Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                {variant.size && (
                                  <Badge variant="secondary">Size: {variant.size}</Badge>
                                )}
                                {variant.color && (
                                  <Badge variant="secondary">Color: {variant.color}</Badge>
                                )}
                                {variant.material && (
                                  <Badge variant="secondary">Material: {variant.material}</Badge>
                                )}
                                {variant.isDefault && (
                                  <Badge variant="default">Default</Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Price: </span>
                                  ৳{variant.price.toFixed(2)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Stock: </span>
                                  {variant.stock}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">SKU: </span>
                                  {variant.sku}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditVariant(variant)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVariant(variant.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Edit Form for Variant */}
                        {editingVariant?.id === variant.id && (
                          <div className="border-t pt-3 mt-3 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Price</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editVariantData.price || ''}
                                  onChange={(e) =>
                                    setEditVariantData({ ...editVariantData, price: parseFloat(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Stock</Label>
                                <Input
                                  type="number"
                                  value={editVariantData.stock ?? ''}
                                  onChange={(e) =>
                                    setEditVariantData({ ...editVariantData, stock: parseInt(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Color</Label>
                                <Input
                                  placeholder="Red, Blue, etc."
                                  value={editVariantData.color || ''}
                                  onChange={(e) =>
                                    setEditVariantData({ ...editVariantData, color: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Material</Label>
                                <Input
                                  placeholder="Cotton, Silk, etc."
                                  value={editVariantData.material || ''}
                                  onChange={(e) =>
                                    setEditVariantData({ ...editVariantData, material: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            
                            {/* Variant Images Section */}
                            <div>
                              <Label>Variant Images</Label>
                              <ImageUpload
                                images={editVariantData.images || []}
                                onImagesChange={(images) =>
                                  setEditVariantData({ ...editVariantData, images })
                                }
                                maxImages={5}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Upload variant-specific images or select from gallery. If empty, uses product images.
                              </p>
                            </div>

                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingVariant(null)
                                  setEditVariantData({})
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="button" size="sm" onClick={handleUpdateVariant} disabled={isUpdatingVariant}>
                                {isUpdatingVariant ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                {isUpdatingVariant ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

                            {/* Multi-Select Variant System */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {useMultiSelectSystem ? (
                      <ToggleRight className="h-6 w-6 text-blue-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <h4 className="font-semibold">Multi-Select Variant System</h4>
                      <p className="text-xs text-muted-foreground">
                        Generate all size/color combinations at once
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={useMultiSelectSystem ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseMultiSelectSystem(!useMultiSelectSystem)}
                  >
                    {useMultiSelectSystem ? 'Disable' : 'Enable'}
                  </Button>
                </div>

                {useMultiSelectSystem && (
                  <div className="space-y-4">
                    <Tabs defaultValue="sizes" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="sizes">Sizes</TabsTrigger>
                        <TabsTrigger value="colors">Colors</TabsTrigger>
                        <TabsTrigger value="preview">Preview & Generate</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="sizes" className="space-y-4">
                        <SizeMultiSelector
                          availableSizes={availableSizes}
                          selectedSizes={selectedSizes}
                          onChange={setSelectedSizes}
                          customSizes={customSizes}
                          onAddCustomSize={(size) => {
                            if (!customSizes.includes(size) && !availableSizes.includes(size)) {
                              setCustomSizes([...customSizes, size])
                            }
                          }}
                          onRemoveCustomSize={(size) => {
                            setCustomSizes(customSizes.filter(s => s !== size))
                            setSelectedSizes(selectedSizes.filter(s => s !== size))
                          }}
                        />
                      </TabsContent>
                      
                      <TabsContent value="colors" className="space-y-4">
                        <ColorMultiSelector
                          selectedColors={selectedColors}
                          onChange={setSelectedColors}
                        />
                      </TabsContent>
                      
                      <TabsContent value="preview" className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label>Material (Optional)</Label>
                            <Input
                              type="text"
                              placeholder="e.g., Cotton, Silk, Polyester"
                              value={material}
                              onChange={(e) => setMaterial(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Base Price per Variant</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Base Stock per Variant</Label>
                              <Input
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                placeholder="0"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <VariantMatrixPreview
                            sizes={selectedSizes}
                            colors={selectedColors.map(c => c.color)}
                            basePrice={parseFloat(formData.price) || 0}
                            baseStock={parseInt(formData.stock) || 0}
                            material={material || undefined}
                            onGenerate={handleGenerateVariants}
                            disabled={mode === 'add'}
                          />
                        </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Images</h3>
              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => setFormData({ ...formData, images })}
              />
            </div>

            {/* Stock & Size - Only visible if no variants and not using multi-select system */}
            {!hasVariants && !useMultiSelectSystem && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Inventory & Attributes</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SizeQuickSelect
                    value={singleSize}
                    onChange={setSingleSize}
                  />
                  <MaterialQuickSelect
                    value={singleMaterial}
                    onChange={setSingleMaterial}
                  />
                  <ColorQuickSelect
                    value={singleColor}
                    onChange={setSingleColor}
                  />
                </div>
              </div>
            )}

            {/* Status Toggles */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status</h3>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Product will be visible in store
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="isFeatured">Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Show on homepage
                  </p>
                </div>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
              </div>
            </div>

            {/* Form Actions inside form */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === 'add' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    {mode === 'add' ? 'Create Product' : 'Update Product'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>

        {/* Footer Actions - Empty (moved inside form) */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
        </div>
      </DialogContent>
    </Dialog>
  )
}
