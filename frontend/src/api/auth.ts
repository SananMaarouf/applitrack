// Function that handles user login by sending form data to the login endpoint.
export const handleLogin = async (formData: FormData): Promise<void> => {
  // Get api url from env
  const apiUrl = import.meta.env.VITE_API_URL;

  // Make a POST request to the login endpoint with the form data.
  const response = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  });
};

// This function handles user signup by sending form data to the signup endpoint.
export const handleSignup = async (formData: FormData): Promise<void> => {
  // Retrieve the base API URL from environment variables.
  const apiUrl = import.meta.env.VITE_API_URL;
  // Make a POST request to the /signup endpoint with the form data.
  const response = await fetch(`${apiUrl}/signup`, {
    method: 'POST', // HTTP method
    headers: {
      'Content-Type': 'application/json', // Specify the content type as JSON
    },
    body: JSON.stringify(formData), // Convert form data to JSON string
  });
  // Note: No error handling or response processing is done here.
};

// This function fetches data from a given endpoint and returns the response as a string.
export const fetchData = async (endpoint: string): Promise<string> => {
  // Retrieve the base API URL from environment variables.
  const apiUrl = import.meta.env.VITE_API_URL;
  // Make a GET request to the specified endpoint.
  const response = await fetch(`${apiUrl}${endpoint}`);
  // Check if the response is not ok (status code is not in the range 200-299).
  if (!response.ok) {
    // Throw an error if the network response was not ok.
    throw new Error('Network response was not ok');
  }
  // Return the response text.
  return response.text();
};

// This function creates a new post by sending post data to the createPost endpoint.
export const createPost = async (postData: FormData): Promise<void> => {
  // Retrieve the base API URL from environment variables.
  const apiUrl = import.meta.env.VITE_API_URL;
  // Retrieve the authentication token from local storage.
  const token = localStorage.getItem('authToken');
  // Check if the token is not found.
  if (!token) {
    // Throw an error if no authentication token is found.
    throw new Error('No authentication token found');
  }
  // Make a POST request to the /createPost endpoint with the post data.
  const response = await fetch(`${apiUrl}/createPost`, {
    method: 'POST', // HTTP method
    headers: {
      'Content-Type': 'application/json', // Specify the content type as JSON
      'Authorization': `Bearer ${token}`, // Include the authentication token in the Authorization header
    },
    body: JSON.stringify(postData), // Convert post data to JSON string
  });
  // Check if the response is not ok (status code is not in the range 200-299).
  if (!response.ok) {
    // Throw an error if the request failed.
    throw new Error('Failed to create post');
  }
  // Parse the JSON response.
  const result = await response.json();
  // Log the success message and the result.
  console.log('Post created successfully:', result);
};