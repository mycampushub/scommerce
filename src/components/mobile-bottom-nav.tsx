'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home as HomeIcon, ShoppingBag, Search, ShoppingCart, Loader2, LogOut, LayoutDashboard, Heart, User } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { useAuth } from '@/hooks/use-auth'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { getItemCount } = useCartStore()
  const isVisible = useScrollDirection()
  const hasMounted = useHasMounted()
  const { user, loading, logout, isAdmin } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Avoid hydration mismatch by only rendering cart count on client
  const cartCount = hasMounted ? getItemCount() : 0

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  return (
    <>
      {isVisible && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300">
          <div className="pb-safe px-2 py-2 bg-white border-t border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between gap-1">
                {/* 1. Home */}
                <Link
                  href="/"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 ${
                    pathname === '/'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Navigate to home"
                >
                  <HomeIcon className="w-5 h-5" strokeWidth={2.5} />
                </Link>
                
                {/* 2. Shop */}
                <Link
                  href="/shop"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 ${
                    pathname?.startsWith('/shop') && pathname !== '/shop/search'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Navigate to shop"
                >
                  <ShoppingBag className="w-5 h-5" strokeWidth={2} />
                </Link>
                
                {/* 3. Search */}
                <Link
                  href="/search"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 ${
                    pathname === '/search'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5" strokeWidth={2} />
                </Link>

                {/* 4. Account */}
                <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                  <SheetTrigger asChild>
                    <button
                      className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 ${
                        userMenuOpen
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label="Account menu"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                      ) : user ? (
                        <div className="relative">
                          <User className="w-5 h-5" strokeWidth={2} />
                          {isAdmin && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-600 rounded-full"></span>
                          )}
                        </div>
                      ) : (
                        <User className="w-5 h-5" strokeWidth={2} />
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Account</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-pink-600" />
                        </div>
                      ) : user ? (
                        <>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-semibold text-gray-900">{user.name || 'User'}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <div className="space-y-2">
                            <Link
                              href="/account"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <LayoutDashboard className="w-5 h-5" />
                              <span>My Account</span>
                            </Link>
                            <Link
                              href="/account/orders"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <ShoppingBag className="w-5 h-5" />
                              <span>My Orders</span>
                            </Link>
                            <Link
                              href="/wishlist"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Heart className="w-5 h-5" />
                              <span>Wishlist</span>
                            </Link>
                            {isAdmin && (
                              <Link
                                href="/admin"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-pink-600 font-medium"
                              >
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Admin Dashboard</span>
                              </Link>
                            )}
                          </div>
                          <Separator />
                          <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="w-5 h-5 mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Link href="/login" onClick={() => setUserMenuOpen(false)}>
                            <Button className="w-full bg-pink-600 hover:bg-pink-700">
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/register" onClick={() => setUserMenuOpen(false)}>
                            <Button variant="outline" className="w-full">
                              Create Account
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* 5. Cart */}
                <Link
                  href="/cart"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 relative ${
                    pathname === '/cart'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="View cart"
                >
                  <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] min-h-[18px] px-1 bg-white text-pink-600 text-[10px] rounded-full flex items-center justify-center font-bold pointer-events-none">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
