'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  MapPin,
  Loader2
} from 'lucide-react'

const COLORS = ['#8b5cf6', '#6366f1', '#a855f7', '#d946ef', '#ec4899', '#f43f5e']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)
  const [period, setPeriod] = useState('30')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      const result = await response.json()

      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleExport = (format: 'json' | 'csv') => {
    if (!analytics) return

    if (format === 'csv') {
      // CSV Export
      const rows = [
        ['Date', 'Revenue', 'Orders', 'Category', 'Product', 'Quantity', 'Total']
      ]

      analytics.salesChartData.forEach((item: any) => {
        rows.push([
          item.date,
          item.revenue,
          item.orders,
          '',
          '',
          '',
          item.revenue
        ])
      })

      analytics.categorySales.forEach((cat: any) => {
        rows.push(['', cat.value, '', cat.name, '', '', cat.value])
      })

      analytics.topProducts.forEach((prod: any, idx: number) => {
        rows.push(['', prod.revenue, prod.count, prod.category, prod.name, prod.count, prod.revenue])
      })

      const csvContent = rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Analytics exported to CSV',
      })
      return
    }

    // JSON Export (existing)
    const data = {
      salesChartData: analytics.salesChartData,
      categorySales: analytics.categorySales,
      topProducts: analytics.topProducts,
      geographicData: analytics.geographicData,
      customerMetrics: analytics.customerMetrics,
      trends: analytics.trends,
    }

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('json')} disabled={!analytics}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={!analytics}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} disabled={!analytics}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Total Revenue
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics?.totalRevenue || 0)}</div>
            <div className="flex items-center gap-1 mt-2">
              {analytics?.trends?.revenueGrowth >= 0 ? (
                <><ArrowUpRight className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-green-600">+{analytics?.trends?.revenueGrowth.toFixed(1)}%</span></>
              ) : (
                <><ArrowDownRight className="h-4 w-4 text-red-500" /><span className="text-sm font-medium text-red-600">{analytics?.trends?.revenueGrowth.toFixed(1)}%</span></>
              )}
              <span className="text-xs text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Total Orders
              <ShoppingCart className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics?.totalOrders || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              {analytics?.trends?.ordersGrowth >= 0 ? (
                <><ArrowUpRight className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-green-600">+{analytics?.trends?.ordersGrowth.toFixed(1)}%</span></>
              ) : (
                <><ArrowDownRight className="h-4 w-4 text-red-500" /><span className="text-sm font-medium text-red-600">{analytics?.trends?.ordersGrowth.toFixed(1)}%</span></>
              )}
              <span className="text-xs text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              Avg. Order Value
              <Package className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(analytics?.avgOrderValue || 0)}</div>
            <div className="text-xs text-gray-500 mt-2">
              Per order average
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
              New Customers
              <Users className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics?.customerMetrics?.new || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              {analytics?.customerMetrics?.newGrowth >= 0 ? (
                <><ArrowUpRight className="h-4 w-4 text-green-500" /><span className="text-sm font-medium text-green-600">+{analytics?.customerMetrics?.newGrowth.toFixed(1)}%</span></>
              ) : (
                <><ArrowDownRight className="h-4 w-4 text-red-500" /><span className="text-sm font-medium text-red-600">{analytics?.customerMetrics?.newGrowth.toFixed(1)}%</span></>
              )}
              <span className="text-xs text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Revenue & Orders Over Time</CardTitle>
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
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-500">
                No sales data available for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Products & Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.topProducts && analytics.topProducts.length > 0 ? (
                analytics.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                      <p className="text-xs text-green-600">{product.count} sold</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {analytics?.categorySales && analytics.categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categorySales}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.categorySales.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  No category data available
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {analytics?.categorySales && analytics.categorySales.length > 0 && (
                analytics.categorySales.map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status & Geographic Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Status Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {analytics?.statusChartData && analytics.statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  No order status data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution (Bangladesh Divisions) */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.geographicData && analytics.geographicData.length > 0 ? (
                analytics.geographicData.map((item: any, index: number) => {
                  const maxValue = Math.max(...analytics.geographicData.map((d: any) => d.value))
                  const percentage = (item.value / maxValue) * 100

                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <Badge variant="outline" className="bg-violet-50 text-violet-700">
                          {item.value} orders
                        </Badge>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No geographic data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Metrics */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Customer Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{analytics?.customerMetrics?.total || 0}</div>
              <p className="text-sm text-gray-600 mt-2">Total Customers</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-violet-600">{analytics?.customerMetrics?.new || 0}</div>
              <p className="text-sm text-gray-600 mt-2">New Customers</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{analytics?.customerMetrics?.returningRate.toFixed(1)}%</div>
              <p className="text-sm text-gray-600 mt-2">Returning Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
