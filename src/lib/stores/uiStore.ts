import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type TableDensity = 'comfortable' | 'compact'

type UIState = {
  sidebarCollapsed: boolean
  /** Mobile drawer open (md: ignored — desktop uses collapsible rail) */
  mobileNavOpen: boolean
  tableDensity: TableDensity
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void
  toggleMobileNav: () => void
  setTableDensity: (density: TableDensity) => void
}

/** Sidebar chrome only. Theme is owned by next-themes (useTheme). */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      tableDensity: 'comfortable',
      toggleSidebar: () =>
        set((state) => {
          // On narrow viewports, Menu toggles the mobile drawer
          if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            return { mobileNavOpen: !state.mobileNavOpen }
          }
          return { sidebarCollapsed: !state.sidebarCollapsed }
        }),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
      setTableDensity: (density) => set({ tableDensity: density }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        tableDensity: state.tableDensity,
      }),
    }
  )
)