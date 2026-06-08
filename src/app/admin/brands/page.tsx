'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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
  Package,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  X,
  Globe,
} from 'lucide-react'
import { GallerySelector } from '@/components/admin/gallery-selector'
import { ImageUpload } from '@/components/admin/image-upload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COUNTRIES } from '@/lib/countries'

interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  website: string | null
  description: string | null
  country: string | null
  isActive: boolean
  featured: boolean
  sortOrder: number
  createdAt: string
  productCount?: number
}

export default function BrandsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)

  // Intersection Observer ref
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addFormData, setAddFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    logo: '',
    country: '',
    isActive: true,
    featured: false,
    sortOrder: 0,
  })
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({})

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    logo: '',
    country: '',
    isActive: true,
    featured: false,
    sortOrder: 0,
  })
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({})

  // Delete modal state
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<string | null>(null)

  // Loading states for form submissions
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Auto-generate slug when name changes (only for new brands)
  const handleNameChange = (name: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData({ ...editFormData, name })
    } else {
      const slug = generateSlug(name)
      setAddFormData({ 
        ...addFormData, 
        name, 
        slug 
      })
    }
  }

  // Helper to convert empty strings to null for optional fields
  const toOptionalString = (value: string): string | null => {
    if (!value || value.trim() === '') return null
    return value
  }

  // Validate form data
  const validateForm = (formData: typeof addFormData, isEditMode: boolean = false): boolean => {
    const errors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Brand name is required'
    } else if (formData.name.length < 2) {
      errors.name = 'Brand name must be at least 2 characters'
    } else if (formData.name.length > 100) {
      errors.name = 'Brand name must be less than 100 characters'
    }

    // Slug validation
    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens (e.g., "my-brand")'
    } else if (formData.slug.startsWith('-') || formData.slug.endsWith('-')) {
      errors.slug = 'Slug cannot start or end with a hyphen'
    } else if (formData.slug.includes('--')) {
      errors.slug = 'Slug cannot contain consecutive hyphens'
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    // Website URL validation
    if (formData.website && formData.website.trim() !== '') {
      if (!isValidUrl(formData.website)) {
        errors.website = 'Please enter a valid URL (e.g., "https://example.com")'
      }
    }

    // Sort order validation
    if (formData.sortOrder < 0) {
      errors.sortOrder = 'Sort order must be a non-negative number'
    } else if (formData.sortOrder > 9999) {
      errors.sortOrder = 'Sort order must be less than 10000'
    }

    if (isEditMode) {
      setEditFormErrors(errors)
    } else {
      setAddFormErrors(errors)
    }

    return Object.keys(errors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true
    try {
      const urlObj = new URL(url)
      // Must be http or https protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  const fetchBrands = async (pageNum: number = 1, append: boolean = false) => {
    if (append && isLoadingMore) return

    try {
      if (!append) setLoading(true)
      else setIsLoadingMore(true)

      const params = new URLSearchParams()
      params.append('page', pageNum.toString())
      params.append('limit', '20')
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      params.append('includeProductCount', 'true')

      const response = await fetch(`/api/admin/brands?${params.toString()}`)
      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch brands')
      }

      if (append) {
        setBrands(prev => [...prev, ...(result.data || [])])
      } else {
        setBrands(result.data || [])
      }

      if (result.pagination) {
        setHasMore(result.pagination.hasNextPage)
        setTotal(result.pagination.totalCount)
        setPage(pageNum)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching brands:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch brands',
        variant: 'destructive',
      })
    } finally {
      if (!append) setLoading(false)
      else setIsLoadingMore(false)
    }
  }

  // Load more data when sentinel is visible
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !loading) {
      fetchBrands(page + 1, true)
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

  useEffect(() => {
    fetchBrands(1, false)
  }, [])

  useEffect(() => {
    // Reset to page 1 when search changes
    fetchBrands(1, false)
  }, [debouncedSearchTerm])

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form before submitting
    if (!validateForm(addFormData, false)) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addFormData.name,
          slug: addFormData.slug,
          description: addFormData.description || null,
          website: addFormData.website || null,
          logo: addFormData.logo || null,
          country: addFormData.country || null,
          isActive: addFormData.isActive,
          featured: addFormData.featured,
          sortOrder: addFormData.sortOrder || 0,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        // Handle duplicate slug specifically
        if (response.status === 409 || result.error?.toLowerCase().includes('already exists')) {
          setAddFormErrors({ slug: result.error || 'A brand with this slug already exists' })
        }
        throw new Error(result.error || 'Failed to create brand')
      }

      toast({
        title: 'Success',
        description: 'Brand created successfully',
      })

      setIsAddModalOpen(false)
      setAddFormData({
        name: '',
        slug: '',
        description: '',
        website: '',
        logo: '',
        country: '',
        isActive: true,
        featured: false,
        sortOrder: 0,
      })
      setAddFormErrors({})
      fetchBrands(1, false)
    } catch (err: any) {
      console.error('Error creating brand:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to create brand',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand)
    setEditFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      website: brand.website || '',
      logo: brand.logo || '',
      country: brand.country || '',
      isActive: brand.isActive,
      featured: brand.featured,
      sortOrder: brand.sortOrder,
    })
    setEditFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBrand) return

    // Validate form before submitting
    if (!validateForm(editFormData, true)) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name,
          slug: editFormData.slug,
          description: editFormData.description || null,
          website: editFormData.website || null,
          logo: editFormData.logo || null,
          country: editFormData.country || null,
          isActive: editFormData.isActive,
          featured: editFormData.featured,
          sortOrder: editFormData.sortOrder,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        // Handle duplicate slug specifically
        if (response.status === 409 || result.error?.toLowerCase().includes('already exists')) {
          setEditFormErrors({ slug: result.error || 'A brand with this slug already exists' })
        }
        throw new Error(result.error || 'Failed to update brand')
      }

      toast({
        title: 'Success',
        description: 'Brand updated successfully',
      })

      setIsEditModalOpen(false)
      setEditFormErrors({})
      fetchBrands(1, false)
    } catch (err: any) {
      console.error('Error updating brand:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update brand',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleBrandStatus = async (brand: Brand) => {
    try {
      const response = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !brand.isActive,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to update brand')
      }

      toast({
        title: 'Success',
        description: `Brand ${brand.isActive ? 'deactivated' : 'activated'} successfully`,
      })

      fetchBrands(1, false)
    } catch (err: any) {
      console.error('Error updating brand:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update brand',
        variant: 'destructive',
      })
    }
  }

  const toggleBrandFeatured = async (brand: Brand) => {
    try {
      const response = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featured: !brand.featured,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to update brand')
      }

      toast({
        title: 'Success',
        description: `Brand ${brand.featured ? 'removed from featured' : 'marked as featured'}`,
      })

      fetchBrands(1, false)
    } catch (err: any) {
      console.error('Error updating brand:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update brand',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteBrand = async () => {
    if (!deleteBrandId) return

    setDeletingBrand(deleteBrandId)
    try {
      const response = await fetch(`/api/admin/brands/${deleteBrandId}`, {
        method: 'DELETE',
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete brand')
      }

      toast({
        title: 'Success',
        description: 'Brand deleted successfully',
      })

      setDeleteBrandId(null)
      fetchBrands(1, false)
    } catch (err: any) {
      console.error('Error deleting brand:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete brand',
        variant: 'destructive',
      })
    } finally {
      setDeletingBrand(null)
    }
  }



  const stats = brands.reduce(
    (acc, brand) => {
      acc.total++
      if (brand.isActive) acc.active++
      else acc.inactive++
      if (brand.featured) acc.featured++
      acc.products += brand.productCount || 0
      return acc
    },
    { total: 0, active: 0, inactive: 0, featured: 0, products: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product brands</p>
        </div>
        <Button
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Brands</p>
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
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Featured</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.featured}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.products}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => fetchBrands(1, false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          {total > 0 && (
            <div className="text-xs text-gray-500">
              Showing {brands.length} of {total} brands
              {!hasMore && brands.length < total && <span className="ml-2"> (all loaded)</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No brands found</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[220px]">Brand</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">Slug</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Country</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Description</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Products</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[220px]">
                          {brand.logo ? (
                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                              {brand.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900">{brand.name}</p>
                              {brand.featured && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            {brand.website && (
                              <a
                                href={brand.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 hover:text-violet-600 flex items-center gap-1 mt-0.5"
                              >
                                <Globe className="h-3 w-3" />
                                Visit website
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 break-all">
                          {brand.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {brand.country ? (
                          <span className="text-sm text-gray-600">{brand.country}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 truncate min-w-[200px]">
                          {brand.description || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{brand.productCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={brand.isActive ? 'default' : 'secondary'}
                          className={brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {brand.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => openEditModal(brand)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Brand
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleBrandStatus(brand)}>
                              {brand.isActive ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleBrandFeatured(brand)}>
                              {brand.featured ? (
                                <>
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Remove from Featured
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Mark as Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    setDeleteBrandId(brand.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent aria-describedby="delete-brand-description">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Brand</AlertDialogTitle>
                                  <AlertDialogDescription id="delete-brand-description">
                                    Are you sure you want to delete "{brand.name}"? This action cannot be undone.
                                    {(brand.productCount || 0) > 0 && (
                                      <span className="block mt-2 text-orange-600 font-medium">
                                        Warning: This brand is used by {brand.productCount} product(s).
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteBrandId(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteBrand}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deletingBrand !== null}
                                  >
                                    {deletingBrand ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      'Delete'
                                    )}
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
                {isLoadingMore && (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                          <span className="ml-2 text-sm text-gray-500">Loading more brands...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div ref={sentinelRef} className="h-4" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Brand Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent aria-describedby="add-brand-description" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Brand</DialogTitle>
            <DialogDescription id="add-brand-description">Create a new brand for your products.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBrand} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Name *</label>
              <Input
                value={addFormData.name}
                onChange={(e) => handleNameChange(e.target.value, false)}
                className={addFormErrors.name ? 'border-red-500' : ''}
              />
              {addFormErrors.name && (
                <p className="text-sm text-red-600">{addFormErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug *</label>
              <Input
                value={addFormData.slug}
                onChange={(e) => setAddFormData({ ...addFormData, slug: e.target.value })}
                className={addFormErrors.slug ? 'border-red-500' : ''}
                placeholder="e.g., my-brand"
              />
              {addFormErrors.slug && (
                <p className="text-sm text-red-600">{addFormErrors.slug}</p>
              )}
              {!addFormErrors.slug && (
                <p className="text-xs text-gray-500">
                  URL-friendly version of the brand name. Auto-generated from name.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL</label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={addFormData.website || ''}
                onChange={(e) => setAddFormData({ ...addFormData, website: e.target.value })}
                className={addFormErrors.website ? 'border-red-500' : ''}
              />
              {addFormErrors.website && (
                <p className="text-sm text-red-600">{addFormErrors.website}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select
                value={addFormData.country || 'none'}
                onValueChange={(value) => setAddFormData({ ...addFormData, country: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No country selected</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={addFormData.description || ''}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                className={addFormErrors.description ? 'border-red-500' : ''}
              />
              {addFormErrors.description && (
                <p className="text-sm text-red-600">{addFormErrors.description}</p>
              )}
              {!addFormErrors.description && addFormData.description && (
                <p className="text-xs text-gray-500">
                  {addFormData.description.length} / 500 characters
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                value={addFormData.sortOrder}
                onChange={(e) => setAddFormData({ ...addFormData, sortOrder: parseInt(e.target.value) || 0 })}
                min="0"
                className={addFormErrors.sortOrder ? 'border-red-500' : ''}
              />
              {addFormErrors.sortOrder && (
                <p className="text-sm text-red-600">{addFormErrors.sortOrder}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Logo</label>
              <ImageUpload
                images={addFormData.logo ? [addFormData.logo] : []}
                onImagesChange={(urls) => {
                  setAddFormData({ ...addFormData, logo: urls[0] || '' })
                }}
                maxImages={1}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addFormData.isActive}
                  onChange={(e) => setAddFormData({ ...addFormData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addFormData.featured}
                  onChange={(e) => setAddFormData({ ...addFormData, featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Featured</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Brand
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddModalOpen(false)
                setAddFormErrors({})
              }} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Brand Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent aria-describedby="edit-brand-description" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription id="edit-brand-description">Update brand information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBrand} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Name *</label>
              <Input
                value={editFormData.name}
                onChange={(e) => handleNameChange(e.target.value, true)}
                className={editFormErrors.name ? 'border-red-500' : ''}
              />
              {editFormErrors.name && (
                <p className="text-sm text-red-600">{editFormErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug *</label>
              <Input
                value={editFormData.slug}
                onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                className={editFormErrors.slug ? 'border-red-500' : ''}
                placeholder="e.g., my-brand"
              />
              {editFormErrors.slug && (
                <p className="text-sm text-red-600">{editFormErrors.slug}</p>
              )}
              {!editFormErrors.slug && (
                <p className="text-xs text-gray-500">
                  URL-friendly version of the brand name. Auto-generated from name.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL</label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={editFormData.website}
                onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                className={editFormErrors.website ? 'border-red-500' : ''}
              />
              {editFormErrors.website && (
                <p className="text-sm text-red-600">{editFormErrors.website}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Country</label>
              <Select
                value={editFormData.country}
                onValueChange={(value) => setEditFormData({ ...editFormData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No country selected</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className={editFormErrors.description ? 'border-red-500' : ''}
              />
              {editFormErrors.description && (
                <p className="text-sm text-red-600">{editFormErrors.description}</p>
              )}
              {!editFormErrors.description && editFormData.description && (
                <p className="text-xs text-gray-500">
                  {editFormData.description.length} / 500 characters
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                value={editFormData.sortOrder}
                onChange={(e) => setEditFormData({ ...editFormData, sortOrder: parseInt(e.target.value) || 0 })}
                min="0"
                className={editFormErrors.sortOrder ? 'border-red-500' : ''}
              />
              {editFormErrors.sortOrder && (
                <p className="text-sm text-red-600">{editFormErrors.sortOrder}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Logo</label>
              <ImageUpload
                images={editFormData.logo ? [editFormData.logo] : []}
                onImagesChange={(urls) => {
                  setEditFormData({ ...editFormData, logo: urls[0] || '' })
                }}
                maxImages={1}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editFormData.featured}
                  onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium">Featured</label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Brand
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false)
                setEditFormErrors({})
              }} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
