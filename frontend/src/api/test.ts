// api/test.ts

export const fetchData = async (endpoint: string): Promise<string> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}${endpoint}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.text();
};

export const handleLogin = async (formData: FormData): Promise<{ token: string }> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  localStorage.setItem('token', data.token);
  return { token: data.token };
};

export const handleLogout = (): void => {
  localStorage.removeItem('token');
};

export const handleSignup = async (formData: FormData): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/signup`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  // Handle successful signup (e.g., store token, redirect, etc.)
};