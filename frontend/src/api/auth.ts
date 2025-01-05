// api/test.ts

export const fetchData = async (endpoint: string): Promise<string> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}${endpoint}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.text();
};

export const handleSignup = async (formData: FormData): Promise<void> => {
  /* get api url  */
  const apiUrl = import.meta.env.VITE_API_URL;
  /* post the formdata */
  const response = await fetch(`${apiUrl}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
};