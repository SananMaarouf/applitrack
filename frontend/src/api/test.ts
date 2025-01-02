// api/test.ts
export const fetchData = async (): Promise<string> => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${apiUrl}/`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.text();
};
