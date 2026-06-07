'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Search, Filter, ArrowUpDown, FileText, AlertTriangle, CheckCircle, XCircle, Package, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Types
interface Product {
  id: string;
  name: string;
  slug: string;
  stock: number;
  sizeType?: 'unit' | 'label';
  sizeValue?: number;
  sizeUnit?: string;
  sizeLabel?: string;
  brandName?: string;
  countryOfOrigin?: string;
  category?: {
    id: string;
    name: string;
  };
}

interface Variant {
  id: string;
  name: string;
  stock: number;
  productId: string;
  product: Product;
}

interface Adjustment {
  id: string;
  productId: string;
  variantId: string | null;
  product: Product;
  variant?: Variant;
  adjustmentType: 'STOCK_TAKE' | 'DAMAGE' | 'LOSS' | 'THEFT' | 'CORRECTION';
  quantityBefore: number;
  quantityAfter: number;
  quantityDiff: number;
  reason: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  createdBy?: string;
}

const ADJUSTMENT_TYPES = {
  STOCK_TAKE: { label: 'Stock Take', icon: FileText, color: 'bg-blue-500', variant: 'default' as const },
  DAMAGE: { label: 'Damage', icon: AlertTriangle, color: 'bg-red-500', variant: 'destructive' as const },
  LOSS: { label: 'Loss', icon: XCircle, color: 'bg-orange-500', variant: 'secondary' as const },
  THEFT: { label: 'Theft', icon: AlertTriangle, color: 'bg-purple-500', variant: 'outline' as const },
  CORRECTION: { label: 'Correction', icon: CheckCircle, color: 'bg-green-500', variant: 'default' as const },
} as const;

// Safe type config getter with validation
const getAdjustmentTypeConfig = (type: string) => {
  const validTypes = Object.keys(ADJUSTMENT_TYPES) as readonly (keyof typeof ADJUSTMENT_TYPES)[];
  if (!type || !validTypes.includes(type as keyof typeof ADJUSTMENT_TYPES)) {
    console.warn(`[Stock Adjustments] Invalid adjustment type: "${type}". Falling back to CORRECTION.`);
    return ADJUSTMENT_TYPES.CORRECTION;
  }
  const config = ADJUSTMENT_TYPES[type as keyof typeof ADJUSTMENT_TYPES];
  if (!config || !config.icon) {
    console.error(`[Stock Adjustments] Missing icon config for type: "${type}", config:`, config);
    return ADJUSTMENT_TYPES.CORRECTION;
  }
  return config;
};

const STATUS_BADGES = {
  pending: { label: 'Pending', variant: 'secondary' as const, color: 'bg-yellow-500' },
  approved: { label: 'Approved', variant: 'default' as const, color: 'bg-green-500' },
  rejected: { label: 'Rejected', variant: 'destructive' as const, color: 'bg-red-500' },
};

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'createdAt' | 'quantityDiff'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<Adjustment | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productId: '',
    variantId: 'none',
    adjustmentType: 'STOCK_TAKE' as const,
    quantityAfter: 0,
    reason: '',
  });
  const [currentStock, setCurrentStock] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch adjustments
  const fetchAdjustments = async () => {
    try {
      console.log('[Stock Adjustments] Fetching adjustments with filters:', { searchTerm, typeFilter, statusFilter });
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter === 'pending') params.append('approved', 'false');
      if (statusFilter === 'approved') params.append('approved', 'true');

      const response = await fetch(`/api/admin/inventory/adjustments?${params.toString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Stock Adjustments] Fetch failed:', response.status, errorText);
        throw new Error('Failed to fetch adjustments');
      }
      
      const data = await response.json();
      console.log('[Stock Adjustments] Fetched data:', data);
      
      // Validate adjustment data structure
      if (!data.success) {
        console.error('[Stock Adjustments] API returned error:', data.error);
        toast.error(data.error || 'Failed to load stock adjustments');
        return;
      }
      
      const adjustments = Array.isArray(data.data) ? data.data : [];
      console.log('[Stock Adjustments] Validated adjustments count:', adjustments.length);
      
      // Log any adjustments with invalid types for debugging
      const validTypes = Object.keys(ADJUSTMENT_TYPES);
      const invalidAdjustments = adjustments.filter((adj: Adjustment) => !adj.adjustmentType || !validTypes.includes(adj.adjustmentType));
      if (invalidAdjustments.length > 0) {
        console.warn('[Stock Adjustments] Found adjustments with invalid types:', invalidAdjustments);
      }
      
      setAdjustments(adjustments);
    } catch (error) {
      console.error('[Stock Adjustments] Error fetching adjustments:', error);
      toast.error('Failed to load stock adjustments');
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  // Fetch variants for selected product
  const fetchVariants = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants`);
      if (!response.ok) throw new Error('Failed to fetch variants');
      const data = await response.json();
      setVariants(data.variants || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
    }
  };

  // Format size
  const formatSize = (product: Product | Variant) => {
    const sizeType = (product as any).sizeType;
    if (!sizeType) return '-';

    if (sizeType === 'label') {
      return (product as any).sizeLabel || '-';
    } else {
      const value = (product as any).sizeValue;
      const unit = (product as any).sizeUnit;
      return value && unit ? `${value} ${unit}` : '-';
    }
  };

  // Get country flag
  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode) return '';
    const flags: Record<string, string> = {
      BD: '🇧🇩',
      US: '🇺🇸',
      GB: '🇬🇧',
      CN: '🇨🇳',
      IN: '🇮🇳',
      PK: '🇵🇰',
      JP: '🇯🇵',
      KR: '🇰🇷',
      TH: '🇹🇭',
      VN: '🇻🇳',
      MY: '🇲🇾',
      SG: '🇸🇬',
      AE: '🇦🇪',
      SA: '🇸🇦',
      DE: '🇩🇪',
      FR: '🇫🇷',
      IT: '🇮🇹',
      TR: '🇹🇷',
    };
    return flags[countryCode] || '';
  };

  // Handle product selection
  const handleProductChange = (productId: string) => {
    setFormData({ ...formData, productId, variantId: 'none' });
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setCurrentStock(product.stock);
      }
      fetchVariants(productId);
    } else {
      setVariants([]);
      setCurrentStock(0);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate product
    if (!formData.productId) {
      newErrors.productId = 'Please select a product';
    }

    // Validate adjustment type
    if (!formData.adjustmentType) {
      newErrors.adjustmentType = 'Please select an adjustment type';
    }

    // Validate quantity
    if (formData.quantityAfter < 0) {
      newErrors.quantityAfter = 'Quantity must be a positive number';
    }

    // Validate reason
    if (!formData.reason || formData.reason.trim().length === 0) {
      newErrors.reason = 'Please provide a reason for this adjustment';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[Stock Adjustments] Creating adjustment with data:', {
        ...formData,
        quantityBefore: currentStock,
      });
      
      const payload = {
        productId: formData.productId,
        ...(formData.variantId && formData.variantId !== 'none' ? { variantId: formData.variantId } : {}),
        adjustmentType: formData.adjustmentType,
        quantityBefore: currentStock,
        quantityAfter: parseInt(formData.quantityAfter.toString()),
        reason: formData.reason,
      };

      const response = await fetch('/api/admin/inventory/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Stock Adjustments] Create failed:', response.status, errorText);
        try {
          const error = await response.json();
          throw new Error(error.message || error.error || 'Failed to create adjustment');
        } catch {
          throw new Error('Failed to create adjustment');
        }
      }

      const result = await response.json();
      console.log('[Stock Adjustments] Created successfully:', result);
      
      toast.success('Stock adjustment created successfully');
      setIsAddModalOpen(false);
      resetForm();
      fetchAdjustments();
    } catch (error: any) {
      console.error('[Stock Adjustments] Create error:', error);
      toast.error(error.message || 'Failed to create stock adjustment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle approve adjustment
  const handleApprove = async (adjustmentId: string) => {
    try {
      console.log('[Stock Adjustments] Approving adjustment:', adjustmentId);
      
      const response = await fetch(`/api/admin/inventory/adjustments/${adjustmentId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Stock Adjustments] Approve failed:', response.status, errorText);
        try {
          const error = await response.json();
          throw new Error(error.message || error.error || 'Failed to approve adjustment');
        } catch {
          throw new Error('Failed to approve adjustment');
        }
      }

      toast.success('Stock adjustment approved successfully');
      fetchAdjustments();
    } catch (error: any) {
      console.error('[Stock Adjustments] Approve error:', error);
      toast.error(error.message || 'Failed to approve stock adjustment');
    }
  };

  // Handle delete adjustment
  const handleDelete = async (adjustmentId: string) => {
    if (!confirm('Are you sure you want to delete this adjustment?')) return;

    try {
      console.log('[Stock Adjustments] Deleting adjustment:', adjustmentId);
      
      const response = await fetch(`/api/admin/inventory/adjustments/${adjustmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Stock Adjustments] Delete failed:', response.status, errorText);
        try {
          const error = await response.json();
          throw new Error(error.message || error.error || 'Failed to delete adjustment');
        } catch {
          throw new Error('Failed to delete adjustment');
        }
      }

      toast.success('Stock adjustment deleted successfully');
      fetchAdjustments();
    } catch (error: any) {
      console.error('[Stock Adjustments] Delete error:', error);
      toast.error(error.message || 'Failed to delete stock adjustment');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      productId: '',
      variantId: 'none',
      adjustmentType: 'STOCK_TAKE',
      quantityAfter: 0,
      reason: '',
    });
    setVariants([]);
    setCurrentStock(0);
    setErrors({});
  };

  // Filter and sort adjustments
  const filteredAdjustments = adjustments
    .filter(adjustment => {
      if (typeFilter !== 'all' && adjustment.adjustmentType !== typeFilter) return false;
      if (statusFilter === 'pending' && adjustment.approved) return false;
      if (statusFilter === 'approved' && !adjustment.approved) return false;
      if (searchTerm && !adjustment.product.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

  // Calculate stats
  const stats = {
    total: adjustments.length,
    pending: adjustments.filter(a => !a.approved).length,
    approved: adjustments.filter(a => a.approved).length,
    today: adjustments.filter(a =>
      new Date(a.createdAt).toDateString() === new Date().toDateString()
    ).length,
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAdjustments(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchAdjustments();
  }, [searchTerm, typeFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Adjustments</h1>
          <p className="text-muted-foreground mt-1">
            Manage inventory stock adjustments and corrections
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Adjustment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(ADJUSTMENT_TYPES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustments History</CardTitle>
          <CardDescription>
            All stock adjustments and their approval status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAdjustments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No adjustments found</h3>
              <p className="text-muted-foreground">
                Create your first stock adjustment to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSortField('createdAt');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </th>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Type</th>
                    <th className="text-center p-4 font-medium">Stock Change</th>
                    <th className="text-center p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Reason</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdjustments.map((adjustment, index) => {
                    // Safely get type config with validation
                    const typeConfig = getAdjustmentTypeConfig(adjustment.adjustmentType);
                    const statusKey = adjustment.approved ? 'approved' : 'pending';
                    const statusConfig = STATUS_BADGES[statusKey] || STATUS_BADGES.pending;

                    // Safe icon access with detailed error logging
                    let TypeIcon = CheckCircle;
                    try {
                      if (typeConfig && typeConfig.icon && typeof typeConfig.icon === 'function') {
                        TypeIcon = typeConfig.icon;
                      } else {
                        console.error(`[Stock Adjustments] Row ${index}: Invalid icon for type "${adjustment.adjustmentType}":`, typeConfig);
                      }
                    } catch (error) {
                      console.error(`[Stock Adjustments] Row ${index}: Error accessing icon:`, error);
                    }

                    return (
                      <tr key={adjustment.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(adjustment.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(adjustment.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{adjustment.product.name}</div>
                          {adjustment.variant && (
                            <div className="text-sm text-muted-foreground">
                              {adjustment.variant.name}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {adjustment.product.brandName && (
                              <span className="mr-2">{adjustment.product.brandName}</span>
                            )}
                            {formatSize(adjustment.product) !== '-' && (
                              <span>{formatSize(adjustment.product)}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={typeConfig?.variant || 'default'} className="flex items-center gap-2 w-fit">
                            <TypeIcon className="h-3 w-3" />
                            {typeConfig?.label || 'Adjustment'}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm">{adjustment.quantityBefore}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{adjustment.quantityAfter}</span>
                            <Badge
                              variant={adjustment.quantityDiff > 0 ? 'default' : 'destructive'}
                              className="ml-2"
                            >
                              {adjustment.quantityDiff > 0 ? '+' : ''}
                              {adjustment.quantityDiff}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                          {adjustment.approved && adjustment.approvedAt && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(adjustment.approvedAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm max-w-xs truncate">
                            {adjustment.reason || '-'}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {!adjustment.approved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(adjustment.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedAdjustment(adjustment);
                                setIsViewModalOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(adjustment.id)}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      {/* Add Adjustment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Stock Adjustment</DialogTitle>
            <DialogDescription id="add-adjustment-description">
              Adjust stock quantity for a product or variant
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={handleProductChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - Stock: {product.stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productId && (
                  <p className="text-xs text-destructive">{errors.productId}</p>
                )}
              </div>

              {variants.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant (Optional)</Label>
                  <Select
                    value={formData.variantId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, variantId: value });
                      if (value) {
                        const variant = variants.find(v => v.id === value);
                        if (variant) {
                          setCurrentStock(variant.stock);
                        }
                      } else {
                        const product = products.find(p => p.id === formData.productId);
                        if (product) {
                          setCurrentStock(product.stock);
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No variant</SelectItem>
                      {variants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.name} - Stock: {variant.stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="type">Adjustment Type *</Label>
                <Select
                  value={formData.adjustmentType}
                  onValueChange={(value: any) => setFormData({ ...formData, adjustmentType: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ADJUSTMENT_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <value.icon className="h-4 w-4" />
                          {value.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.adjustmentType && (
                  <p className="text-xs text-destructive">{errors.adjustmentType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantityAfter">New Quantity *</Label>
                <Input
                  id="quantityAfter"
                  type="number"
                  min="0"
                  value={formData.quantityAfter}
                  onChange={(e) => setFormData({ ...formData, quantityAfter: parseInt(e.target.value) || 0 })}
                  required
                  placeholder="Enter new quantity"
                  className={errors.quantityAfter ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Current stock: {currentStock} | New stock: {formData.quantityAfter} | Change: {(formData.quantityAfter - currentStock) > 0 ? '+' : ''}{formData.quantityAfter - currentStock}
                </p>
                {errors.quantityAfter && (
                  <p className="text-xs text-destructive">{errors.quantityAfter}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why this adjustment is needed..."
                  required
                  rows={3}
                  className={errors.reason ? 'border-destructive' : ''}
                />
                {errors.reason && (
                  <p className="text-xs text-destructive">{errors.reason}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Adjustment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Adjustment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjustment Details</DialogTitle>
            <DialogDescription id="view-adjustment-description">
              View detailed information about this stock adjustment
            </DialogDescription>
          </DialogHeader>
          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <div className="font-medium">{selectedAdjustment.product.name}</div>
                  {selectedAdjustment.variant && (
                    <div className="text-sm text-muted-foreground">
                      {selectedAdjustment.variant.name}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="font-medium">
                    {ADJUSTMENT_TYPES[selectedAdjustment.adjustmentType]?.label || 'Adjustment'}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stock Before</Label>
                  <div className="font-medium">{selectedAdjustment.quantityBefore}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stock After</Label>
                  <div className="font-medium">{selectedAdjustment.quantityAfter}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity Change</Label>
                  <div className="font-medium">
                    {selectedAdjustment.quantityDiff > 0 ? '+' : ''}
                    {selectedAdjustment.quantityDiff}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedAdjustment.approved ? 'default' : 'secondary'}>
                    {selectedAdjustment.approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Reason</Label>
                  <div className="text-sm">{selectedAdjustment.reason || '-'}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <div className="text-sm">
                    {new Date(selectedAdjustment.createdAt).toLocaleString()}
                  </div>
                </div>
                {selectedAdjustment.approvedAt && (
                  <div>
                    <Label className="text-muted-foreground">Approved At</Label>
                    <div className="text-sm">
                      {new Date(selectedAdjustment.approvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
