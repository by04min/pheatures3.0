import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/*
01. INVENTORY STORE
    Holds the sounds the user has chosen, shared by every page.
    Saved in the browser tab, so it survives page navigation and refreshes but is cleared when the tab is closed.
    Each item has the shape: { key, phoneme_id, symbol, diacritic_id: number|null, diacritic_symbol: string|null }
    where key is either "phonemeId" or "phonemeId:diacriticId"
*/
export const useInventoryStore = create(
  persist(
    (set) => ({
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
    },
  ),
)
