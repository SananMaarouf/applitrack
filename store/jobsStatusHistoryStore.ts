import { create } from 'zustand';
import type { JobApplicationStatusHistory } from '../types/jobApplication';

export type JobApplicationStatusHistoryResponse = {
  job_application_status_history: JobApplicationStatusHistory[];
};

interface JobsStatusHistoryStore {
  jobApplicationStatusHistory: JobApplicationStatusHistory[];
  setJobApplicationStatusHistory: (statusChanges: JobApplicationStatusHistory[]) => void;
}

export const useStatusHistoryStore = create<JobsStatusHistoryStore>((set) => ({
  jobApplicationStatusHistory: [],
  setJobApplicationStatusHistory: (statusChanges) => set({ jobApplicationStatusHistory: statusChanges }),
}));