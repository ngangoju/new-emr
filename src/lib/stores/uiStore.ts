import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UIState = {
  sidebarCollapsed: boolean
  isDarkMode: boolean
  toggleSidebar: () => void
  toggleDarkMode: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      isDarkMode: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleDarkMode: () => {
        const isDarkMode = !get().isDarkMode
        set({ isDarkMode })
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', isDarkMode)
        }
      },
    }),
    {
      name: 'ui-storage',
    }
  )
)