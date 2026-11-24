import { create } from 'zustand'

export type DashboardMode = 'unknown' | 'first-run' | 'regular'

type DashboardModeState = {
  /** Clerk user id the mode belongs to; stale users never leak into the UI. */
  userId: string | null
  mode: DashboardMode
  setMode: (userId: string, mode: DashboardMode) => void
}

/**
 * Shared, user-scoped dashboard mode consumed by the dashboard and both
 * navigation surfaces. `unknown` never hides actions, so a slow/failed list
 * request can never be confused with an empty first-run account.
 */
export const useDashboardModeStore = create<DashboardModeState>((set) => ({
  userId: null,
  mode: 'unknown',
  setMode: (userId, mode) => set({ userId, mode }),
}))

export function useFirstRunNavigation(userId: string | null | undefined): boolean {
  return useDashboardModeStore(
    (state) => Boolean(userId) && state.userId === userId && state.mode === 'first-run',
  )
}
