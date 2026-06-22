'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, ShoppingCart, Menu, Loader2, Heart, X, ChevronDown, ChevronRight, User, LogOut, Settings, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart-store'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { useAuth } from '@/hooks/use-auth'
import { useCartSync } from '@/hooks/use-cart-sync'
import { UserMenu } from '@/components/user-menu'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/use-focus-trap'

interface Category {
  id: string
  name: string
  slug: string
  image: string
  href: string
  children?: Category[]
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const { getItemCount } = useCartStore()
  const isHeaderVisible = useScrollDirection()
  const hasMounted = useHasMounted()
  const { user, loading, logout, isAuthenticated } = useAuth()
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { activate, deactivate, handleTabKey } = useFocusTrap()

  // Sync cart from server for authenticated users
  useCartSync()

  // Avoid hydration mismatch by only rendering cart count on client
  const cartCount = hasMounted ? getItemCount() : 0

  // Toggle category expansion in mobile menu
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

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

  // Fetch hierarchical categories for navigation
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?hierarchical=true')
      const data = await response.json() as any

      let categoryList: Category[] = []

      if (data.success && Array.isArray(data.data)) {
        // If hierarchical data is returned
        categoryList = data.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image || '',
          href: `/collections/${cat.slug}`,
          children: cat.children ? cat.children.map((child: any) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            image: child.image || '',
            href: `/collections/${child.slug}`
          })) : undefined
        }))
      } else if (data.success && Array.isArray(data.categories)) {
        // Fallback for different response structure
        categoryList = data.categories.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image || '',
          href: `/collections/${cat.slug}`
        }))
      } else {
        // Fallback to hardcoded categories if API fails
        categoryList = [
          { id: '1', name: 'Sarees', slug: 'saree', image: '/images/categories/sarees.svg', href: '/collections/saree' },
          { id: '2', name: 'Salwar Suits', slug: 'salwar', image: '/images/categories/salwar.svg', href: '/collections/salwar' },
          { id: '3', name: 'Lehengas', slug: 'lehengas', image: '/images/categories/lehengas.svg', href: '/collections/lehengas' },
          { id: '4', name: 'Kurtas', slug: 'kurtas', image: '/images/categories/kurtas.svg', href: '/collections/kurtas' },
          { id: '5', name: 'Menswear', slug: 'menswear', image: '/images/categories/menswear.svg', href: '/collections/menswear' },
        ]
      }

      setCategories(categoryList)
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Fallback to hardcoded categories if API fails
      setCategories([
        { id: '1', name: 'Sarees', slug: 'saree', image: '/images/categories/sarees.svg', href: '/collections/saree' },
        { id: '2', name: 'Salwar Suits', slug: 'salwar', image: '/images/categories/salwar.svg', href: '/collections/salwar' },
        { id: '3', name: 'Lehengas', slug: 'lehengas', image: '/images/categories/lehengas.svg', href: '/collections/lehengas' },
        { id: '4', name: 'Kurtas', slug: 'kurtas', image: '/images/categories/kurtas.svg', href: '/collections/kurtas' },
        { id: '5', name: 'Menswear', slug: 'menswear', image: '/images/categories/menswear.svg', href: '/collections/menswear' },
      ])
    }
  }

  // Fetch wishlist count and categories on mount
  useEffect(() => {
    if (!loading && isAuthenticated && hasMounted) {
      fetchWishlistCount()
    } else if (!isAuthenticated && hasMounted) {
      // Clear wishlist count when user is not authenticated
      setWishlistCount(0)
    }
    // Always fetch categories for navigation
    if (hasMounted) {
      fetchCategories()
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
    <>
    <header className={`bg-white shadow-sm z-50 transition-transform duration-300 ${
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
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={category.href}
                className={`text-gray-700 hover:text-pink-600 transition-colors font-medium ${
                  hasMounted && pathname?.startsWith(category.href) ? 'text-pink-600' : ''
                }`}
              >
                {category.name}
              </Link>
            ))}
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
              className="lg:hidden min-h-[44px] min-w-[44px] p-2 text-gray-700 hover:text-pink-600 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-[200] lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={mobileMenuRef}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="lg:hidden fixed inset-0 top-16 bg-white z-[210] overflow-y-auto"
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

              <nav className="flex flex-col gap-2 pt-8" role="navigation" aria-label="Main navigation">
                {categories.map((category) => {
                  const hasChildren = category.children && category.children.length > 0
                  const isExpanded = expandedCategories.has(category.id)

                  return (
                    <div key={category.id}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={category.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex-1 text-gray-700 hover:text-pink-600 transition-colors font-medium py-3 border-b border-gray-100 ${
                            hasMounted && pathname?.startsWith(category.href) ? 'text-pink-600' : ''
                          }`}
                        >
                          {category.name}
                        </Link>
                        {hasChildren && (
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-700 hover:text-pink-600 transition-colors ml-2"
                            aria-label={isExpanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                      {hasChildren && isExpanded && (
                        <div className="ml-4 pl-4 border-l-2 border-gray-200">
                          {category.children?.map((child) => (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`block text-gray-600 hover:text-pink-600 transition-colors py-2 border-b border-gray-50 text-sm ${
                                hasMounted && pathname?.startsWith(child.href) ? 'text-pink-600 font-medium' : ''
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
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
                  <>
                    <Link
                      href="/account/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors py-3 border-b border-gray-50"
                    >
                      <User className="w-5 h-5" />
                      <span className="text-sm font-medium">My Account</span>
                    </Link>
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors py-3 border-b border-gray-50"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span className="text-sm font-medium">My Orders</span>
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors py-3 border-b border-gray-50"
                      >
                        <Settings className="w-5 h-5" />
                        <span className="text-sm font-medium">Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors py-3 w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </>
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
          </>
        )}
    </>
  )
}
