'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Search,
  Plus,
  MoreVertical,
  Shield,
  UserCog,
  Trash2,
  Edit,
  Lock,
  Unlock,
  RefreshCw,
  User,
} from 'lucide-react'

interface Staff {
  id: string
  name: string
  email: string
  role: string
  phone?: string | null
  address?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    orders: number
  }
}

export default function StaffPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  // Form state
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    address: '',
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    phone: '',
    address: '',
  })

  useEffect(() => {
    fetchStaff()
  }, [roleFilter])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.append('role', roleFilter)

      const response = await fetch(`/api/admin/staff?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setStaff(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch staff')
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching staff:', err)
      toast({
        title: 'Error',
        description: 'Failed to fetch staff members',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setAddFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      phone: '',
      address: '',
    })
    setIsAddModalOpen(true)
  }

  const openEditModal = (member: Staff) => {
    setSelectedStaff(member)
    setEditFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      phone: member.phone || '',
      address: member.address || '',
    })
    setIsEditModalOpen(true)
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addFormData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Staff member created successfully',
        })
        setIsAddModalOpen(false)
        setAddFormData({
          name: '',
          email: '',
          password: '',
          role: 'staff',
          phone: '',
          address: '',
        })
        fetchStaff()
      } else {
        throw new Error(result.error || 'Failed to create staff member')
      }
    } catch (err: any) {
      console.error('Error adding staff:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to add staff member',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return

    try {
      const response = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Staff member updated successfully',
        })
        setIsEditModalOpen(false)
        fetchStaff()
      } else {
        throw new Error(result.error || 'Failed to update staff member')
      }
    } catch (err: any) {
      console.error('Error updating staff:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to update staff member',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteStaff = async (member: Staff) => {
    if (!confirm(`Are you sure you want to delete ${member.name}? This action cannot be undone.`)) {
      return
    }

    if (member.role === 'admin') {
      toast({
        title: 'Error',
        description: 'Cannot delete admin users',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/staff/${member.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Staff member deleted successfully',
        })
        fetchStaff()
      } else {
        throw new Error(result.error || 'Failed to delete staff member')
      }
    } catch (err: any) {
      console.error('Error deleting staff:', err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete staff member',
        variant: 'destructive',
      })
    }
  }

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const stats = staff.reduce(
    (acc, member) => {
      acc.total++
      if (member.role === 'admin') acc.admins++
      if (member.role === 'staff') acc.staff++
      return acc
    },
    { total: 0, admins: 0, staff: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff & Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Manage admin and staff accounts with role-based access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStaff} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">Total Members</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <UserCog className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Admins</p>
                <p className="text-2xl font-bold mt-1 text-violet-600">{stats.admins}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Shield className="h-4 w-4 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Staff</p>
                <p className="text-2xl font-bold mt-1 text-indigo-600">{stats.staff}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search staff members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">User</TableHead>
                  <TableHead className="font-semibold text-gray-700">Role</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700">Orders Managed</TableHead>
                  <TableHead className="font-semibold text-gray-700">Joined</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-violet-600" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24">
                      <div className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <UserCog className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No staff members found</p>
                          <p className="text-sm text-gray-400">Click "Add Staff" to create one</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.map((member) => (
                  <TableRow key={member.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            member.role === 'admin'
                              ? 'bg-gradient-to-br from-violet-500 to-indigo-500'
                              : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                          }`}
                        >
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={member.role === 'admin' ? 'default' : 'secondary'}
                        className={member.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}
                      >
                        {member.role === 'admin' ? (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserCog className="h-3 w-3 mr-1" />
                            Staff
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {member.phone && (
                          <p className="text-sm text-gray-600">{member.phone}</p>
                        )}
                        {member.address && (
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{member.address}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{member._count?.orders || 0}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-900">{formatDate(member.createdAt)}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditModal(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteStaff(member)}
                            className="text-red-600"
                            disabled={member.role === 'admin'}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Create a new admin or staff account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={addFormData.name}
                onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={addFormData.email}
                onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={addFormData.password}
                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={addFormData.role} onValueChange={(value) => setAddFormData({ ...addFormData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Staff - Limited access
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {addFormData.role === 'admin' 
                  ? 'Admins have full access to all features' 
                  : 'Staff can manage products and orders but cannot manage staff or change settings'}
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="01712345678"
                value={addFormData.phone}
                onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="123 Main Street, City"
                value={addFormData.address}
                onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                Add Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information and role
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStaff} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                placeholder="John Doe"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john@example.com"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Leave blank to keep current"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
            </div>
            <div>
              <Label htmlFor="edit-role">Role *</Label>
              <Select 
                value={editFormData.role} 
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                disabled={selectedStaff?.role === 'admin'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Staff - Limited access
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin - Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedStaff?.role === 'admin' && (
                <p className="text-xs text-amber-600 mt-1">
                  Cannot modify admin role
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="01712345678"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                placeholder="123 Main Street, City"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                Update Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
