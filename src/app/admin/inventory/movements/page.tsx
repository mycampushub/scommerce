'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
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
  ArrowDown,
  ArrowUp,
  Package,
  Truck,
  ShoppingCart,
  RotateCcw,
  GitCompare,
  AlertTriangle,
  Loader2,
  TrendingUp,
} from 'lucide-react'

interface InventoryMovement {
  id: string
  productId: string
  productName: string
  variantId: string | null
  variantName: string | null
  type: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'TRANSFER' | 'DAMAGE'
  quantity: number
  costPerUnit: number | null
  totalCost: number | null
  referenceId: string | null
  referenceType: string | null
  notes: string | null
  createdAt: string
  supplierName?: string | null
}

export default function InventoryMovementsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30') // days

  const fetchMovements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      
      const response = await fetch(`/api/admin/inventory/movements?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        let data = result.data || []
        
        // Filter by date range
        if (dateRange !== 'all') {
          const days = parseInt(dateRange)
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - days)
          data = data.filter((m: InventoryMovement) => new Date(m.createdAt) >= cutoffDate)
        }
        
        setMovements(data)
      }
    } catch (err: any) {
      console.error('Error fetching movements:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory movements',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovements()
  }, [typeFilter, dateRange])

  const getTypeConfig = (type: string) => {
    const configs = {
      PURCHASE: { label: 'Purchase', color: 'bg-green-100 text-green-700', icon: Truck, direction: 'in' },
      SALE: { label: 'Sale', color: 'bg-blue-100 text-blue-700', icon: ShoppingCart, direction: 'out' },
      RETURN: { label: 'Return', color: 'bg-purple-100 text-purple-700', icon: RotateCcw, direction: 'in' },
      ADJUSTMENT: { label: 'Adjustment', color: 'bg-orange-100 text-orange-700', icon: GitCompare, direction: 'adjust' },
      TRANSFER: { label: 'Transfer', color: 'bg-cyan-100 text-cyan-700', icon: TrendingUp, direction: 'transfer' },
      DAMAGE: { label: 'Damage', color: 'bg-red-100 text-red-700', icon: AlertTriangle, direction: 'out' },
    }
    return configs[type as keyof typeof configs] || configs.ADJUSTMENT
  }

  const filteredMovements = movements.filter(movement => {
    const matchesSearch =
      movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.variantName && movement.variantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (movement.supplierName && movement.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (movement.referenceId && movement.referenceId.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  // Calculate summary
  const summary = movements.reduce((acc, m) => {
    const config = getTypeConfig(m.type)
    if (config.direction === 'in') {
      acc.in += Math.abs(m.quantity)
      acc.inCost += (m.totalCost || 0)
    } else if (config.direction === 'out') {
      acc.out += Math.abs(m.quantity)
      acc.outCost += (m.totalCost || 0)
    }
    return acc
  }, { in: 0, out: 0, inCost: 0, outCost: 0 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Movements</h1>
          <p className="text-sm text-gray-500 mt-1">Track all inventory changes and history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Movements</p>
                <p className="text-2xl font-bold mt-1">{movements.length}</p>
              </div>
              <Package className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Stock In</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{summary.in}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Stock Out</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.out}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowUp className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Net Change</p>
                <p className={`text-2xl font-bold mt-1 ${summary.in - summary.out >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(summary.in - summary.out) >= 0 ? '+' : ''}{summary.in - summary.out}
                </p>
              </div>
              <div className={`h-8 w-8 rounded-full ${summary.in - summary.out >= 0 ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                <TrendingUp className={`h-4 w-4 ${summary.in - summary.out >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search movements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="SALE">Sale</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="DAMAGE">Damage</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No inventory movements found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Date</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Product</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Variant</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Quantity</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Cost/Unit</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Total Cost</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Reference</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => {
                    const typeConfig = getTypeConfig(movement.type)
                    const TypeIcon = typeConfig.icon
                    return (
                      <TableRow key={movement.id} className="hover:bg-gray-50">
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(movement.createdAt).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeConfig.color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-gray-900">{movement.productName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{movement.variantName || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {movement.costPerUnit ? `৳${movement.costPerUnit.toFixed(2)}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {movement.totalCost ? `৳${movement.totalCost.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-600">
                            {movement.referenceId ? `${movement.referenceType || 'Ref'}: ${movement.referenceId}` : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{movement.supplierName || '-'}</span>
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
