'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home as HomeIcon, ShoppingBag, Search, ShoppingCart, Loader2, LogOut, LayoutDashboard, Heart } from 'lucide-react'
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
                
                {/* 4. Wishlist */}
                <Link
                  href="/wishlist"
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 ${
                    pathname === '/wishlist'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="View wishlist"
                >
                  <Heart className="w-5 h-5" strokeWidth={2} />
                </Link>
                
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

                {/* 6. User Menu - only show when logged in */}
                {user ? (
                  <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                    <SheetTrigger asChild>
                      <button
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 ${
                          pathname?.startsWith('/account')
                            ? 'bg-pink-600 text-white hover:bg-pink-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label="Open user menu"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                        ) : (
                          <LayoutDashboard className="w-5 h-5" strokeWidth={2} />
                        )}
                      </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[60vh]">
                      <SheetHeader>
                        <SheetTitle>My Account</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col gap-1">
                        <div className="px-4 py-3 border-b">
                          <p className="font-semibold text-gray-900">{user.name || 'User'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            setUserMenuOpen(false)
                            router.push('/account/orders')
                          }}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          My Orders
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            setUserMenuOpen(false)
                            router.push('/account/settings')
                          }}
                        >
                          <LayoutDashboard className="w-4 h-4 mr-2" />
                          Account Settings
                        </Button>
                        <Separator />
                        <Button
                          variant="ghost"
                          className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Link
                    href="/login"
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 ${
                      pathname === '/login'
                        ? 'bg-pink-600 text-white hover:bg-pink-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label="Go to login"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
                    ) : (
                      <LayoutDashboard className="w-5 h-5" strokeWidth={2} />
                    )}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
