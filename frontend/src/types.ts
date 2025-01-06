type FormData = {
  email: string;
  password: string;
  confirmPassword?: string;
}

type JobApplication = {
  id: number;
  position: string;
  company: string;
  applied_at: string;
  link: string;
  expires_at: string;
  status: number;
};

export type { FormData, JobApplication };