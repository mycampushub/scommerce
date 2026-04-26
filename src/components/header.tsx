'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Search, ShoppingCart, Menu, Loader2, Heart } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { useAuth } from '@/hooks/use-auth'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const { getItemCount } = useCartStore()
  const isHeaderVisible = useScrollDirection()
  const hasMounted = useHasMounted()
  const { user, loading, logout, isAuthenticated } = useAuth()

  // Avoid hydration mismatch by only rendering cart count on client
  const cartCount = hasMounted ? getItemCount() : 0

  // Fetch wishlist count when user is authenticated
  const fetchWishlistCount = async () => {
    try {
      const response = await fetch('/api/wishlist')
      const data = await response.json()
      if (data.success) {
        setWishlistCount(data.data.length)
      }
    } catch (error) {
      console.error('Error fetching wishlist count:', error)
    }
  }

  React.useEffect(() => {
    if (isAuthenticated && hasMounted) {
      fetchWishlistCount()
    }
  }, [isAuthenticated, hasMounted])

  return (
    <header className={`bg-white shadow-sm z-40 transition-transform duration-300 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="modern ecommerce"
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              href="/collections/saree" 
              className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                pathname?.startsWith('/collections/saree') ? 'text-pink-600' : ''
              }`}
            >
              Sarees
            </Link>
            <Link 
              href="/collections/salwar" 
              className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                pathname?.startsWith('/collections/salwar') ? 'text-pink-600' : ''
              }`}
            >
              Salwar Suits
            </Link>
            <Link 
              href="/collections/lehengas" 
              className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                pathname?.startsWith('/collections/lehengas') ? 'text-pink-600' : ''
              }`}
            >
              Lehangas
            </Link>
            <Link 
              href="/collections/kurtas" 
              className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                pathname?.startsWith('/collections/kurtas') ? 'text-pink-600' : ''
              }`}
            >
              Kurtas
            </Link>
            <Link 
              href="/collections/menswear" 
              className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                pathname?.startsWith('/collections/menswear') ? 'text-pink-600' : ''
              }`}
            >
              Menswear
            </Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <button
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
              onClick={() => window.location.href = '/search'}
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/cart"
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/wishlist"
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors relative"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <UserMenu user={user} loading={loading} isAdmin={user?.role === 'admin'} onLogout={logout} />
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-4">
              <Link 
                href="/collections/saree" 
                className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                  pathname?.startsWith('/collections/saree') ? 'text-pink-600' : ''
                }`}
              >
                Sarees
              </Link>
              <Link 
                href="/collections/salwar" 
                className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                  pathname?.startsWith('/collections/salwar') ? 'text-pink-600' : ''
                }`}
              >
                Salwar Suits
              </Link>
              <Link 
                href="/collections/lehengas" 
                className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                  pathname?.startsWith('/collections/lehengas') ? 'text-pink-600' : ''
                }`}
              >
                Lehangas
              </Link>
              <Link 
                href="/collections/kurtas" 
                className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                  pathname?.startsWith('/collections/kurtas') ? 'text-pink-600' : ''
                }`}
              >
                Kurtas
              </Link>
              <Link 
                href="/collections/menswear" 
                className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                  pathname?.startsWith('/collections/menswear') ? 'text-pink-600' : ''
                }`}
              >
                Menswear
              </Link>
            </nav>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
              <button
                className="flex items-center gap-2 text-gray-700"
                onClick={() => window.location.href = '/search'}
              >
                <Search className="w-5 h-5" />
              </button>
              <Link href="/cart" className="flex items-center gap-2 text-gray-700 relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/wishlist" className="flex items-center gap-2 text-gray-700 relative">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              {loading ? (
                <div className="flex items-center gap-2 text-gray-700">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : user ? (
                <Link href="/profile" className="flex items-center gap-2 text-gray-700">
                  <span className="text-sm font-medium">{user.name || 'Profile'}</span>
                </Link>
              ) : (
                <Link href="/login" className="flex items-center gap-2 text-gray-700">
                  <span className="text-sm font-medium">Login</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
