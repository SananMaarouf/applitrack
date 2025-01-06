interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest extends LoginRequest {
  passwordConfirm: string;
}

type PostData = {
  id: string;
  createdby: string;
  created: string;
  updated: string;
}

export { LoginRequest, SignupRequest, PostData };