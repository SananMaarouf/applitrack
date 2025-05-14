import { create } from 'zustand';
import type { AggregatedStatusHistory } from '@/types/jobApplication';

interface AggregatedStatusHistoryStore {
  aggregatedStatusHistory: AggregatedStatusHistory[];
  setAggregatedStatusHistory: (statusChanges: AggregatedStatusHistory[]) => void;
}

export const useAggregatedStatusHistoryStore = create<AggregatedStatusHistoryStore>((set) => ({
  aggregatedStatusHistory: [],
  setAggregatedStatusHistory: (statusChanges) => set({ aggregatedStatusHistory: statusChanges }),
}));