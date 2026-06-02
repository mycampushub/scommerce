'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCartStore } from '@/lib/store/cart-store'

/**
 * Hook to sync cart between local store and server for authenticated users
 * This ensures that logged-in users always see their database cart
 */
export function useCartSync() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { setItems: setCartStoreItems, clearCart, items } = useCartStore()
  const isInitializedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip during initial auth loading
    if (authLoading) return

    const currentUserId = user?.id || null

    // If user logged out, clear local cart
    if (!isAuthenticated && lastUserIdRef.current !== null) {
      console.log('[Cart Sync] User logged out, clearing local cart')
      clearCart()
      lastUserIdRef.current = null
      isInitializedRef.current = false
      return
    }

    // Skip if user is not authenticated
    if (!isAuthenticated || !currentUserId) {
      return
    }

    // Skip if already initialized for this user (avoid infinite loops)
    if (isInitializedRef.current && lastUserIdRef.current === currentUserId) {
      return
    }

    // Sync cart from server for authenticated users
    const syncCartFromServer = async () => {
      try {
        console.log('[Cart Sync] Fetching cart from server for user:', currentUserId)

        const response = await fetch('/api/cart', {
          credentials: 'include',
        })

        const data = await response.json() as any

        if (data.success && data.items && data.items.length > 0) {
          // Transform server cart items to match Zustand store format
          const transformedItems = data.items.map((item: any) => ({
            id: item.id,
            slug: item.slug || '',
            name: item.name,
            price: item.price,
            originalPrice: item.originalPrice,
            image: item.image,
            variantId: item.variantId,
            variantSku: item.variantSku,
            size: item.size,
            color: item.color,
            material: item.material,
            quantity: item.quantity,
          }))

          // Update Zustand store with server cart items
          setCartStoreItems(transformedItems)

          console.log('[Cart Sync] Successfully loaded cart from server:', {
            itemCount: transformedItems.length,
            userId: currentUserId,
          })
        } else if (items.length === 0) {
          // Both server and local carts are empty, nothing to do
          console.log('[Cart Sync] Server cart is empty, local is also empty')
        } else {
          // Server cart is empty but local has items
          // Keep local items and let the sync-to-server effect upload them
          console.log('[Cart Sync] Server cart is empty but local has', items.length, 'items, keeping local items')
        }

        isInitializedRef.current = true
        lastUserIdRef.current = currentUserId
      } catch (error) {
        console.error('[Cart Sync] Error fetching cart from server:', error)
        // Don't clear local cart on error, keep existing items
      }
    }

    syncCartFromServer()
  }, [isAuthenticated, user?.id, authLoading, setCartStoreItems, clearCart])

  // Sync cart items to server when they change (for authenticated users)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    const syncCartToServer = async () => {
      // Only sync if not during initial load
      if (!isInitializedRef.current) {
        return
      }

      // Get current items from store
      if (items.length === 0) {
        return
      }

      console.log('[Cart Sync] Syncing items to server:', items.length)

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'sync',
            items: items.map(item => ({
              id: item.id,
              productId: item.id,
              quantity: item.quantity,
              variantId: item.variantId,
              size: item.size,
              color: item.color,
              material: item.material,
            })),
          }),
        })

        const data = await response.json() as any
        if (data.success) {
          console.log('[Cart Sync] Successfully synced items to server:', data.synced)
        } else {
          console.error('[Cart Sync] Failed to sync items to server:', data.error)
        }
      } catch (error) {
        console.error('[Cart Sync] Error syncing items to server:', error)
      }
    }

    // Debounce sync to avoid too many API calls
    const timeoutId = setTimeout(syncCartToServer, 1000)

    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, user?.id, items])
}