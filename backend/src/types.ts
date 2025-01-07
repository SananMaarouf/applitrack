interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest extends LoginRequest {
  passwordConfirm: string;
}

type JobApplicationForm = {
  position: string;
  company: string;
  applied_at?: string;
  expires_at?: string;
  link?: string;
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

export { LoginRequest, SignupRequest, JobApplicationForm, JobApplication };