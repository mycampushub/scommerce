'use client';

import { useState, useEffect } from 'react';
import { Search, Download, BarChart3, TrendingUp, Package, DollarSign, ArrowUpDown, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Types
interface ValuationItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  country?: string;
  size?: string;
  stock: number;
  price: number;
  cost: number;
  value: number;
  margin: number;
  marginPercent: number;
}

interface MovementSummary {
  type: string;
  count: number;
  totalIn: number;
  totalOut: number;
  totalCost: number;
}

interface PurchaseSummary {
  supplier: string;
  poCount: number;
  totalAmount: number;
  totalQuantity: number;
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  status: 'out_of_stock' | 'low_stock' | 'healthy' | 'overstock';
}

interface CostItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  cost: number;
  totalCost: number;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
  margin: number;
}

export default function InventoryReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('valuation');

  // Valuation Report
  const [valuationData, setValuationData] = useState<ValuationItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [averageMargin, setAverageMargin] = useState(0);

  // Movement Report
  const [movementData, setMovementData] = useState<MovementSummary[]>([]);
  const [totalMovements, setTotalMovements] = useState(0);

  // Purchase Report
  const [purchaseData, setPurchaseData] = useState<PurchaseSummary[]>([]);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [totalPurchaseQuantity, setTotalPurchaseQuantity] = useState(0);

  // Stock Report
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [healthyStockCount, setHealthyStockCount] = useState(0);
  const [overstockCount, setOverstockCount] = useState(0);

  // Cost Analysis Report
  const [costData, setCostData] = useState<CostItem[]>([]);
  const [costTotalStock, setCostTotalStock] = useState(0);
  const [costTotalCost, setCostTotalCost] = useState(0);
  const [costTotalRevenue, setCostTotalRevenue] = useState(0);
  const [costTotalProfit, setCostTotalProfit] = useState(0);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');

  // Fetch valuation report
  const fetchValuationReport = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (brandFilter !== 'all') params.append('brand', brandFilter);

      const response = await fetch(`/api/admin/inventory/reports/valuation?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch valuation report');
      const data = await response.json();

      setValuationData(data.data?.items || []);
      setTotalValue(data.data?.summary?.totalValue || 0);
      setTotalCost(data.data?.summary?.totalCost || 0);
      setTotalProfit(data.data?.summary?.totalProfit || 0);
      setAverageMargin(data.data?.summary?.averageMargin || 0);
    } catch (error) {
      console.error('Error fetching valuation report:', error);
      toast.error('Failed to load valuation report');
    }
  };

  // Fetch movement report
  const fetchMovementReport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange) params.append('days', dateRange);

      const response = await fetch(`/api/admin/inventory/reports/movement?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch movement report');
      const data = await response.json();

      setMovementData(data.data?.movements || []);
      setTotalMovements(data.data?.summary?.total || 0);
    } catch (error) {
      console.error('Error fetching movement report:', error);
      toast.error('Failed to load movement report');
    }
  };

  // Fetch purchase report
  const fetchPurchaseReport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange) params.append('days', dateRange);

      const response = await fetch(`/api/admin/inventory/reports/purchase?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch purchase report');
      const data = await response.json();

      setPurchaseData(data.data?.suppliers || []);
      setTotalPurchaseAmount(data.data?.summary?.totalAmount || 0);
      setTotalPurchaseQuantity(data.data?.summary?.totalQuantity || 0);
    } catch (error) {
      console.error('Error fetching purchase report:', error);
      toast.error('Failed to load purchase report');
    }
  };

  // Fetch stock report
  const fetchStockReport = async () => {
    try {
      const response = await fetch('/api/admin/inventory/reports/stock', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch stock report');
      const data = await response.json();

      setStockData(data.data?.items || []);
      setOutOfStockCount(data.data?.summary?.outOfStock || 0);
      setLowStockCount(data.data?.summary?.lowStock || 0);
      setHealthyStockCount(data.data?.summary?.healthy || 0);
      setOverstockCount(data.data?.summary?.overstock || 0);
    } catch (error) {
      console.error('Error fetching stock report:', error);
      toast.error('Failed to load stock report');
    }
  };

  // Fetch cost analysis report
  const fetchCostAnalysisReport = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/admin/inventory/reports/cost-analysis?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cost analysis report');
      const data = await response.json();

      setCostData(data.data?.items || []);
      setCostTotalStock(data.data?.summary?.totalStock || 0);
      setCostTotalCost(data.data?.summary?.totalCost || 0);
      setCostTotalRevenue(data.data?.summary?.totalRevenue || 0);
      setCostTotalProfit(data.data?.summary?.totalProfit || 0);
    } catch (error) {
      console.error('Error fetching cost analysis report:', error);
      toast.error('Failed to load cost analysis report');
    }
  };

  // Load all reports
  const loadReports = async () => {
    setLoading(true);
    await Promise.all([
      fetchValuationReport(),
      fetchMovementReport(),
      fetchPurchaseReport(),
      fetchStockReport(),
      fetchCostAnalysisReport(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [categoryFilter, brandFilter, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStockStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      out_of_stock: { label: 'Out of Stock', variant: 'destructive' },
      low_stock: { label: 'Low Stock', variant: 'secondary' },
      healthy: { label: 'Healthy', variant: 'default' },
      overstock: { label: 'Overstock', variant: 'outline' },
    };
    return badges[status] || { label: status, variant: 'secondary' };
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PURCHASE: 'Purchase',
      SALE: 'Sale',
      RETURN: 'Return',
      ADJUSTMENT: 'Adjustment',
      TRANSFER: 'Transfer',
      DAMAGE: 'Damage',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Reports</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive inventory analysis and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReports}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {/* Categories would be loaded from API */}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="brand">Brand</Label>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {/* Brands would be loaded from API */}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="movement">Movement</TabsTrigger>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="stock">Stock Status</TabsTrigger>
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* Valuation Report */}
        <TabsContent value="valuation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageMargin ? averageMargin.toFixed(2) : 0}%</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Valuation Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : valuationData.length === 0 ? (
                <div className="text-center py-12">No data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Product</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-left p-4 font-medium">Stock</th>
                        <th className="text-right p-4 font-medium">Price</th>
                        <th className="text-right p-4 font-medium">Cost</th>
                        <th className="text-right p-4 font-medium">Value</th>
                        <th className="text-right p-4 font-medium">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valuationData.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="font-medium">{item.name}</div>
                            {item.brand && (
                              <div className="text-sm text-muted-foreground">{item.brand}</div>
                            )}
                          </td>
                          <td className="p-4">{item.category}</td>
                          <td className="p-4">{item.stock}</td>
                          <td className="p-4 text-right">{formatCurrency(item.price)}</td>
                          <td className="p-4 text-right">{formatCurrency(item.cost)}</td>
                          <td className="p-4 text-right">{formatCurrency(item.value)}</td>
                          <td className="p-4 text-right">
                            <Badge variant={item.marginPercent >= 20 ? 'default' : 'secondary'}>
                              {item.marginPercent ? item.marginPercent.toFixed(1) : 0}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movement Report */}
        <TabsContent value="movement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movement Summary</CardTitle>
              <CardDescription>Total movements: {totalMovements}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : movementData.length === 0 ? (
                <div className="text-center py-12">No movement data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Movement Type</th>
                        <th className="text-center p-4 font-medium">Count</th>
                        <th className="text-center p-4 font-medium">Total In</th>
                        <th className="text-center p-4 font-medium">Total Out</th>
                        <th className="text-right p-4 font-medium">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movementData.map((movement) => (
                        <tr key={movement.type} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <Badge variant="outline">{getMovementTypeLabel(movement.type)}</Badge>
                          </td>
                          <td className="p-4 text-center">{movement.count}</td>
                          <td className="p-4 text-center text-green-600">{movement.totalIn}</td>
                          <td className="p-4 text-center text-red-600">{movement.totalOut}</td>
                          <td className="p-4 text-right">{formatCurrency(movement.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Report */}
        <TabsContent value="purchase" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Purchase Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalPurchaseAmount)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Purchase Quantity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPurchaseQuantity}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Purchase by Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : purchaseData.length === 0 ? (
                <div className="text-center py-12">No purchase data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Supplier</th>
                        <th className="text-center p-4 font-medium">PO Count</th>
                        <th className="text-center p-4 font-medium">Total Quantity</th>
                        <th className="text-right p-4 font-medium">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseData.map((purchase) => (
                        <tr key={purchase.supplier} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{purchase.supplier}</td>
                          <td className="p-4 text-center">{purchase.poCount}</td>
                          <td className="p-4 text-center">{purchase.totalQuantity}</td>
                          <td className="p-4 text-right">{formatCurrency(purchase.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Status Report */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">Healthy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{healthyStockCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-600">Overstock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{overstockCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Status Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : stockData.length === 0 ? (
                <div className="text-center py-12">No stock data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Product</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-center p-4 font-medium">Stock</th>
                        <th className="text-center p-4 font-medium">Reorder Level</th>
                        <th className="text-center p-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.map((item) => {
                        const statusBadge = getStockStatusBadge(item.status);
                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 font-medium">{item.name}</td>
                            <td className="p-4">{item.category}</td>
                            <td className="p-4 text-center">{item.stock}</td>
                            <td className="p-4 text-center">{item.reorderLevel}</td>
                            <td className="p-4 text-center">
                              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Report */}
        <TabsContent value="cost" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{costTotalStock}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costTotalCost)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(costTotalRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(costTotalProfit)}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : costData.length === 0 ? (
                <div className="text-center py-12">No cost data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Product</th>
                        <th className="text-left p-4 font-medium">Category</th>
                        <th className="text-center p-4 font-medium">Stock</th>
                        <th className="text-center p-4 font-medium">Sold</th>
                        <th className="text-right p-4 font-medium">Cost</th>
                        <th className="text-right p-4 font-medium">Revenue</th>
                        <th className="text-right p-4 font-medium">Profit</th>
                        <th className="text-right p-4 font-medium">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costData.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4">{item.category}</td>
                          <td className="p-4 text-center">{item.stock}</td>
                          <td className="p-4 text-center">{item.totalSold}</td>
                          <td className="p-4 text-right">{formatCurrency(item.totalCost)}</td>
                          <td className="p-4 text-right">{formatCurrency(item.totalRevenue)}</td>
                          <td className="p-4 text-right">
                            <span className={item.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(item.totalProfit)}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Badge variant={item.margin >= 20 ? 'default' : 'secondary'}>
                              {item.margin ? item.margin.toFixed(1) : 0}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
