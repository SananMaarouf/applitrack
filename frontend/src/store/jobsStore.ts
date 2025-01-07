import { create }from 'zustand';

export type JobApplication = {
  applied_at: string;
  collectionId: string;
  collectionName: string;
  company: string;
  created: string;
  expires_at: string;
  id: string;
  link: string;
  position: string;
  status: number;
  updated: string;
  user: string;
};

export type JobApplicationsResponse = {
  job_applications: JobApplication[];
};

type JobsStore = {
  jobApplications: JobApplication[];
  setJobs: (jobs: JobApplication[]) => void;
};

export const useJobsStore = create<JobsStore>((set) => ({
  jobApplications: [],
  setJobs: (jobs) => set({ jobApplications: jobs }),
}));