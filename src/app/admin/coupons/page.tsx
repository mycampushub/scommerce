'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Calendar, Tag, ShoppingCart, Users, Package, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PriceDisplay } from '@/components/price-display'

interface Promotion {
  id: string
  title: string
  description?: string
  promoCode: string
  type?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  startDate?: string
  endDate?: string
  usageLimit?: number
  usedCount: number
  userLimit?: number
  applicableCategories?: string[]
  applicableProducts?: string[]
  conditions?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  slug: string
  basePrice: number
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function CouponsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingPromotion, setDeletingPromotion] = useState<string | null>(null)
  const [togglingActive, setTogglingActive] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    promoCode: '',
    type: 'coupon' as string, // Set default type to coupon
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 0,
    userLimit: 0,
    applicableCategories: [] as string[],
    applicableProducts: [] as string[],
    conditions: '',
    isActive: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch promotions (only coupons)
  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/promotions', {
        headers: {
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[CouponsPage] Raw API response:', data)

        // Handle both response formats: data directly or data.data
        let promotionsList: Promotion[] = []
        if (Array.isArray(data)) {
          promotionsList = data
        } else if (data.data && Array.isArray(data.data)) {
          promotionsList = data.data
        } else if (data.promotions && Array.isArray(data.promotions)) {
          promotionsList = data.promotions
        }

        console.log('[CouponsPage] Parsed promotionsList:', promotionsList)

        // Filter only coupons (type === 'coupon' or type === undefined with promoCode)
        const couponsOnly = promotionsList.filter(p =>
          p.type === 'coupon' || (p.promoCode && p.promoCode.length > 0)
        )

        // Ensure each promotion has array fields
        const promotionsWithArrays = couponsOnly.map(p => ({
          ...p,
          applicableCategories: Array.isArray(p.applicableCategories) ? p.applicableCategories : [],
          applicableProducts: Array.isArray(p.applicableProducts) ? p.applicableProducts : [],
        }))

        console.log('[CouponsPage] Final coupons after filtering:', promotionsWithArrays)
        setPromotions(promotionsWithArrays)
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load promotions',
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch products and categories
  const fetchProductsAndCategories = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products?limit=1000'),
        fetch('/api/categories?limit=1000'),
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        const productsList = Array.isArray(productsData.products)
          ? productsData.products
          : Array.isArray(productsData.data)
            ? productsData.data
            : []
        setProducts(productsList)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        const categoriesList = Array.isArray(categoriesData.categories)
          ? categoriesData.categories
          : Array.isArray(categoriesData.data)
            ? categoriesData.data
            : []
        setCategories(categoriesList)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  useEffect(() => {
    fetchPromotions()
    fetchProductsAndCategories()
  }, [])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      promoCode: '',
      type: 'coupon',
      discountType: 'percentage',
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 0,
      userLimit: 0,
      applicableCategories: [],
      applicableProducts: [],
      conditions: '',
      isActive: true,
    })
    setErrors({})
    setEditingPromotion(null)
  }

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      promoCode: promotion.promoCode,
      type: promotion.type || 'coupon',
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      minOrderAmount: promotion.minOrderAmount || 0,
      maxDiscountAmount: promotion.maxDiscountAmount || 0,
      startDate: promotion.startDate ? promotion.startDate.split('T')[0] : '',
      endDate: promotion.endDate ? promotion.endDate.split('T')[0] : '',
      usageLimit: promotion.usageLimit || 0,
      userLimit: promotion.userLimit || 0,
      applicableCategories: Array.isArray(promotion.applicableCategories) ? promotion.applicableCategories : [],
      applicableProducts: Array.isArray(promotion.applicableProducts) ? promotion.applicableProducts : [],
      conditions: promotion.conditions || '',
      isActive: promotion.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return

    setDeletingPromotion(id)
    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Promotion deleted successfully',
        })
        fetchPromotions()
      } else {
        throw new Error('Failed to delete promotion')
      }
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete promotion',
      })
    } finally {
      setDeletingPromotion(null)
    }
  }

  // Client-side validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Title is required
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    // Promo code is required
    if (!formData.promoCode.trim()) {
      newErrors.promoCode = 'Promo code is required'
    } else if (!/^[A-Z0-9]+$/.test(formData.promoCode)) {
      newErrors.promoCode = 'Promo code must contain only uppercase letters and numbers'
    }

    // Discount value must be valid
    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Discount value must be greater than 0'
    } else if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage discount cannot exceed 100%'
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (start >= end) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    // Min/max order amount validation
    if (formData.minOrderAmount < 0) {
      newErrors.minOrderAmount = 'Minimum order amount cannot be negative'
    }

    if (formData.maxDiscountAmount < 0) {
      newErrors.maxDiscountAmount = 'Maximum discount amount cannot be negative'
    }

    // Usage limits validation
    if (formData.usageLimit < 0) {
      newErrors.usageLimit = 'Usage limit cannot be negative'
    }

    if (formData.userLimit < 0) {
      newErrors.userLimit = 'User limit cannot be negative'
    }

    // Conditions JSON validation (if provided)
    if (formData.conditions.trim()) {
      try {
        JSON.parse(formData.conditions)
      } catch {
        newErrors.conditions = 'Invalid JSON format for conditions'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submitting
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix all errors before submitting',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingPromotion
        ? `/api/admin/promotions/${editingPromotion.id}`
        : '/api/admin/promotions'

      console.log('[CouponsPage] Submitting promotion:', formData)

      const response = await fetch(url, {
        method: editingPromotion ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Check if server returned validation errors
      if (!response.ok) {
        const responseData = await response.json()
        // Handle duplicate code error specifically
        if (response.status === 409) {
          setErrors({
            promoCode: responseData.details || responseData.error || 'This promo code already exists'
          })
          throw new Error(responseData.error || 'Duplicate promo code')
        }
        throw new Error(responseData.error || responseData.details || 'Failed to save promotion')
      }

      const responseData = await response.json()
      console.log('[CouponsPage] Response:', response.status, responseData)

      toast({
        title: 'Success',
        description: editingPromotion
          ? 'Promotion updated successfully'
          : 'Promotion created successfully',
      })
      setDialogOpen(false)
      resetForm()
      fetchPromotions()
    } catch (error: any) {
      console.error('[CouponsPage] Error saving promotion:', error)
      // Only show toast if it's not a validation error (those are already shown inline)
      if (!error.message?.includes('Duplicate promo code')) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to save promotion',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    setTogglingActive(id)
    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        fetchPromotions()
        toast({
          title: 'Success',
          description: `Promotion ${!currentStatus ? 'activated' : 'deactivated'}`,
        })
      }
    } catch (error) {
      console.error('Error toggling promotion:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update promotion status',
      })
    } finally {
      setTogglingActive(null)
    }
  }

  // Get usage percentage
  const getUsagePercentage = (used: number, limit?: number) => {
    if (!limit || limit === 0) return 0
    return Math.round((used / limit) * 100)
  }

  // Check if promotion is expired or upcoming
  const getPromotionStatus = (promotion: Promotion) => {
    if (!promotion.isActive) return { label: 'Inactive', color: 'default' }

    const now = new Date()
    const startDate = promotion.startDate ? new Date(promotion.startDate) : null
    const endDate = promotion.endDate ? new Date(promotion.endDate) : null

    if (startDate && startDate > now) {
      return { label: 'Upcoming', color: 'secondary' }
    }
    if (endDate && endDate < now) {
      return { label: 'Expired', color: 'destructive' }
    }
    return { label: 'Active', color: 'default' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons & Discounts</h1>
          <p className="text-gray-500 mt-1">
            Manage promo codes, discounts, and promotional campaigns
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden" aria-describedby="coupon-description">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
              <DialogDescription id="coupon-description">
                Configure your coupon with discount rules, usage limits, and targeting
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value })
                        // Clear error when user starts typing
                        if (errors.title) setErrors(prev => ({ ...prev, title: '' }))
                      }}
                      placeholder="e.g., Summer Sale 2024"
                      required
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="promoCode">Promo Code *</Label>
                    <Input
                      id="promoCode"
                      value={formData.promoCode}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        setFormData({ ...formData, promoCode: value })
                        // Clear error when user starts typing
                        if (errors.promoCode) setErrors(prev => ({ ...prev, promoCode: '' }))
                      }}
                      placeholder="e.g., SUMMER2024"
                      required
                      className={errors.promoCode ? 'border-red-500' : ''}
                    />
                    {errors.promoCode && (
                      <p className="text-sm text-red-500">{errors.promoCode}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Only uppercase letters and numbers allowed
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your promotion..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Discount Configuration */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Discount Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Discount Type *</Label>
                    <Select
                      value={formData.discountType}
                      onValueChange={(value: 'percentage' | 'fixed') => {
                        setFormData({ ...formData, discountType: value })
                        // Clear discount value error when changing type
                        if (errors.discountValue) setErrors(prev => ({ ...prev, discountValue: '' }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Discount Value ({formData.discountType === 'percentage' ? '%' : 'currency'}) *
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min={formData.discountType === 'percentage' ? '1' : '0.01'}
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      value={formData.discountValue}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setFormData({ ...formData, discountValue: value })
                        // Clear error when user starts typing
                        if (errors.discountValue) setErrors(prev => ({ ...prev, discountValue: '' }))
                      }}
                      placeholder={
                        formData.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'
                      }
                      required
                      className={errors.discountValue ? 'border-red-500' : ''}
                    />
                    {errors.discountValue && (
                      <p className="text-sm text-red-500">{errors.discountValue}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {formData.discountType === 'percentage'
                        ? 'Enter a value between 1 and 100'
                        : 'Enter the discount amount in currency'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setFormData({ ...formData, minOrderAmount: value < 0 ? 0 : value })
                        // Clear error when user starts typing
                        if (errors.minOrderAmount) setErrors(prev => ({ ...prev, minOrderAmount: '' }))
                      }}
                      placeholder="e.g., 1000"
                      className={errors.minOrderAmount ? 'border-red-500' : ''}
                    />
                    {errors.minOrderAmount && (
                      <p className="text-sm text-red-500">{errors.minOrderAmount}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Minimum cart value required to apply this coupon
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount">Maximum Discount Amount</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setFormData({ ...formData, maxDiscountAmount: value < 0 ? 0 : value })
                        // Clear error when user starts typing
                        if (errors.maxDiscountAmount) setErrors(prev => ({ ...prev, maxDiscountAmount: '' }))
                      }}
                      placeholder="e.g., 2000"
                      className={errors.maxDiscountAmount ? 'border-red-500' : ''}
                    />
                    {errors.maxDiscountAmount && (
                      <p className="text-sm text-red-500">{errors.maxDiscountAmount}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Cap the maximum discount value (0 for no limit)
                    </p>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date Range
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData({ ...formData, startDate: e.target.value })
                        // Clear end date error when changing start date
                        if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }))
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty to start immediately
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => {
                        setFormData({ ...formData, endDate: e.target.value })
                        // Clear error when user starts typing
                        if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }))
                      }}
                      className={errors.endDate ? 'border-red-500' : ''}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-500">{errors.endDate}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Leave empty for no expiration
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage Limits */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usage Limits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Total Usage Limit</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setFormData({ ...formData, usageLimit: value < 0 ? 0 : value })
                        // Clear error when user starts typing
                        if (errors.usageLimit) setErrors(prev => ({ ...prev, usageLimit: '' }))
                      }}
                      placeholder="e.g., 100"
                      className={errors.usageLimit ? 'border-red-500' : ''}
                    />
                    {errors.usageLimit && (
                      <p className="text-sm text-red-500">{errors.usageLimit}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Maximum times this coupon can be used (0 for unlimited)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userLimit">Per User Limit</Label>
                    <Input
                      id="userLimit"
                      type="number"
                      min="0"
                      value={formData.userLimit}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        setFormData({ ...formData, userLimit: value < 0 ? 0 : value })
                        // Clear error when user starts typing
                        if (errors.userLimit) setErrors(prev => ({ ...prev, userLimit: '' }))
                      }}
                      placeholder="e.g., 1"
                      className={errors.userLimit ? 'border-red-500' : ''}
                    />
                    {errors.userLimit && (
                      <p className="text-sm text-red-500">{errors.userLimit}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Maximum times each user can use this coupon (0 for unlimited)
                    </p>
                  </div>
                </div>
              </div>

              {/* Product & Category Targeting */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Targeting
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Applicable Categories</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {categories.length === 0 ? (
                        <p className="text-sm text-gray-500">No categories available</p>
                      ) : (
                        categories.map((category) => (
                          <label key={category.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={formData.applicableCategories.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    applicableCategories: [
                                      ...formData.applicableCategories,
                                      category.id,
                                    ],
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    applicableCategories:
                                      formData.applicableCategories.filter((id) => id !== category.id),
                                  })
                                }
                              }}
                            />
                            {category.name}
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Leave empty to apply to all categories
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Applicable Products</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {products.length === 0 ? (
                        <p className="text-sm text-gray-500">No products available</p>
                      ) : (
                        products.map((product) => (
                          <label key={product.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={formData.applicableProducts.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    applicableProducts: [...formData.applicableProducts, product.id],
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    applicableProducts:
                                      formData.applicableProducts.filter((id) => id !== product.id),
                                  })
                                }
                              }}
                            />
                            {product.name}
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Leave empty to apply to all products
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Advanced Conditions (Optional)
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="conditions">Custom Conditions JSON</Label>
                  <Textarea
                    id="conditions"
                    value={formData.conditions}
                    onChange={(e) => {
                      setFormData({ ...formData, conditions: e.target.value })
                      // Clear error when user starts typing
                      if (errors.conditions) setErrors(prev => ({ ...prev, conditions: '' }))
                    }}
                    placeholder='{"newCustomersOnly": true, "minimumQuantity": 2}'
                    rows={4}
                    className={errors.conditions ? 'border-red-500' : ''}
                  />
                  {errors.conditions && (
                    <p className="text-sm text-red-500">{errors.conditions}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Advanced conditions as JSON (e.g., new customers only, minimum quantity)
                  </p>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2 border-t pt-4">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    resetForm()
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isSubmitting ? 'Saving...' : (editingPromotion ? 'Update Coupon' : 'Create Coupon')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons & Discounts</CardTitle>
          <CardDescription>
            Manage your promotional codes and discount offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No coupons yet</h3>
              <p className="text-gray-500 mt-1">
                Create your first coupon to start offering discounts
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto -mx-4 px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap min-w-[140px]">Code</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px]">Title</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[140px]">Discount</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[200px]">Date Range</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[120px]">Usage</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[100px]">Status</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => {
                    const status = getPromotionStatus(promotion)
                    const usagePercent = getUsagePercentage(
                      promotion.usedCount,
                      promotion.usageLimit
                    )

                    return (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-mono font-medium">
                          {promotion.promoCode}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{promotion.title}</div>
                          {promotion.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {promotion.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {promotion.discountType === 'percentage'
                              ? `${promotion.discountValue}% off`
                              : <PriceDisplay value={promotion.discountValue} />}
                          </Badge>
                          {(promotion.minOrderAmount ?? 0) > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Min: <PriceDisplay value={promotion.minOrderAmount ?? 0} />
                            </div>
                          )}
                          {(promotion.maxDiscountAmount ?? 0) > 0 && (
                            <div className="text-xs text-gray-500">
                              Max: <PriceDisplay value={promotion.maxDiscountAmount ?? 0} />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {promotion.startDate && (
                            <div>From: {new Date(promotion.startDate).toLocaleDateString()}</div>
                          )}
                          {promotion.endDate && (
                            <div>To: {new Date(promotion.endDate).toLocaleDateString()}</div>
                          )}
                          {!promotion.startDate && !promotion.endDate && (
                            <span className="text-gray-500">No date restrictions</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{promotion.usedCount}</span>
                              {(promotion.usageLimit ?? 0) > 0 && (
                                <span className="text-gray-500">
                                  {' '}
                                  / {promotion.usageLimit}
                                </span>
                              )}
                            </div>
                            {(promotion.usageLimit ?? 0) > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-violet-600 h-1.5 rounded-full"
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                            {(promotion.userLimit ?? 0) > 0 && (
                              <div className="text-xs text-gray-500">
                                {promotion.userLimit} per user
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.color as any}>{status.label}</Badge>
                          <div className="flex items-center gap-2 mt-2">
                            <Switch
                              checked={promotion.isActive}
                              onCheckedChange={() => toggleActive(promotion.id, promotion.isActive)}
                              className="h-5 w-9"
                              disabled={togglingActive === promotion.id}
                              aria-label={promotion.isActive ? 'Deactivate promotion' : 'Activate promotion'}
                            />
                            <span className="text-xs text-gray-500">
                              {promotion.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(promotion)}
                              className="min-h-[44px] min-w-[44px] p-2"
                              aria-label="Edit promotion"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(promotion.id)}
                              disabled={deletingPromotion === promotion.id}
                              className="min-h-[44px] min-w-[44px] p-2"
                              aria-label="Delete promotion"
                            >
                              {deletingPromotion === promotion.id ? (
                                <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}