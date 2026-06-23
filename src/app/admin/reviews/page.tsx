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
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  Star,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface Review {
  id: string
  productId: string
  rating: number
  title: string
  comment: string
  isApproved: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  product: {
    id: string
    name: string
    slug: string
    images: string[]
  }
}

export default function ReviewsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Pagination
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const fetchReviews = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '20',
        status: statusFilter,
      })
      if (debouncedSearchTerm) {
        params.set('productId', debouncedSearchTerm)
      }

      const res = await fetch(`/api/admin/reviews?${params}`)
      const data = await res.json() as any

      if (data.success) {
        if (append) {
          setReviews(prev => [...prev, ...data.data])
        } else {
          setReviews(data.data)
        }
        setTotal(data.pagination.total)
        setHasMore(pageNum < data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' })
      setHasMore(false)
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }, [statusFilter, debouncedSearchTerm, toast])

  useEffect(() => {
    setPage(1)
    fetchReviews(1)
  }, [fetchReviews])

  // Infinite scroll
  useEffect(() => {
    if (loading || isLoadingMore || !hasMore) return
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        const nextPage = page + 1
        setPage(nextPage)
        fetchReviews(nextPage, true)
      }
    })

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [loading, isLoadingMore, hasMore, page, fetchReviews])

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json() as any
      if (data.success) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isApproved: true } : r))
        toast({ title: 'Success', description: 'Review approved' })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to approve', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reviewId: string) => {
    setActionLoading(reviewId)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })
      const data = await res.json() as any
      if (data.success) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isApproved: false } : r))
        toast({ title: 'Success', description: 'Review rejected' })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to reject', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteReviewId) return
    setDeletingReviewId(deleteReviewId)
    try {
      const res = await fetch(`/api/admin/reviews/${deleteReviewId}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (data.success) {
        setReviews(prev => prev.filter(r => r.id !== deleteReviewId))
        setTotal(prev => prev - 1)
        toast({ title: 'Success', description: 'Review deleted' })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete', variant: 'destructive' })
    } finally {
      setDeletingReviewId(null)
      setDeleteReviewId(null)
    }
  }

  const getStatusBadge = (isApproved: boolean) => {
    return isApproved
      ? <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>
      : <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  const tabs = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'All', value: 'all' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Product Reviews</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by product ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchReviews(1)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              statusFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-500">
            {loading ? 'Loading...' : `${total} review${total !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                        <span className="ml-2 text-sm text-gray-500">Loading reviews...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="text-center py-8 text-gray-500">No reviews found</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {review.product.images[0] ? (
                              <img
                                src={review.product.images[0]}
                                alt={review.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No img
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium line-clamp-1 max-w-[150px]">
                            {review.product.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{review.user.name}</p>
                          <p className="text-xs text-gray-500">{review.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-sm font-medium line-clamp-1">{review.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{review.comment}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(review.isApproved)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {!review.isApproved && (
                              <DropdownMenuItem onClick={() => handleApprove(review.id)} disabled={actionLoading === review.id}>
                                {actionLoading === review.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                )}
                                Approve
                              </DropdownMenuItem>
                            )}
                            {review.isApproved && (
                              <DropdownMenuItem onClick={() => handleReject(review.id)} disabled={actionLoading === review.id}>
                                {actionLoading === review.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                )}
                                Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    setDeleteReviewId(review.id)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent aria-describedby="delete-review-description">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Review</AlertDialogTitle>
                                  <AlertDialogDescription id="delete-review-description">
                                    Are you sure you want to delete this review by "{review.user.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setDeleteReviewId(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={deletingReviewId !== null}
                                  >
                                    {deletingReviewId ? (
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
                  ))
                )}
              </TableBody>
            </Table>
            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4" />
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                <span className="ml-2 text-sm text-gray-500">Loading more...</span>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
