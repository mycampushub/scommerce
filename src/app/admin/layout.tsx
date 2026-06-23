'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  UserCog,
  Tags,
  BarChart3,
  Box,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Ticket,
  Truck,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Warehouse,
  Building2,
  Layers,
  MessageSquare
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

const navigation = [
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Homepage', href: '/admin/homepage', icon: Home },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

const staffNavItem = { name: 'Staff', href: '/admin/staff', icon: UserCog }

const productManagementNav = [
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Brands', href: '/admin/brands', icon: Building2 },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
]

const inventoryNav = [
  { name: 'Inventory', href: '/admin/inventory', icon: Box },
  { name: 'Purchase Orders', href: '/admin/purchase-orders', icon: ClipboardList },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Truck },
  { name: 'Inventory Reports', href: '/admin/inventory/reports', icon: FileText },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [productManagementExpanded, setProductManagementExpanded] = useState(false)
  const [inventoryExpanded, setInventoryExpanded] = useState(false)
  const { user, loading } = useAuth()

  // Auto-expand product management section if on product-related pages
  useEffect(() => {
    const isProductPage = productManagementNav.some(item => pathname.startsWith(item.href))
    if (isProductPage) {
      setProductManagementExpanded(true)
    }
  }, [pathname])

  // Auto-expand inventory section if on inventory-related pages
  useEffect(() => {
    const isInventoryPage = inventoryNav.some(item => pathname.startsWith(item.href))
    if (isInventoryPage) {
      setInventoryExpanded(true)
    }
  }, [pathname])

  // Client-side auth check - redirect if not authenticated or not admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login')
      } else if (user.role !== 'admin') {
        // Not an admin, redirect to home
        router.push('/')
      }
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render admin content if not authenticated
  if (!user || user.role !== 'admin') {
    return null
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'AD'
    const nameParts = user.name.split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }

  // Get page name from all navigation arrays
  const getPageName = () => {
    // Check Dashboard first
    if (pathname === '/admin') return 'Dashboard'

    // Check Settings
    if (pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')) return 'Settings'

    // Check Staff
    if (pathname === '/admin/staff' || pathname.startsWith('/admin/staff/')) return 'Staff'

    // Check product management navigation
    const productNavItem = productManagementNav.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    if (productNavItem) return productNavItem.name

    // Check inventory navigation
    const inventoryNavItem = inventoryNav.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    if (inventoryNavItem) return inventoryNavItem.name

    // Check main navigation
    const mainNavItem = navigation.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
    if (mainNavItem) return mainNavItem.name

    return 'Dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 shadow-xl transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-500">E-commerce Dashboard</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4 h-[calc(100vh-8rem)]">
            <nav className="space-y-1">
              {/* Dashboard - always first */}
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                  pathname === '/admin'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <LayoutDashboard className={cn('h-5 w-5', pathname === '/admin' ? 'text-white' : 'text-gray-500')} />
                Dashboard
              </Link>
            </nav>

            {/* Product Management Section */}
            <div className="mt-4">
              <button
                onClick={() => setProductManagementExpanded(!productManagementExpanded)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all',
                  productManagementExpanded || productManagementNav.some(item => pathname.startsWith(item.href))
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Layers className={cn('h-5 w-5', productManagementExpanded || productManagementNav.some(item => pathname.startsWith(item.href)) ? 'text-violet-600' : 'text-gray-500')} />
                  <span>Product Management</span>
                </div>
                {productManagementExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {productManagementExpanded && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                  {productManagementNav.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-gray-500')} />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Inventory Management Section */}
            <div className="mt-4">
              <button
                onClick={() => setInventoryExpanded(!inventoryExpanded)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all',
                  inventoryExpanded || inventoryNav.some(item => pathname.startsWith(item.href))
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <Warehouse className={cn('h-5 w-5', inventoryExpanded || inventoryNav.some(item => pathname.startsWith(item.href)) ? 'text-violet-600' : 'text-gray-500')} />
                  <span>Inventory Management</span>
                </div>
                {inventoryExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {inventoryExpanded && (
                <div className="mt-1 ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                  {inventoryNav.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-gray-500')} />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Other Navigation Items */}
            <nav className="mt-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-500')} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <Separator className="my-6" />

            {/* Staff - just before Settings */}
            <Link
              href="/admin/staff"
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                pathname === '/admin/staff' || pathname.startsWith('/admin/staff/')
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <UserCog className={cn('h-5 w-5', pathname === '/admin/staff' || pathname.startsWith('/admin/staff/') ? 'text-white' : 'text-gray-500')} />
              {staffNavItem.name}
            </Link>

            {/* Settings - always before logout */}
            <Link
              href="/admin/settings"
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className={cn('h-5 w-5', pathname === '/admin/settings' || pathname.startsWith('/admin/settings/') ? 'text-white' : 'text-gray-500')} />
              Settings
            </Link>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                router.push('/login')
              }}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <p className="text-xs text-gray-500">
              © 2024 Admin Dashboard
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {getPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {getUserInitials()}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Super Admin' : 'Staff'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
