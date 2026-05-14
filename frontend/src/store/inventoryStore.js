import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// each inventory item has the shape:
// { key: string, phoneme_id: number, symbol: string, diacritic_id: number|null, diacritic_symbol: string|null }
// key is either "phonemeId" or "phonemeId:diacriticId"

// sessionStorage means the inventory persists across page navigation and refreshes,
// but is cleared when the tab is closed
export const useInventoryStore = create(
  persist(
    (set, get) => ({
      inventory: [],
      // adds the entry if not already present; removes it if it is (toggle behavior)
      toggleInventory: (entry) => {
        set((state) => {
          if (state.inventory.some((item) => item.key === entry.key)) {
            return { inventory: state.inventory.filter((item) => item.key !== entry.key) }
          }
          return { inventory: [...state.inventory, entry] }
        })
      },
      clearInventory: () => set({ inventory: [] }),
    }),
    {
      name: 'phoneme-inventory',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
