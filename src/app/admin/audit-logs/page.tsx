'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
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
  Filter,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { escapeCSVField, downloadCSV } from '@/lib/csv-utils'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId?: string
  adminName: string
  adminEmail: string
  adminId: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (actionFilter !== 'ALL') params.append('action', actionFilter)
      if (entityFilter !== 'ALL') params.append('entity', entityFilter)

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      const result = await response.json() as any

      if (result.success) {
        setLogs(result.data || [])
        setTotal(result.meta?.total || 0)
      } else {
        throw new Error(result.error || 'Failed to fetch audit logs')
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh on page load
  useEffect(() => {
    fetchLogs()
  }, [actionFilter, entityFilter, searchTerm, limit, offset])

  const handleSearch = () => {
    setOffset(0)
    fetchLogs()
  }

  const handleActionFilterChange = (value: string) => {
    setOffset(0)
    setActionFilter(value)
  }

  const handleEntityFilterChange = (value: string) => {
    setOffset(0)
    setEntityFilter(value)
  }

  const handleRefresh = () => {
    setOffset(0)
    fetchLogs()
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailModalOpen(true)
  }

  const exportLogs = async () => {
    if (logs.length === 0) {
      toast.info('No audit logs to export')
      return
    }

    const headers = ['Timestamp', 'Admin Name', 'Admin Email', 'Action', 'Entity', 'Entity ID', 'IP Address', 'User Agent', 'Admin ID']
    const csvRows = [
      headers.map(escapeCSVField).join(','),
      ...logs.map(log => [
        log.createdAt,
        log.adminName,
        log.adminEmail,
        log.action,
        log.entity,
        log.entityId || '-',
        log.ipAddress || '-',
        log.userAgent || '-',
        log.adminId,
      ].map(escapeCSVField).join(','))
    ]

    const csvContent = csvRows.join('\n')
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csvContent, filename)

    toast.success('Audit logs exported successfully')
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
        <p className="text-gray-600">Track all admin actions and system events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={actionFilter} onValueChange={handleActionFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={handleEntityFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Entities</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="products">Products</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="categories">Categories</SelectItem>
              <SelectItem value="promotions">Promotions</SelectItem>
              <SelectItem value="banners">Banners</SelectItem>
              <SelectItem value="stories">Stories</SelectItem>
              <SelectItem value="reels">Reels</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLogs} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Actions Today</p>
              <p className="text-2xl font-bold text-green-600">{logs.filter(l => {
                const logDate = new Date(l.createdAt)
                const today = new Date()
                return logDate.toDateString() === today.toDateString()
              }).length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">By: {actionFilter}</p>
              <p className="text-2xl font-bold text-violet-600">{actionFilter === 'ALL' ? logs.length : logs.filter(l => l.action === actionFilter).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            View all admin actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <EyeOff className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-red-300 mx-auto mb-3" />
              <p className="text-gray-500">Failed to load audit logs</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto -mx-4 px-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[180px]">Timestamp</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Admin</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Action</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Entity</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Entity ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">IP Address</TableHead>
                    <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">User Agent</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right whitespace-nowrap min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="text-sm text-gray-900 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="break-all">{log.adminName}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getBadgeVariant(log.action)}
                          className={getBadgeColor(log.action)}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell>
                        {log.entityId && (
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">
                            {log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500 text-right max-w-[120px] truncate">
                          {log.userAgent || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4 text-gray-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-2xl overflow-x-hidden" aria-describedby="log-detail-description">
            <DialogHeader>
              <DialogTitle>Log Details</DialogTitle>
              <DialogDescription id="log-detail-description">
                View complete log information
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Action</Label>
                  <Input value={selectedLog.action} readOnly className="w-full" />
                </div>
                <div>
                  <Label>Entity</Label>
                  <Input value={selectedLog.entity || ''} readOnly className="w-full" />
                </div>
                <div>
                  <Label>Entity ID</Label>
                  <Input value={selectedLog.entityId || ''} readOnly className="w-full" />
                </div>
                <div>
                  <Label>Admin Name</Label>
                  <Input value={selectedLog.adminName} readOnly className="w-full" />
                </div>
                <div>
                  <Label>Admin Email</Label>
                  <Input value={selectedLog.adminEmail} readOnly className="w-full" />
                </div>
                <div>
                  <Label>Admin ID</Label>
                  <Input value={selectedLog.adminId} readOnly className="w-full" />
                </div>
                <div>
                  <Label>IP Address</Label>
                  <Input value={selectedLog.ipAddress || ''} readOnly className="w-full" />
                </div>
                <div>
                  <Label>User Agent</Label>
                  <textarea
                    value={selectedLog.userAgent || ''}
                    readOnly
                    className="w-full font-mono text-xs p-2"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Helper functions
function getBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'CREATE':
      return 'default'
    case 'UPDATE':
      return 'secondary'
    case 'DELETE':
      return 'destructive'
    case 'LOGIN':
      return 'outline'
    case 'LOGOUT':
      return 'outline'
    default:
      return 'default'
  }
}

function getBadgeColor(action: string): string {
  switch (action) {
    case 'CREATE':
      return 'bg-green-100 text-green-700'
    case 'UPDATE':
      return 'bg-blue-100 text-blue-700'
    case 'DELETE':
      return 'bg-red-100 text-red-700'
    case 'LOGIN':
      return 'bg-purple-100 text-purple-700'
    case 'LOGOUT':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
