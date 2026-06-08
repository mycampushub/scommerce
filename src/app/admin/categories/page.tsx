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
  List,
  LayoutGrid,
} from 'lucide-react'
import { GallerySelector } from '@/components/admin/gallery-selector'
import { ImageUpload } from '@/components/admin/image-upload'
import { CategoryTree, buildCategoryTree, CategoryNode } from '@/components/admin/category-tree'
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
  description: string | null
  image: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  _count: {
    products: number
  }
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree')
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
    image: '',
    isActive: true,
    parentId: 'none',
    sortOrder: 0,
  })
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({})

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
    parentId: 'none',
    sortOrder: 0,
  })
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({})

  // Delete modal state
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null)

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

  // Auto-generate slug when name changes (only for new categories)
  const handleNameChange = (name: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditFormData({ ...editFormData, name })
    } else {
      const slug = generateSlug(name)
      setAddFormData({ ...addFormData, name, slug })
    }
  }

  // Validate form data
  const validateForm = (formData: typeof addFormData, isEditMode: boolean = false, categoryId?: string): boolean => {
    const errors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Category name is required'
    } else if (formData.name.length < 2) {
      errors.name = 'Category name must be at least 2 characters'
    } else if (formData.name.length > 100) {
      errors.name = 'Category name must be less than 100 characters'
    }

    // Slug validation
    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    } else if (formData.slug.startsWith('-') || formData.slug.endsWith('-')) {
      errors.slug = 'Slug cannot start or end with a hyphen'
    } else if (formData.slug.includes('--')) {
      errors.slug = 'Slug cannot contain consecutive hyphens'
    } else if (formData.slug.length < 2) {
      errors.slug = 'Slug must be at least 2 characters'
    } else if (formData.slug.length > 100) {
      errors.slug = 'Slug must be less than 100 characters'
    } else if (!isEditMode) {
      // Check for duplicate slugs when creating new category
      const duplicateSlug = categories.find(c => c.slug === formData.slug)
      if (duplicateSlug) {
        errors.slug = 'This slug is already in use. Please choose a different one.'
      }
    } else if (isEditMode && categoryId) {
      // Check for duplicate slugs when editing (exclude current category)
      const duplicateSlug = categories.find(c => c.slug === formData.slug && c.id !== categoryId)
      if (duplicateSlug) {
        errors.slug = 'This slug is already in use by another category. Please choose a different one.'
      }
    }

    // Parent category validation
    if (formData.parentId && formData.parentId !== 'none') {
      const parentExists = categories.find(c => c.id === formData.parentId)
      if (!parentExists) {
        errors.parentId = 'Selected parent category does not exist'
      } else if (isEditMode && categoryId && formData.parentId === categoryId) {
        errors.parentId = 'A category cannot be its own parent'
      }
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      errors.description = `Description must be less than 500 characters (currently ${formData.description.length})`
    }

    // Sort order validation
    if (formData.sortOrder < 0) {
      errors.sortOrder = 'Sort order must be a positive number'
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

  const fetchCategories = async (pageNum: number = 1, append: boolean = false) => {
    if (append && isLoadingMore) return

    try {
      if (!append) setLoading(true)
      else setIsLoadingMore(true)

      const params = new URLSearchParams()
      params.append('page', pageNum.toString())
      params.append('limit', '20')
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)

      const response = await fetch(`/api/admin/categories?${params.toString()}`)
      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories')
      }

      if (append) {
        setCategories(prev => [...prev, ...(result.data || [])])
      } else {
        setCategories(result.data || [])
      }

      if (result.pagination) {
        setHasMore(result.pagination.hasNextPage)
        setTotal(result.pagination.totalCount)
        setPage(pageNum)
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching categories:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      })
    } finally {
      if (!append) setLoading(false)
      else setIsLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !loading) {
      fetchCategories(page + 1, true)
    }
  }, [hasMore, isLoadingMore, loading, page])

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
    fetchCategories(1, false)
  }, [])

  useEffect(() => {
    fetchCategories(1, false)
  }, [debouncedSearchTerm])



  const handleCreateCategory = async (e: React.FormEvent) => {
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
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addFormData.name,
          slug: addFormData.slug,
          description: addFormData.description,
          image: addFormData.image || null,
          isActive: addFormData.isActive,
          parentId: addFormData.parentId === 'none' ? null : addFormData.parentId,
          sortOrder: addFormData.sortOrder || 0,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to create category')
      }

      toast({
        title: 'Success',
        description: 'Category created successfully',
      })

      setIsAddModalOpen(false)
      setAddFormData({ name: '', slug: '', description: '', image: '', isActive: true, parentId: 'none', sortOrder: 0 })
      setAddFormErrors({})
      fetchCategories(1, false)
    } catch (err: any) {
      console.error('Error creating category:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to create category',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setEditFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      isActive: category.isActive,
      parentId: category.parentId || 'none',
      sortOrder: category.sortOrder,
    })
    setEditFormErrors({})
    setIsEditModalOpen(true)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    // Validate form before submitting
    if (!validateForm(editFormData, true, editingCategory.id)) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name,
          slug: editFormData.slug,
          description: editFormData.description,
          image: editFormData.image || null,
          isActive: editFormData.isActive,
          parentId: editFormData.parentId === 'none' ? null : editFormData.parentId,
          sortOrder: editFormData.sortOrder,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to update category')
      }

      toast({
        title: 'Success',
        description: 'Category updated successfully',
      })

      setIsEditModalOpen(false)
      setEditFormErrors({})
      fetchCategories(1, false)
    } catch (err: any) {
      console.error('Error updating category:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update category',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !category.isActive,
        }),
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to update category')
      }

      toast({
        title: 'Success',
        description: `Category ${category.isActive ? 'deactivated' : 'activated'} successfully`,
      })

      fetchCategories(1, false)
    } catch (err: any) {
      console.error('Error updating category:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update category',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategoryId) return

    setDeletingCategory(deleteCategoryId)
    try {
      const response = await fetch(`/api/admin/categories/${deleteCategoryId}`, {
        method: 'DELETE',
      })

      const result = await response.json() as any

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete category')
      }

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      })

      setDeleteCategoryId(null)
      fetchCategories(1, false)
    } catch (err: any) {
      console.error('Error deleting category:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete category',
        variant: 'destructive',
      })
    } finally {
      setDeletingCategory(null)
    }
  }



  const handleTreeAdd = (parentId?: string) => {
    setAddFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
      parentId: parentId || '',
      sortOrder: 0,
    })
    setAddFormErrors({})
    setIsAddModalOpen(true)
  }

  const stats = categories.reduce(
    (acc, category) => {
      acc.total++
      if (category.isActive) acc.active++
      else acc.inactive++
      acc.products += category._count.products
      return acc
    },
    { total: 0, active: 0, inactive: 0, products: 0 }
  )

  // Build tree structure for tree view
  const categoryTree = buildCategoryTree(categories)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Organize products into categories and sub-categories</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setViewMode('tree')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Tree
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
          <Button
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            onClick={() => handleTreeAdd()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Categories</p>
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
                <p className="text-xs text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.inactive}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <EyeOff className="h-4 w-4 text-orange-600" />
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
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => fetchCategories(1, false)} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No categories found</p>
            </div>
          ) : viewMode === 'tree' ? (
            <div className="overflow-x-auto -mx-4 px-4">
              <CategoryTree
                categories={categoryTree}
                onAdd={handleTreeAdd}
                onEdit={openEditModal}
                onDelete={(cat) => setDeleteCategoryId(cat.id)}
                onToggleStatus={toggleCategoryStatus}
              />
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[220px]">Category</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">Slug</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Parent</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Description</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Products</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-violet-600 flex-shrink-0">
                            {category.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900">{category.name}</p>
                            <p className="text-xs text-gray-500">ID: {category.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 break-all">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {category.parentId ? (
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {categories.find(c => c.id === category.parentId)?.name || category.parentId}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Root</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 truncate min-w-[200px]">
                          {category.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{category._count.products}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.isActive ? 'default' : 'secondary'}
                          className={category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => openEditModal(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleCategoryStatus(category)}>
                              {category.isActive ? (
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
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    setDeleteCategoryId(category.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent aria-describedby="delete-category-description">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription id="delete-category-description">
                                    Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                    {category._count.products > 0 && (
                                      <span className="block mt-2 text-orange-600 font-medium">
                                        Warning: This category contains {category._count.products} product(s).
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteCategoryId(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDeleteCategory}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deletingCategory !== null}
                                  >
                                    {deletingCategory ? (
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
                          <span className="ml-2 text-sm text-gray-500">Loading more categories...</span>
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

      {/* Add Category Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent aria-describedby="add-category-description" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription id="add-category-description">Create a new category to organize your products.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Category Name
                <span className="text-red-500" aria-label="required">*</span>
              </label>
              <Input
                value={addFormData.name}
                onChange={(e) => handleNameChange(e.target.value, false)}
                className={addFormErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="Enter category name (e.g., Electronics)"
                aria-invalid={!!addFormErrors.name}
                aria-describedby={addFormErrors.name ? 'name-error' : undefined}
              />
              {addFormErrors.name && (
                <p id="name-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {addFormErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Slug
                <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <Input
                  value={addFormData.slug}
                  onChange={(e) => setAddFormData({ ...addFormData, slug: e.target.value })}
                  className={addFormErrors.slug ? 'border-red-500 focus:border-red-500 focus:ring-red-500 pr-8' : 'pr-8'}
                  placeholder="e.g., electronics (URL-friendly)"
                  aria-invalid={!!addFormErrors.slug}
                  aria-describedby={addFormErrors.slug ? 'slug-error' : 'slug-hint'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className={`w-4 h-4 ${addFormErrors.slug ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              {!addFormErrors.slug && (
                <p id="slug-hint" className="text-xs text-gray-500">
                  URL-friendly identifier. Only lowercase letters, numbers, and hyphens allowed.
                </p>
              )}
              {addFormErrors.slug && (
                <p id="slug-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {addFormErrors.slug}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Parent Category
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <Select
                value={addFormData.parentId}
                onValueChange={(value) => setAddFormData({ ...addFormData, parentId: value })}
              >
                <SelectTrigger className={addFormErrors.parentId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                  <SelectValue placeholder="No parent (root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root category)</SelectItem>
                  {categories
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {addFormErrors.parentId && (
                <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {addFormErrors.parentId}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Sort Order
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                value={addFormData.sortOrder}
                onChange={(e) => setAddFormData({ ...addFormData, sortOrder: parseInt(e.target.value) || 0 })}
                min="0"
                max="9999"
                className={addFormErrors.sortOrder ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="0"
                aria-invalid={!!addFormErrors.sortOrder}
                aria-describedby={addFormErrors.sortOrder ? 'sortorder-error' : 'sortorder-hint'}
              />
              {!addFormErrors.sortOrder && (
                <p id="sortorder-hint" className="text-xs text-gray-500">
                  Lower numbers appear first in the list
                </p>
              )}
              {addFormErrors.sortOrder && (
                <p id="sortorder-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {addFormErrors.sortOrder}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-1">
                  Description
                  <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </span>
                {addFormData.description && (
                  <span className={`text-xs ${addFormData.description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {addFormData.description.length}/500
                  </span>
                )}
              </label>
              <Input
                value={addFormData.description}
                onChange={(e) => setAddFormData({ ...addFormData, description: e.target.value })}
                className={addFormErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="Brief description of this category"
                maxLength={500}
                aria-invalid={!!addFormErrors.description}
                aria-describedby={addFormErrors.description ? 'description-error' : undefined}
              />
              {addFormErrors.description && (
                <p id="description-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {addFormErrors.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Category Image
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <ImageUpload
                images={addFormData.image ? [addFormData.image] : []}
                onImagesChange={(urls) => {
                  setAddFormData({ ...addFormData, image: urls[0] || '' })
                }}
                maxImages={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addFormData.isActive}
                onChange={(e) => setAddFormData({ ...addFormData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Category
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

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent aria-describedby="edit-category-description" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription id="edit-category-description">Update category information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Category Name
                <span className="text-red-500" aria-label="required">*</span>
              </label>
              <Input
                value={editFormData.name}
                onChange={(e) => handleNameChange(e.target.value, true)}
                className={editFormErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="Enter category name (e.g., Electronics)"
                aria-invalid={!!editFormErrors.name}
                aria-describedby={editFormErrors.name ? 'edit-name-error' : undefined}
              />
              {editFormErrors.name && (
                <p id="edit-name-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {editFormErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Slug
                <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <Input
                  value={editFormData.slug}
                  onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                  className={editFormErrors.slug ? 'border-red-500 focus:border-red-500 focus:ring-red-500 pr-8' : 'pr-8'}
                  placeholder="e.g., electronics (URL-friendly)"
                  aria-invalid={!!editFormErrors.slug}
                  aria-describedby={editFormErrors.slug ? 'edit-slug-error' : 'edit-slug-hint'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className={`w-4 h-4 ${editFormErrors.slug ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              {!editFormErrors.slug && (
                <p id="edit-slug-hint" className="text-xs text-gray-500">
                  URL-friendly identifier. Only lowercase letters, numbers, and hyphens allowed.
                </p>
              )}
              {editFormErrors.slug && (
                <p id="edit-slug-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {editFormErrors.slug}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Parent Category
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <Select
                value={editFormData.parentId}
                onValueChange={(value) => setEditFormData({ ...editFormData, parentId: value })}
              >
                <SelectTrigger className={editFormErrors.parentId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}>
                  <SelectValue placeholder="No parent (root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root category)</SelectItem>
                  {categories
                    .filter(c => c.id !== editingCategory?.id)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {editFormErrors.parentId && (
                <p className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {editFormErrors.parentId}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Sort Order
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="number"
                value={editFormData.sortOrder}
                onChange={(e) => setEditFormData({ ...editFormData, sortOrder: parseInt(e.target.value) || 0 })}
                min="0"
                max="9999"
                className={editFormErrors.sortOrder ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="0"
                aria-invalid={!!editFormErrors.sortOrder}
                aria-describedby={editFormErrors.sortOrder ? 'edit-sortorder-error' : 'edit-sortorder-hint'}
              />
              {!editFormErrors.sortOrder && (
                <p id="edit-sortorder-hint" className="text-xs text-gray-500">
                  Lower numbers appear first in the list
                </p>
              )}
              {editFormErrors.sortOrder && (
                <p id="edit-sortorder-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {editFormErrors.sortOrder}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-1">
                  Description
                  <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </span>
                {editFormData.description && (
                  <span className={`text-xs ${editFormData.description.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                    {editFormData.description.length}/500
                  </span>
                )}
              </label>
              <Input
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className={editFormErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                placeholder="Brief description of this category"
                maxLength={500}
                aria-invalid={!!editFormErrors.description}
                aria-describedby={editFormErrors.description ? 'edit-description-error' : undefined}
              />
              {editFormErrors.description && (
                <p id="edit-description-error" className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {editFormErrors.description}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Category Image
                <span className="text-xs text-gray-400 font-normal">(Optional)</span>
              </label>
              <ImageUpload
                images={editFormData.image ? [editFormData.image] : []}
                onImagesChange={(urls) => {
                  setEditFormData({ ...editFormData, image: urls[0] || '' })
                }}
                maxImages={1}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Category
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
