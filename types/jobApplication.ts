type JobApplication = {
  applied_at: string;
  expires_at?: string;
  company: string;
  link?: string;
  position: string;
  status: number;
  user_id: string;
}

export type { JobApplication };