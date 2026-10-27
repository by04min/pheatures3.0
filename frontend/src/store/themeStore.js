import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/*
01. THEME STORE
    Remembers the light/dark mode choice across page navigation and refreshes
*/
export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/*
02. APPLY THEME
    Switches the page between light and dark whenever the choice changes
    (makes sure Tailwind's dark: styles override the browser's defaults)
*/
const applyTheme = (isDark) => document.documentElement.classList.toggle('dark', isDark)
applyTheme(useThemeStore.getState().isDark)
useThemeStore.subscribe((state) => applyTheme(state.isDark))
