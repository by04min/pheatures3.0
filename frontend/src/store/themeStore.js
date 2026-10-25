import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// mirror isDark onto <html> so Tailwind's dark: variants apply (see @custom-variant in index.css)
const applyTheme = (isDark) => document.documentElement.classList.toggle('dark', isDark)
applyTheme(useThemeStore.getState().isDark)
useThemeStore.subscribe((state) => applyTheme(state.isDark))
