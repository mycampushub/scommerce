'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Home
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Staff', href: '/admin/staff', icon: UserCog },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Homepage', href: '/admin/homepage', icon: Home },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Inventory', href: '/admin/inventory', icon: Box },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'AD'
    const nameParts = user.name.split(' ')
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
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
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
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

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/login'
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
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
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
