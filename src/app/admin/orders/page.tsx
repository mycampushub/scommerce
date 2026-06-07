'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Search,
  Eye,
  MoreVertical,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  CalendarIcon,
  Filter,
  X,
  ChevronDown
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminOrdersInfinite, useUpdateOrderStatus, useExportOrders, type Order } from '@/hooks/use-admin-orders'
import { format, addDays, subDays } from 'date-fns'
import { cn } from '@/lib/utils'

// Status Badge Component (defined outside component to avoid recreation on each render)
function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { icon: Clock, color: 'bg-orange-100 text-orange-700', label: 'Pending' },
    CONFIRMED: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700', label: 'Confirmed' },
    PROCESSING: { icon: Package, color: 'bg-purple-100 text-purple-700', label: 'Processing' },
    SHIPPED: { icon: Truck, color: 'bg-indigo-100 text-indigo-700', label: 'Shipped' },
    DELIVERED: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Delivered' },
    CANCELLED: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Cancelled' },
    REFUNDED: { icon: AlertCircle, color: 'bg-gray-100 text-gray-700', label: 'Refunded' },
  }

  const { icon: Icon, color, label } = config[status as keyof typeof config] || config.PENDING

  return (
    <Badge variant="secondary" className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Intersection Observer ref
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Order details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Status update modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingStatus, setTrackingStatus] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')

  // Fetch orders using React Query infinite scroll
  const filters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: debouncedSearchTerm || undefined,
    dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
    dateTo: dateTo ? dateTo.toISOString() : undefined,
  }
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useAdminOrdersInfinite(filters)

  const orders = data?.pages.flatMap(page => page.data) || []

  // Total count from first page
  const total = data?.pages[0]?.pagination?.totalCount || 0

  // Update order status mutation
  const { mutate: updateOrderStatus } = useUpdateOrderStatus()

  // Export orders
  const { export: exportOrders } = useExportOrders()

  // Load more when sentinel comes into view
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage])

  // Setup IntersectionObserver
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
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
  }, [sentinelRef, hasNextPage, isFetchingNextPage, isLoading, loadMore])

  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalOpen(true)
  }

  const openStatusModal = (order: Order) => {
    setUpdatingOrder(order)
    setNewStatus(order.status)
    setTrackingNumber(order.trackingNumber || '')
    setTrackingStatus(order.trackingStatus || 'PENDING')
    setEstimatedDeliveryDate(order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0] : '')
    setIsStatusModalOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!updatingOrder) return

    updateOrderStatus({
      orderId: updatingOrder.id,
      status: newStatus,
      trackingNumber: trackingNumber || null,
      trackingStatus: trackingStatus || 'PENDING',
      estimatedDeliveryDate: estimatedDeliveryDate || null,
    })

    setIsStatusModalOpen(false)
  }

  const handleExportOrders = async () => {
    exportOrders({ status: statusFilter === 'all' ? undefined : statusFilter })
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const stats = orders.reduce(
    (acc, order) => {
      acc.total++
      if (order.status === 'PENDING') acc.pending++
      if (order.status === 'PROCESSING') acc.processing++
      if (order.status === 'DELIVERED') acc.delivered++
      return acc
    },
    { total: 0, pending: 0, processing: 0, delivered: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer orders and shipments</p>
        </div>
        <Button variant="outline" onClick={handleExportOrders}>
          <Download className="h-4 w-4 mr-2" />
          Export Orders (CSV)
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Orders</p>
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
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Processing</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processing}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showAdvancedFilters ? (
                  <ChevronDown className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2 rotate-180" />
                )}
                {(dateFrom || dateTo) && (
                  <Badge variant="secondary" className="ml-2 h-5">
                    {dateFrom && dateTo ? '2' : '1'}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>

            {/* Advanced Date Range Filters */}
            {showAdvancedFilters && (
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dateFrom && !dateTo && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? (
                          dateTo ? (
                            <>
                              {format(dateFrom, 'LLL dd, y')} - {format(dateTo, 'LLL dd, y')}
                            </>
                          ) : (
                            format(dateFrom, 'LLL dd, y')
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="start">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDateFrom(subDays(new Date(), 7))
                              setDateTo(new Date())
                            }}
                          >
                            Last 7 days
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDateFrom(subDays(new Date(), 30))
                              setDateTo(new Date())
                            }}
                          >
                            Last 30 days
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDateFrom(subDays(new Date(), 90))
                              setDateTo(new Date())
                            }}
                          >
                            Last 90 days
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const today = new Date()
                              setDateFrom(new Date(today.getFullYear(), today.getMonth(), 1))
                              setDateTo(new Date(today.getFullYear(), today.getMonth() + 1, 0))
                            }}
                          >
                            This month
                          </Button>
                        </div>
                        <Calendar
                          mode="range"
                          selected={{
                            from: dateFrom,
                            to: dateTo,
                          }}
                          onSelect={(range) => {
                            setDateFrom(range?.from)
                            setDateTo(range?.to)
                          }}
                          numberOfMonths={2}
                        />
                        {(dateFrom || dateTo) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDateFrom(undefined)
                              setDateTo(undefined)
                            }}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Clear date range
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-end">
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDateFrom(undefined)
                        setDateTo(undefined)
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && orders.length === 0 ? (
            <div className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto -mx-4 px-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">Order</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[220px]">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Items</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Total</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Payment</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[140px]">Date</TableHead>
                      <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 whitespace-nowrap">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">ID: {order.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[220px]">
                          <p className="font-medium text-sm text-gray-900">{order.customerName}</p>
                          <p className="text-xs text-gray-500 break-all">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-900 whitespace-nowrap">{order.orderItems?.length || 0} items</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(order.total)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={order.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}
                          className={
                            order.paymentStatus === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 whitespace-nowrap">{formatDate(order.createdAt)}</p>
                          <p className="text-xs text-gray-500 whitespace-nowrap">{formatTime(order.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
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
                            <DropdownMenuItem onClick={() => openDetailsModal(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusModal(order)}>
                              <Package className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`/api/admin/orders/${order.id}/invoice`, '_blank')}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {isFetchingNextPage && (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8}>
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                          <span className="ml-2 text-sm text-gray-500">Loading more orders...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div ref={sentinelRef} className="h-4" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden sm:rounded-lg" aria-describedby="order-details-description">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Order Details</DialogTitle>
                <DialogDescription id="order-details-description">Order {selectedOrder?.orderNumber}</DialogDescription>
              </div>
              {selectedOrder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/admin/orders/${selectedOrder.id}/invoice`, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
              )}
            </div>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order Number</p>
                  <p className="font-medium">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>

              {/* Tracking Information */}
              {(selectedOrder.trackingNumber || selectedOrder.trackingStatus || selectedOrder.estimatedDeliveryDate) && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 text-gray-900">Tracking Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    {selectedOrder.trackingNumber && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                        <p className="font-mono font-medium">{selectedOrder.trackingNumber}</p>
                      </div>
                    )}
                    {selectedOrder.trackingStatus && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tracking Status</p>
                        <p className="font-medium">{selectedOrder.trackingStatus.replace('_', ' ').toLowerCase()}</p>
                      </div>
                    )}
                    {selectedOrder.estimatedDeliveryDate && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estimated Delivery</p>
                        <p className="font-medium">{formatDate(selectedOrder.estimatedDeliveryDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {(selectedOrder.orderItems || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span>{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden sm:rounded-lg" aria-describedby="update-status-description">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription id="update-status-description">Change the status and tracking for order {updatingOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {['SHIPPED', 'DELIVERED'].includes(newStatus) && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tracking Number</label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number (e.g., PK-XXXXXXXX)"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tracking Status</label>
                  <Select value={trackingStatus} onValueChange={setTrackingStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                      <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estimated Delivery Date</label>
                  <Input
                    type="date"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateStatus} className="flex-1">
                Update Order
              </Button>
              <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
