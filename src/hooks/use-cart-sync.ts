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
  const pendingSyncItemsRef = useRef<any[]>([])
  const prevItemsLengthRef = useRef(items.length)

  // Fetch server cart when user logs in or changes
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
      pendingSyncItemsRef.current = []
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

    // Store pending local items before fetching from server
    if (items.length > 0) {
      pendingSyncItemsRef.current = [...items]
      console.log('[Cart Sync] Stored pending local items:', items.length)
    }

    // Sync cart from server for authenticated users
    const syncCartFromServer = async () => {
      try {
        console.log('[Cart Sync] Fetching cart from server for user:', currentUserId)
        console.log('[Cart Sync] Local items before fetch:', items.length)
        console.log('[Cart Sync] Pending items ref:', pendingSyncItemsRef.current.length)

        const response = await fetch('/api/cart', {
          credentials: 'include',
        })

        const data = await response.json() as any

        console.log('[Cart Sync] Server response:', {
          success: data.success,
          itemsCount: data.items?.length || 0,
          source: data.source
        })

        if (data.success && data.items && data.items.length > 0) {
          // Server has cart items, use them
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
          pendingSyncItemsRef.current = []

          console.log('[Cart Sync] Successfully loaded cart from server:', {
            itemCount: transformedItems.length,
            userId: currentUserId,
          })
        } else {
          // Server cart is empty, use local items if available
          if (pendingSyncItemsRef.current.length > 0) {
            console.log('[Cart Sync] Server cart empty, using local items:', pendingSyncItemsRef.current.length)
            // Local items are already in the store, no need to set again
            // They will be synced to server in the next effect
          } else {
            console.log('[Cart Sync] Server cart empty and no local items')
          }
        }

        isInitializedRef.current = true
        lastUserIdRef.current = currentUserId
      } catch (error) {
        console.error('[Cart Sync] Error fetching cart from server:', error)
        // Don't clear local cart on error, keep existing items
        isInitializedRef.current = true
        lastUserIdRef.current = currentUserId
      }
    }

    syncCartFromServer()
  }, [isAuthenticated, user?.id, authLoading, setCartStoreItems, clearCart])

  // Sync pending local items to server after initialization
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    // Only sync if we have initialized and have pending items
    if (!isInitializedRef.current || pendingSyncItemsRef.current.length === 0) {
      return
    }

    const syncPendingItemsToServer = async () => {
      console.log('[Cart Sync] Syncing pending items to server:', pendingSyncItemsRef.current.length)

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'sync',
            items: pendingSyncItemsRef.current.map(item => ({
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
        console.log('[Cart Sync] Sync response:', { success: data.success, synced: data.synced, errors: data.errors })
        if (data.success) {
          console.log('[Cart Sync] Successfully synced pending items to server:', data.synced)
        } else {
          console.error('[Cart Sync] Failed to sync pending items to server:', data.error)
        }
      } catch (error) {
        console.error('[Cart Sync] Error syncing pending items to server:', error)
      } finally {
        // Clear pending items regardless of success or failure
        pendingSyncItemsRef.current = []
      }
    }

    syncPendingItemsToServer()
  }, [isAuthenticated, user?.id])

  // Sync cart items to server when they change (for authenticated users)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return
    }

    // Only sync after initialization
    if (!isInitializedRef.current) {
      return
    }

    // Skip if we still have pending items (they're being synced in the other effect)
    if (pendingSyncItemsRef.current.length > 0) {
      return
    }

    // Sync current items to server
    if (items.length === 0) {
      prevItemsLengthRef.current = items.length
      return
    }

    // If items were removed (count decreased), skip sync — server already handled the removal
    if (items.length < prevItemsLengthRef.current) {
      console.log('[Cart Sync] Items decreased, skipping sync (removal handled server-side)')
      prevItemsLengthRef.current = items.length
      return
    }
    prevItemsLengthRef.current = items.length

    const syncCartToServer = async () => {
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
        console.log('[Cart Sync] Sync response:', { success: data.success, synced: data.synced, errors: data.errors })
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