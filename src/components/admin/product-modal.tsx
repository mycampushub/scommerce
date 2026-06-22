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
  const [isAddingVariant, setIsAddingVariant] = useState(false)
  const [addingVariantData, setAddingVariantData] = useState<Partial<ProductVariant>>({})
  const [showAddVariantForm, setShowAddVariantForm] = useState(false)
  
  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [variantErrors, setVariantErrors] = useState<Record<string, string>>({})

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
        const response = await fetch('/api/admin/categories?limit=1000')
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
      setErrors({})
      setVariantErrors({})
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
    // Clear previous errors
    setErrors({})
    
    // Validation: Check required fields
    const newErrors: Record<string, string> = {}
    
    // Product Name validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Product name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters'
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Product name cannot exceed 200 characters'
    }

    // Category validation
    if (!formData.categoryId || formData.categoryId.trim() === '') {
      newErrors.categoryId = 'Please select a category'
    }

    // Price validation
    if (!formData.price || formData.price.trim() === '') {
      newErrors.price = 'Price is required'
    } else if (isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Please enter a valid price'
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    } else if (parseFloat(formData.price) > 999999.99) {
      newErrors.price = 'Price cannot exceed 999,999.99'
    }

    // Description validation (optional but with guidelines)
    if (formData.description && formData.description.trim().length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters'
    }

    // Compare price validation (optional but validated if provided)
    if (formData.comparePrice && formData.comparePrice.trim() !== '') {
      const comparePriceVal = parseFloat(formData.comparePrice)
      if (isNaN(comparePriceVal)) {
        newErrors.comparePrice = 'Please enter a valid compare price'
      } else if (comparePriceVal < 0) {
        newErrors.comparePrice = 'Compare price cannot be negative'
      } else if (comparePriceVal > 0 && parseFloat(formData.price) >= comparePriceVal) {
        newErrors.comparePrice = 'Compare price must be greater than regular price'
      } else if (comparePriceVal > 999999.99) {
        newErrors.comparePrice = 'Compare price cannot exceed 999,999.99'
      }
    }

    // Cost price validation (optional but validated if provided)
    if (formData.costPrice && formData.costPrice.trim() !== '') {
      const costPriceVal = parseFloat(formData.costPrice)
      if (isNaN(costPriceVal)) {
        newErrors.costPrice = 'Please enter a valid cost price'
      } else if (costPriceVal < 0) {
        newErrors.costPrice = 'Cost price cannot be negative'
      } else if (costPriceVal > 999999.99) {
        newErrors.costPrice = 'Cost price cannot exceed 999,999.99'
      }
    }

    // Stock validation (for products without variants)
    const hasVariants = useMultiSelectSystem && (selectedSizes.length > 0 || selectedColors.length > 0)
    if (!hasVariants) {
      if (formData.stock === '' || formData.stock.trim() === '') {
        newErrors.stock = 'Stock is required for products without variants'
      } else if (isNaN(parseInt(formData.stock))) {
        newErrors.stock = 'Please enter a valid stock quantity'
      } else if (parseInt(formData.stock) < 0) {
        newErrors.stock = 'Stock cannot be negative'
      } else if (parseInt(formData.stock) > 999999) {
        newErrors.stock = 'Stock cannot exceed 999,999'
      }
    }

    // Slug validation (if provided)
    if (formData.slug && formData.slug.trim() !== '') {
      const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugPattern.test(formData.slug)) {
        newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
      } else if (formData.slug.length > 200) {
        newErrors.slug = 'Slug cannot exceed 200 characters'
      }
    }

    // If there are errors, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstError = Object.values(newErrors)[0]
      toast({
        title: 'Validation Error',
        description: firstError || 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    try {
      // Check if we have variants from multi-select system
      // Support sizes-only, colors-only, or both
      const hasVariants = useMultiSelectSystem && (selectedSizes.length > 0 || selectedColors.length > 0)

      console.log('[ProductModal] Creating product:', {
        hasVariants,
        useMultiSelectSystem,
        selectedSizes,
        selectedColors: selectedColors.map(c => c.color),
      })

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
          availableSizes: useMultiSelectSystem && selectedSizes.length > 0 ? selectedSizes : null,
          availableColors: useMultiSelectSystem && selectedColors.length > 0 ? selectedColors.map(c => c.color) : null,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to create product')
      }

      const productId = result.data?.id || result.products?.id

      // Generate variants for multi-select system
      // Support sizes-only, colors-only, or both
      if (useMultiSelectSystem && (selectedSizes.length > 0 || selectedColors.length > 0) && productId) {
        try {
          await handleGenerateVariants({
            sizes: selectedSizes.length > 0 ? selectedSizes : [],
            colors: selectedColors.length > 0 ? selectedColors.map(c => c.color) : [],
            basePrice: parseFloat(formData.price) || 0,
            baseStock: parseInt(formData.stock) || 0,
            material: material || undefined,
            productId,  // Pass explicitly for create mode
          })
        } catch (error: any) {
          // Don't fail the entire product creation if variant generation fails
          // But inform the user that product was created without variants
          console.error('Error generating variants:', error)
          toast({
            title: 'Warning',
            description: `Product created but variant generation failed: ${error.message || 'Unknown error'}. You can manually add variants later.`,
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

    // Clear previous errors
    setErrors({})

    // Validation: Check required fields
    const newErrors: Record<string, string> = {}

    // Product Name validation
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Product name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters'
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Product name cannot exceed 200 characters'
    }

    // Category validation
    if (!formData.categoryId || formData.categoryId.trim() === '') {
      newErrors.categoryId = 'Please select a category'
    }

    // Price validation
    if (!formData.price || formData.price.trim() === '') {
      newErrors.price = 'Price is required'
    } else if (isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Please enter a valid price'
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    } else if (parseFloat(formData.price) > 999999.99) {
      newErrors.price = 'Price cannot exceed 999,999.99'
    }

    // Description validation (optional but with guidelines)
    if (formData.description && formData.description.trim().length > 5000) {
      newErrors.description = 'Description cannot exceed 5000 characters'
    }

    // Compare price validation (optional but validated if provided)
    if (formData.comparePrice && formData.comparePrice.trim() !== '') {
      const comparePriceVal = parseFloat(formData.comparePrice)
      if (isNaN(comparePriceVal)) {
        newErrors.comparePrice = 'Please enter a valid compare price'
      } else if (comparePriceVal < 0) {
        newErrors.comparePrice = 'Compare price cannot be negative'
      } else if (comparePriceVal > 0 && parseFloat(formData.price) >= comparePriceVal) {
        newErrors.comparePrice = 'Compare price must be greater than regular price'
      } else if (comparePriceVal > 999999.99) {
        newErrors.comparePrice = 'Compare price cannot exceed 999,999.99'
      }
    }

    // Cost price validation (optional but validated if provided)
    if (formData.costPrice && formData.costPrice.trim() !== '') {
      const costPriceVal = parseFloat(formData.costPrice)
      if (isNaN(costPriceVal)) {
        newErrors.costPrice = 'Please enter a valid cost price'
      } else if (costPriceVal < 0) {
        newErrors.costPrice = 'Cost price cannot be negative'
      } else if (costPriceVal > 999999.99) {
        newErrors.costPrice = 'Cost price cannot exceed 999,999.99'
      }
    }

    // Stock validation (for products without variants)
    if (variants.length === 0) {
      if (formData.stock === '' || formData.stock.trim() === '') {
        newErrors.stock = 'Stock is required for products without variants'
      } else if (isNaN(parseInt(formData.stock))) {
        newErrors.stock = 'Please enter a valid stock quantity'
      } else if (parseInt(formData.stock) < 0) {
        newErrors.stock = 'Stock cannot be negative'
      } else if (parseInt(formData.stock) > 999999) {
        newErrors.stock = 'Stock cannot exceed 999,999'
      }
    }

    // Slug validation (if provided)
    if (formData.slug && formData.slug.trim() !== '') {
      const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugPattern.test(formData.slug)) {
        newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
      } else if (formData.slug.length > 200) {
        newErrors.slug = 'Slug cannot exceed 200 characters'
      }
    }

    // If there are errors, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      const firstError = Object.values(newErrors)[0]
      toast({
        title: 'Validation Error',
        description: firstError || 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

      const result = await response.json() as any

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

    // Clear previous variant errors
    setVariantErrors({})

    // Validate variant fields
    const newVariantErrors: Record<string, string> = {}

    // Price validation - required field for variants
    if (editVariantData.price === undefined || editVariantData.price === null) {
      newVariantErrors.price = 'Variant price is required'
    } else if (isNaN(editVariantData.price)) {
      newVariantErrors.price = 'Please enter a valid price'
    } else if (editVariantData.price <= 0) {
      newVariantErrors.price = 'Price must be greater than 0'
    } else if (editVariantData.price > 999999.99) {
      newVariantErrors.price = 'Price cannot exceed 999,999.99'
    }

    // Stock validation - required field for variants
    if (editVariantData.stock === undefined || editVariantData.stock === null) {
      newVariantErrors.stock = 'Variant stock is required'
    } else if (isNaN(editVariantData.stock)) {
      newVariantErrors.stock = 'Please enter a valid stock quantity'
    } else if (editVariantData.stock < 0) {
      newVariantErrors.stock = 'Stock cannot be negative'
    } else if (!Number.isInteger(editVariantData.stock)) {
      newVariantErrors.stock = 'Stock must be a whole number'
    } else if (editVariantData.stock > 999999) {
      newVariantErrors.stock = 'Stock cannot exceed 999,999'
    }

    // If there are errors, show them and stop
    if (Object.keys(newVariantErrors).length > 0) {
      setVariantErrors(newVariantErrors)
      const firstError = Object.values(newVariantErrors)[0]
      toast({
        title: 'Validation Error',
        description: firstError || 'Please fix the variant errors',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsUpdatingVariant(true)
      const response = await fetch(
        `/api/admin/products/${product.id}/variants/${editingVariant.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            price: editVariantData.price || editingVariant.price,
            stock: editVariantData.stock !== undefined ? parseInt(editVariantData.stock.toString()) : editingVariant.stock,
            color: editVariantData.color !== undefined ? editVariantData.color : editingVariant.color,
            material: editVariantData.material !== undefined ? editVariantData.material : editingVariant.material,
            images: editVariantData.images || editingVariant.images,
          }),
        }
      )

      const result = await response.json() as any

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
      const response = await fetch(
        `/api/admin/products/${product.id}/variants/${variantId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      )

      const result = await response.json() as any

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

  const handleAddSingleVariant = async () => {
    if (!product) return

    // Clear previous variant errors
    setVariantErrors({})

    // Validate variant fields
    const newVariantErrors: Record<string, string> = {}

    // Price validation - required field for variants
    if (addingVariantData.price === undefined || addingVariantData.price === null) {
      newVariantErrors.price = 'Variant price is required'
    } else if (isNaN(addingVariantData.price)) {
      newVariantErrors.price = 'Please enter a valid price'
    } else if (addingVariantData.price <= 0) {
      newVariantErrors.price = 'Price must be greater than 0'
    } else if (addingVariantData.price > 999999.99) {
      newVariantErrors.price = 'Price cannot exceed 999,999.99'
    }

    // Stock validation - required field for variants
    if (addingVariantData.stock === undefined || addingVariantData.stock === null) {
      newVariantErrors.stock = 'Variant stock is required'
    } else if (isNaN(addingVariantData.stock)) {
      newVariantErrors.stock = 'Please enter a valid stock quantity'
    } else if (addingVariantData.stock < 0) {
      newVariantErrors.stock = 'Stock cannot be negative'
    } else if (!Number.isInteger(addingVariantData.stock)) {
      newVariantErrors.stock = 'Stock must be a whole number'
    } else if (addingVariantData.stock > 999999) {
      newVariantErrors.stock = 'Stock cannot exceed 999,999'
    }

    // If there are errors, show them and stop
    if (Object.keys(newVariantErrors).length > 0) {
      setVariantErrors(newVariantErrors)
      const firstError = Object.values(newVariantErrors)[0]
      toast({
        title: 'Validation Error',
        description: firstError || 'Please fix the variant errors',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsAddingVariant(true)
      const response = await fetch(
        `/api/admin/products/${product.id}/variants`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sku: `${product.slug}-${addingVariantData.size || ''}-${addingVariantData.color || ''}`.replace(/-+/g, '-').toLowerCase(),
            name: `${product.name} - ${addingVariantData.size || ''} ${addingVariantData.color || ''}`.trim(),
            price: addingVariantData.price,
            stock: addingVariantData.stock !== undefined ? parseInt(addingVariantData.stock.toString()) : 0,
            size: addingVariantData.size || null,
            color: addingVariantData.color || null,
            material: addingVariantData.material || null,
            images: addingVariantData.images || [],
            isActive: true,
            isDefault: variants.length === 0, // First variant becomes default
          }),
        }
      )

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to add variant')
      }

      toast({
        title: 'Success',
        description: 'Variant added successfully',
      })

      setShowAddVariantForm(false)
      setAddingVariantData({})
      fetchProductVariants(product.id)
    } catch (err: any) {
      console.error('Error adding variant:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to add variant',
        variant: 'destructive',
      })
    } finally {
      setIsAddingVariant(false)
    }
  }

  const handleSetDefaultVariant = async (variantId: string) => {
    if (!product) return

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}/variants/${variantId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            isDefault: true,
          }),
        }
      )

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to set default variant')
      }

      toast({
        title: 'Success',
        description: 'Default variant updated',
      })

      fetchProductVariants(product.id)
    } catch (err: any) {
      console.error('Error setting default variant:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to set default variant',
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
    productId?: string  // Allow passing productId explicitly (for create mode)
  }) => {
    const targetProductId = data.productId || product?.id
    if (!targetProductId) {
      toast({
        title: 'Error',
        description: 'Product ID is required for generating variants',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${targetProductId}/generate-variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate variants')
      }

      toast({
        title: 'Success',
        description: `Generated ${data.sizes.length * data.colors.length} variants successfully`,
      })

      // Refresh variants
      fetchProductVariants(targetProductId)
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
                  <Label htmlFor="name" className={errors.name ? 'text-destructive' : ''}>
                    Product Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: '' })
                    }}
                    placeholder="Enter product name"
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className={errors.slug ? 'text-destructive' : ''}>
                    Slug (Optional)
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })
                      if (errors.slug) setErrors({ ...errors, slug: '' })
                    }}
                    placeholder="product-slug"
                    className={errors.slug ? 'border-destructive' : ''}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive mt-1">{errors.slug}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-generate from product name
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className={errors.description ? 'text-destructive' : ''}>
                  Description <span className="text-muted-foreground text-xs ml-2">(Optional)</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value })
                    if (errors.description) setErrors({ ...errors, description: '' })
                  }}
                  placeholder="Enter product description"
                  rows={3}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Max 5000 characters. {formData.description?.length || 0}/5000
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className={errors.price ? 'text-destructive' : ''}>
                    Price <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value })
                      if (errors.price) setErrors({ ...errors, price: '' })
                    }}
                    placeholder="0.00"
                    className={errors.price ? 'border-destructive' : ''}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">{errors.price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comparePrice" className={errors.comparePrice ? 'text-destructive' : ''}>
                    Compare Price (Optional)
                  </Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.comparePrice}
                    onChange={(e) => {
                      setFormData({ ...formData, comparePrice: e.target.value })
                      if (errors.comparePrice) setErrors({ ...errors, comparePrice: '' })
                    }}
                    placeholder="0.00"
                    className={errors.comparePrice ? 'border-destructive' : ''}
                  />
                  {errors.comparePrice && (
                    <p className="text-sm text-destructive mt-1">{errors.comparePrice}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be greater than selling price
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPrice" className={errors.costPrice ? 'text-destructive' : ''}>
                    Cost Price (Optional)
                  </Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, costPrice: e.target.value })
                      if (errors.costPrice) setErrors({ ...errors, costPrice: '' })
                    }}
                    placeholder="0.00"
                    className={errors.costPrice ? 'border-destructive' : ''}
                  />
                  {errors.costPrice && (
                    <p className="text-sm text-destructive mt-1">{errors.costPrice}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Max value: 999,999.99
                  </p>
                </div>
              </div>
            </div>

            {/* Category, Brand, Country */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Classification</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className={errors.categoryId ? 'text-destructive' : ''}>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, categoryId: value })
                      if (errors.categoryId) setErrors({ ...errors, categoryId: '' })
                    }}
                  >
                    <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
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
                  {errors.categoryId && (
                    <p className="text-sm text-destructive mt-1">{errors.categoryId}</p>
                  )}
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
                  <p className="text-xs text-muted-foreground mt-2">Optional</p>
                </div>
              </div>

              <div>
                <CountrySelector
                  value={formData.countryOfOrigin}
                  onChange={(value) => setFormData({ ...formData, countryOfOrigin: value })}
                />
                <p className="text-xs text-muted-foreground mt-2">Optional</p>
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
                {/* Add Variant Button - Only show in edit mode */}
                {mode === 'edit' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddVariantForm(!showAddVariantForm)
                      setAddingVariantData({})
                      setVariantErrors({})
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Single Variant
                  </Button>
                )}
              </div>

              {/* Add Single Variant Form */}
              {showAddVariantForm && mode === 'edit' && (
                <div className="mt-4 border rounded-lg p-4 space-y-3 bg-gray-50">
                  <h4 className="font-semibold text-sm">Add New Variant</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className={variantErrors.price ? 'text-destructive' : ''}>
                        Price <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={addingVariantData.price || ''}
                        onChange={(e) => {
                          setAddingVariantData({ ...addingVariantData, price: parseFloat(e.target.value) })
                          if (variantErrors.price) setVariantErrors({ ...variantErrors, price: '' })
                        }}
                        className={variantErrors.price ? 'border-destructive' : ''}
                      />
                      {variantErrors.price && (
                        <p className="text-sm text-destructive mt-1">{variantErrors.price}</p>
                      )}
                    </div>
                    <div>
                      <Label className={variantErrors.stock ? 'text-destructive' : ''}>
                        Stock <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={addingVariantData.stock ?? ''}
                        onChange={(e) => {
                          setAddingVariantData({ ...addingVariantData, stock: parseInt(e.target.value) })
                          if (variantErrors.stock) setVariantErrors({ ...variantErrors, stock: '' })
                        }}
                        className={variantErrors.stock ? 'border-destructive' : ''}
                      />
                      {variantErrors.stock && (
                        <p className="text-sm text-destructive mt-1">{variantErrors.stock}</p>
                      )}
                    </div>
                    <div>
                      <Label>Size (Optional)</Label>
                      <Input
                        placeholder="e.g., M, L, XL"
                        value={addingVariantData.size || ''}
                        onChange={(e) =>
                          setAddingVariantData({ ...addingVariantData, size: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Color (Optional)</Label>
                      <Input
                        placeholder="e.g., Red, Blue, etc."
                        value={addingVariantData.color || ''}
                        onChange={(e) =>
                          setAddingVariantData({ ...addingVariantData, color: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Material (Optional)</Label>
                      <Input
                        placeholder="e.g., Cotton, Silk, etc."
                        value={addingVariantData.material || ''}
                        onChange={(e) =>
                          setAddingVariantData({ ...addingVariantData, material: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddVariantForm(false)
                        setAddingVariantData({})
                        setVariantErrors({})
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleAddSingleVariant} disabled={isAddingVariant}>
                      {isAddingVariant ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {isAddingVariant ? 'Adding...' : 'Add Variant'}
                    </Button>
                  </div>
                </div>
              )}

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
                            {!variant.isDefault && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefaultVariant(variant.id)}
                                title="Set as default variant"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
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
                                <Label className={variantErrors.price ? 'text-destructive' : ''}>
                                  Price <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editVariantData.price || ''}
                                  onChange={(e) => {
                                    setEditVariantData({ ...editVariantData, price: parseFloat(e.target.value) })
                                    if (variantErrors.price) setVariantErrors({ ...variantErrors, price: '' })
                                  }}
                                  className={variantErrors.price ? 'border-destructive' : ''}
                                />
                                {variantErrors.price && (
                                  <p className="text-sm text-destructive mt-1">{variantErrors.price}</p>
                                )}
                              </div>
                              <div>
                                <Label className={variantErrors.stock ? 'text-destructive' : ''}>
                                  Stock <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={editVariantData.stock ?? ''}
                                  onChange={(e) => {
                                    setEditVariantData({ ...editVariantData, stock: parseInt(e.target.value) })
                                    if (variantErrors.stock) setVariantErrors({ ...variantErrors, stock: '' })
                                  }}
                                  className={variantErrors.stock ? 'border-destructive' : ''}
                                />
                                {variantErrors.stock && (
                                  <p className="text-sm text-destructive mt-1">{variantErrors.stock}</p>
                                )}
                              </div>
                              <div>
                                <Label>Color (Optional)</Label>
                                <Input
                                  placeholder="Red, Blue, etc."
                                  value={editVariantData.color || ''}
                                  onChange={(e) =>
                                    setEditVariantData({ ...editVariantData, color: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label>Material (Optional)</Label>
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
                              <Label>Variant Images (Optional)</Label>
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
                          />
                        </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>

            {/* Product Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Images</h3>
              <ImageUpload
                images={formData.images}
                onImagesChange={(images) => setFormData({ ...formData, images })}
              />
              <p className="text-xs text-muted-foreground">
                Upload product images or select from gallery. (Optional but recommended)
              </p>
            </div>

            {/* Stock & Size - Only visible if no variants and not using multi-select system */}
            {!hasVariants && !useMultiSelectSystem && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Inventory & Attributes</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock" className={errors.stock ? 'text-destructive' : ''}>
                      Stock Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => {
                        setFormData({ ...formData, stock: e.target.value })
                        if (errors.stock) setErrors({ ...errors, stock: '' })
                      }}
                      placeholder="0"
                      className={errors.stock ? 'border-destructive' : ''}
                    />
                    {errors.stock && (
                      <p className="text-sm text-destructive mt-1">{errors.stock}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be a non-negative integer
                    </p>
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
