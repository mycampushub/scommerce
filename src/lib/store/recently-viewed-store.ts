import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentlyViewedProduct {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  image: string
  rating?: number
  reviews?: number
  categoryId?: string
  category?: string
  viewedAt: number
}

interface RecentlyViewedStore {
  items: RecentlyViewedProduct[]
  addProduct: (product: Omit<RecentlyViewedProduct, 'viewedAt'>) => void
  removeProduct: (id: string) => void
  clearHistory: () => void
  getRecentProducts: (limit?: number) => RecentlyViewedProduct[]
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],

      addProduct: (product) => {
        set((state) => {
          // Check if product already exists
          const existingIndex = state.items.findIndex((item) => item.id === product.id)

          if (existingIndex >= 0) {
            // Move existing product to front with new timestamp
            const updatedItems = [...state.items]
            updatedItems.splice(existingIndex, 1)
            return {
              items: [
                { ...product, viewedAt: Date.now() },
                ...updatedItems.slice(0, 19), // Keep max 20 items
              ],
            }
          }

          // Add new product to front
          return {
            items: [
              { ...product, viewedAt: Date.now() },
              ...state.items.slice(0, 19), // Keep max 20 items
            ],
          }
        })
      },

      removeProduct: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      clearHistory: () => set({ items: [] }),

      getRecentProducts: (limit = 8) => {
        return get().items.slice(0, limit)
      },
    }),
    {
      name: 'recently-viewed-storage',
    }
  )
)
