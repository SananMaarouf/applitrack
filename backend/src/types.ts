type LoginRequest = {
  email: string;
  password: string;
}

type SignupRequest = {
  email: string;
  password: string;
  passwordConfirm: string;
}

type PostData = {
  id: string;
  createdby: string;
  created: string;
  updated: string;
}

export { LoginRequest, SignupRequest, PostData };