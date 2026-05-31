'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, ShoppingCart, Menu, Loader2, Heart, X } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { useAuth } from '@/hooks/use-auth'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/use-focus-trap'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const { getItemCount } = useCartStore()
  const isHeaderVisible = useScrollDirection()
  const hasMounted = useHasMounted()
  const { user, loading, logout, isAuthenticated } = useAuth()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { activate, deactivate, handleTabKey } = useFocusTrap()

  // Avoid hydration mismatch by only rendering cart count on client
  const cartCount = hasMounted ? getItemCount() : 0

  // Fetch wishlist count when user is authenticated
  const fetchWishlistCount = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.status === 401) {
        // User not authenticated, clear the count
        setWishlistCount(0)
        return
      }
      const data = await response.json() as any
      if (data.success && Array.isArray(data.data)) {
        setWishlistCount(data.data.length)
      } else {
        setWishlistCount(0)
      }
    } catch (error) {
      console.error('Error fetching wishlist count:', error)
      setWishlistCount(0)
    }
  }

  React.useEffect(() => {
    if (!loading && isAuthenticated && hasMounted) {
      fetchWishlistCount()
    } else if (!isAuthenticated && hasMounted) {
      // Clear wishlist count when user is not authenticated
      setWishlistCount(0)
    }
  }, [isAuthenticated, hasMounted, loading])

  // Focus trap and body scroll management
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      // Activate focus trap
      activate(mobileMenuRef.current)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Deactivate focus trap
      deactivate()
      // Restore body scroll
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen, activate, deactivate])

  // Escape key handling
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  // Tab key handling for focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleTabKey(e)
    }

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen, handleTabKey])

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
              onClick={() => router.push('/search')}
              aria-label="Search products"
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
              className="lg:hidden min-h-[44px] min-w-[44px] p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="lg:hidden fixed inset-0 top-16 bg-white z-50 overflow-y-auto"
          >
            <div className="container mx-auto px-4 py-6">
              {/* Close button */}
              <button
                className="absolute top-4 right-4 p-2 text-gray-700 hover:text-pink-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>

              <nav className="flex flex-col gap-4 pt-8" role="navigation" aria-label="Main navigation">
                <Link
                  href="/collections/saree"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-gray-700 hover:text-pink-600 transition-colors font-medium py-2 border-b border-gray-100 ${
                    pathname?.startsWith('/collections/saree') ? 'text-pink-600' : ''
                  }`}
                >
                  Sarees
                </Link>
                <Link
                  href="/collections/salwar"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-gray-700 hover:text-pink-600 transition-colors font-medium py-2 border-b border-gray-100 ${
                    pathname?.startsWith('/collections/salwar') ? 'text-pink-600' : ''
                  }`}
                >
                  Salwar Suits
                </Link>
                <Link
                  href="/collections/lehengas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-gray-700 hover:text-pink-600 transition-colors font-medium py-2 border-b border-gray-100 ${
                    pathname?.startsWith('/collections/lehengas') ? 'text-pink-600' : ''
                  }`}
                >
                  Lehangas
                </Link>
                <Link
                  href="/collections/kurtas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-gray-700 hover:text-pink-600 transition-colors font-medium py-2 border-b border-gray-100 ${
                    pathname?.startsWith('/collections/kurtas') ? 'text-pink-600' : ''
                  }`}
                >
                  Kurtas
                </Link>
                <Link
                  href="/collections/menswear"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-gray-700 hover:text-pink-600 transition-colors font-medium py-2 border-b border-gray-100 ${
                    pathname?.startsWith('/collections/menswear') ? 'text-pink-600' : ''
                  }`}
                >
                  Menswear
                </Link>
              </nav>
              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
                <button
                  className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors p-2"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    router.push('/search')
                  }}
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors p-2 relative"
                  aria-label={`Shopping cart ${cartCount > 0 ? `with ${cartCount} items` : ''}`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors p-2 relative"
                  aria-label={`Wishlist ${wishlistCount > 0 ? `with ${wishlistCount} items` : ''}`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 text-white text-xs rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : user ? (
                  <Link
                    href="/account/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors p-2"
                  >
                    <span className="text-sm font-medium">My Account</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors p-2"
                  >
                    <span className="text-sm font-medium">Login</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
