type SignupFormData = {
  email: string;
  password: string;
  passwordConfirm?: string;
}

type LoginFormData = {
  email: string;
  password: string;
}

type JobApplication = {
  id: string;
  position: string;
  company: string;
  applied_at: string;
  link?: string; // link can be undefined
  expires_at?: string; // expires_at can be undefined
  status: number;
};

export type { SignupFormData, LoginFormData, JobApplication };