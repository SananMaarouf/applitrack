type JobApplication = {
  id: number;
  created_at: string;
  user_id: string;
  applied_at: string;
  expires_at?: string;
  position: string;
  company: string;
  status: number;
  link?: string;
}


type JobApplicationStatusHistory = {
  id: number;
  created_at: string;
  application_id: string;
  user_id: string;
  changed_at: string;
  status: number;
}

export type { JobApplication, JobApplicationStatusHistory };