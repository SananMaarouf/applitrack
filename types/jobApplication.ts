type JobApplication = {
  id: string | number;
  applied_at: string;
  expires_at?: string;
  company: string;
  link?: string;
  position: string;
  status: number;
  user_id: string;
}

type JobApplicationStatusHistory = {
  id: string;
  created_at: string;
  application_id: string;
  user_id: string;
  changed_at: string;
  status: number;
}

interface JobApplicationRow {
    id: number;
    created_at: string;
    user_id: string;
    applied_at: string;
    expires_at?: string | null;
    position: string;
    company: string;
    status: number;
    link?: string;
}


export type { JobApplication, JobApplicationStatusHistory, JobApplicationRow };