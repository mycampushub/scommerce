import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Shipping configuration (should ideally come from settings API)
const FREE_SHIPPING_THRESHOLD = 5000 // BDT currency
const BASE_SHIPPING_COST = 150 // BDT currency

export interface CartItem {
  id: string
  slug: string
  name: string
  price: number
  originalPrice?: number
  image: string
  variantId?: string
  variantSku?: string
  size?: string
  color?: string
  material?: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string, variantId?: string) => void
  updateQuantity: (id: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  setItems: (items: CartItem[]) => void
  getItemCount: () => number
  getSubtotal: () => number
  getTotal: () => number
  calculateShipping: (division?: string, weight?: number) => Promise<number>
  getTotalWithShipping: (division?: string, weight?: number) => Promise<number>
}

// Create a safe storage that works with SSR
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(name)
    } catch (error) {
      console.warn('Error reading from localStorage:', error)
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(name, value)
    } catch (error) {
      console.warn('Error writing to localStorage:', error)
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(name)
    } catch (error) {
      console.warn('Error removing from localStorage:', error)
    }
  },
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Match by variantId if present, otherwise by id
          const existingItemIndex = state.items.findIndex(
            (i) => {
              if (item.variantId) {
                return i.variantId === item.variantId
              }
              return i.id === item.id
            }
          )

          if (existingItemIndex >= 0) {
            const updatedItems = [...state.items]
            updatedItems[existingItemIndex].quantity += item.quantity
            return { items: updatedItems }
          }

          return { items: [...state.items, item] }
        })
      },

      removeItem: (id, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => {
              if (variantId) {
                return !(item.variantId === variantId)
              }
              return !(item.id === id && !item.variantId)
            }
          ),
        }))
      },

      updateQuantity: (id, quantity, variantId) => {
        if (quantity < 1) return

        set((state) => ({
          items: state.items.map((item) => {
            if (variantId) {
              return item.variantId === variantId
                ? { ...item, quantity }
                : item
            }
            return item.id === id && !item.variantId
              ? { ...item, quantity }
              : item
          }),
        }))
      },

      clearCart: () => {
        set({ items: [] })
        // Clear localStorage explicitly
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('cart-storage')
          } catch (error) {
            console.warn('Error clearing cart from localStorage:', error)
          }
        }
      },

      setItems: (newItems) => {
        set({ items: newItems })
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_COST
        return subtotal + shipping
      },

      calculateShipping: async (division?: string, weight?: number) => {
        try {
          const subtotal = get().getSubtotal()
          const response = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subtotal,
              division,
              weight: weight || 1, // Default weight 1kg
            }),
          })
          const result = await response.json() as any
          if (result.success) {
            return result.data.shippingCost
          }
          return BASE_SHIPPING_COST // Fallback to default shipping
        } catch (error) {
          console.error('Shipping calculation error:', error)
          return BASE_SHIPPING_COST // Fallback to default shipping
        }
      },

      getTotalWithShipping: async (division?: string, weight?: number) => {
        const subtotal = get().getSubtotal()
        const shipping = await get().calculateShipping(division, weight)
        return subtotal + shipping
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => safeStorage),
      skipHydration: false,
    }
  )
)
