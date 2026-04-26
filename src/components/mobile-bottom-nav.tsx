'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home as HomeIcon, ShoppingBag, Search, ShoppingCart, User, Loader2, LogOut, LayoutDashboard, Heart } from 'lucide-react'
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
  }

  return (
    <>
      {isVisible && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300">
          <div className="pb-safe pt-3 pb-6 px-4">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-3 py-2 flex items-center justify-between gap-1">
                <Link
                  href="/"
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 ${
                    pathname === '/'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Navigate to home"
                >
                  <HomeIcon className="w-5 h-5" strokeWidth={2.5} />
                </Link>
                <Link
                  href="/shop"
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 ${
                    pathname?.startsWith('/shop') && pathname !== '/shop/search'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Navigate to shop"
                >
                  <ShoppingBag className="w-5 h-5" strokeWidth={2} />
                </Link>
                <button
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 ${
                    pathname === '/search'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="Open search"
                  onClick={() => window.location.href = '/search'}
                >
                  <Search className="w-5 h-5" strokeWidth={2} />
                </button>
                <Link
                  href="/cart"
                  className={`flex flex-col items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 relative ${
                    pathname === '/cart'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="View cart"
                >
                  <ShoppingCart className="w-5 h-5" strokeWidth={2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-white text-pink-600 text-[10px] rounded-full flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  )}
                </Link>
                {loading ? (
                  <div className="flex flex-col items-center justify-center w-11 h-11 rounded-full bg-gray-100 text-gray-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : user ? (
                  <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                    <SheetTrigger asChild>
                      <button
                        className={`flex flex-col items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 ${
                          pathname?.startsWith('/profile')
                            ? 'bg-pink-600 text-white hover:bg-pink-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label="Open user menu"
                      >
                        <User className="w-5 h-5" strokeWidth={2} />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-auto pb-safe">
                      <SheetHeader>
                        <SheetTitle>My Account</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 space-y-1">
                        <div className="px-4 py-3 bg-gray-50 rounded-lg">
                          <p className="font-medium text-sm">{user.name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Separator />
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4"
                          onClick={() => {
                            router.push('/profile')
                            setUserMenuOpen(false)
                          }}
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4"
                          onClick={() => {
                            router.push('/orders')
                            setUserMenuOpen(false)
                          }}
                        >
                          <ShoppingBag className="w-4 h-4 mr-3" />
                          Orders
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4"
                          onClick={() => {
                            router.push('/wishlist')
                            setUserMenuOpen(false)
                          }}
                        >
                          <Heart className="w-4 h-4 mr-3" />
                          Wishlist
                        </Button>
                        {isAdmin && (
                          <>
                            <Separator />
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-12 px-4"
                              onClick={() => {
                                router.push('/admin')
                                setUserMenuOpen(false)
                              }}
                            >
                              <LayoutDashboard className="w-4 h-4 mr-3" />
                              Admin Dashboard
                            </Button>
                          </>
                        )}
                        <Separator />
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Link
                    href="/login"
                    className="flex flex-col items-center justify-center w-11 h-11 rounded-full transition-colors active:scale-95 bg-gray-100 text-gray-700 hover:bg-gray-200"
                    aria-label="Sign in"
                  >
                    <User className="w-5 h-5" strokeWidth={2} />
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
