import type { JobApplication } from '../types';

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
  // Return success if the request was successful.
  return result.success;
};
// This function updates the status of a job application record.
export const statusUpdate = async (jobId: string, status: number): Promise<JobApplication> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await fetch(`${apiUrl}/job_applications/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.message || 'Failed to update job application status');
  }
  const result = await response.json();
  return result.data;
};

// This function deletes a job application record.
export const deleteJobApplication = async (jobId: string): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await fetch(`${apiUrl}/job_applications/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.message || 'Failed to delete job application');
  }
};

// This function fetches data from the /jobs endpoint and returns the response as JSON.
export const fetchData = async (): Promise<any> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await fetch(`${apiUrl}/jobs`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.message || 'Failed to fetch data');
  }
  return response.json();
};
