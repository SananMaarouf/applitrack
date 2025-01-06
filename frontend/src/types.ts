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
  id: number;
  position: string;
  company: string;
  applied_at: string;
  link: string;
  expires_at: string;
  status: number;
};

export type { SignupFormData, LoginFormData, JobApplication };