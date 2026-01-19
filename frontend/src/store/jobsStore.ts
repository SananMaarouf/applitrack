import { create } from 'zustand'
import type { JobApplication } from '@/types/jobApplication'

type JobsStore = {
  jobApplications: JobApplication[]
  setJobs: (jobs: JobApplication[]) => void
}

export const useJobsStore = create<JobsStore>((set) => ({
  jobApplications: [],
  setJobs: (jobs) => set({ jobApplications: jobs }),
}))
