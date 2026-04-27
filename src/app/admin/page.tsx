'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/format-currency'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Loader2,
  Download,
  Calendar,
  RefreshCw,
  Layout
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const STATUS_COLORS = ['#8b5cf6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#14b8a6', '#22c55e']

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [period, setPeriod] = useState('30')

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats')
      }

      setStats(result.data)
      setRecentOrders(result.data.recentOrders || [])
      setTopProducts(result.data.topProducts || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [period])

  const handleExport = async (type: 'sales' | 'orders' | 'products') => {
    let data: any[] = []
    let filename = ''

    if (type === 'sales' && analytics) {
      data = analytics.salesChartData || []
      filename = `sales-export-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'orders' && stats) {
      data = recentOrders || []
      filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'products' && stats) {
      data = topProducts || []
      filename = `products-export-${new Date().toISOString().split('T')[0]}.csv`
    }

    if (data.length > 0) {
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return d.toLocaleDateString()
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary'
      case 'CONFIRMED':
        return 'default'
      case 'PROCESSING':
        return 'default'
      case 'SHIPPED':
        return 'outline'
      case 'DELIVERED':
        return 'outline'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-violet-100 text-violet-700'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-700'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-700'
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-700'
      case 'DELIVERED':
        return 'bg-green-100 text-green-700'
      case 'CANCELLED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Error loading dashboard</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/90 flex items-center justify-between">
              Total Revenue
              <DollarSign className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(stats?.orders?.revenue || 0)}</div>
            <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+20.1%</span>
              <span className="text-white/60 ml-1">vs last month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="overflow-hidden border-0 shadow-lg bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Total Orders
              <ShoppingCart className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.orders?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-gray-400 ml-1">vs last month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="overflow-hidden border-0 shadow-lg bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Total Products
              <Package className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.products?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">+8.2%</span>
              <span className="text-gray-400 ml-1">new this month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="overflow-hidden border-0 shadow-lg bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Total Customers
              <Users className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.customers?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">+15.3%</span>
              <span className="text-gray-400 ml-1">vs last month</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="col-span-2 border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Sales Overview</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport('sales')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {analytics?.salesChartData && analytics.salesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Revenue']
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No sales data available</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {analytics?.statusChartData && analytics.statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  No order status data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Recent Orders</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleExport('orders')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No orders yet</p>
                </div>
              ) : (
                recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/orders#${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900">#{order.orderNumber}</p>
                        <Badge variant={getStatusVariant(order.status)} className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.orderItems?.length || 0} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Top Selling Products</CardTitle>
            <Button variant="outline" size="sm" onClick={() => handleExport('products')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No products yet</p>
                </div>
              ) : (
                topProducts.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-violet-600">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {product.sales || 0} sales
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              className="h-auto flex-col gap-2 py-4 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              onClick={() => router.push('/admin/products')}
            >
              <Package className="h-5 w-5" />
              Add Product
            </Button>
            <Button
              className="h-auto flex-col gap-2 py-4 bg-gradient-to-br from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
              onClick={() => router.push('/admin/homepage')}
            >
              <Layout className="h-5 w-5" />
              Manage Homepage
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-2"
              onClick={() => router.push('/admin/customers')}
            >
              <Users className="h-5 w-5" />
              Customers
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-2"
              onClick={() => router.push('/admin/orders')}
            >
              <ShoppingCart className="h-5 w-5" />
              Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
