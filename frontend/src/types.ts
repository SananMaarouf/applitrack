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
  applied_at?: string;
  collectionId?: string;
  collectionName?: string;
  company: string;
  created?: string;
  expires_at?: string;
  id: string;
  link?: string;
  position: string;
  status: number;
  updated?: string;
  user?: string;
}

type ApplicationForm = {
  user: string;
  position: string;
  company: string;
  applied_at?: string;
  expires_at?: string;
  link?: string;
}


export type { SignupFormData, LoginFormData, JobApplication, ApplicationForm };