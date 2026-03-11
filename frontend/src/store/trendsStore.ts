import { create } from 'zustand'
import type { DashboardTrends, TrendPeriod } from '@/types/jobApplication'

type TrendsStore = {
  trends: DashboardTrends | null
  period: TrendPeriod
  isLoading: boolean
  setTrends: (trends: DashboardTrends) => void
  setPeriod: (period: TrendPeriod) => void
  setLoading: (loading: boolean) => void
}

export const useTrendsStore = create<TrendsStore>((set) => ({
  trends: null,
  period: 'week',
  isLoading: false,
  setTrends: (trends) => set({ trends }),
  setPeriod: (period) => set({ period }),
  setLoading: (isLoading) => set({ isLoading }),
}))
