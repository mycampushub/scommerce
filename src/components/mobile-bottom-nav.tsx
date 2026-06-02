'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home as HomeIcon, ShoppingBag, Search, ShoppingCart, Heart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { useWishlist } from '@/hooks/use-wishlist'

export function MobileBottomNav() {
  const pathname = usePathname()
  const { getItemCount } = useCartStore()
  const isVisible = useScrollDirection()
  const hasMounted = useHasMounted()
  const { data: wishlistItems = [] } = useWishlist()

  // Avoid hydration mismatch by only rendering cart count on client
  const cartCount = hasMounted ? getItemCount() : 0
  const wishlistCount = hasMounted ? wishlistItems.length : 0

  return (
    <>
      {isVisible && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300">
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
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg transition-colors active:scale-95 relative ${
                    pathname === '/wishlist'
                      ? 'bg-pink-600 text-white hover:bg-pink-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label="View wishlist"
                >
                  <Heart className="w-5 h-5" strokeWidth={2} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] min-h-[18px] px-1 bg-white text-pink-600 text-[10px] rounded-full flex items-center justify-center font-bold pointer-events-none">
                      {wishlistCount}
                    </span>
                  )}
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
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  )
}
