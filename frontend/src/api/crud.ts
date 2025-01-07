import type { ApplicationForm, JobApplication } from '../types';

// Create a new job application record.
export const createApplication = async (formData: ApplicationForm): Promise<any> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  // Make a POST request to the /createJobApplication endpoint with the post data.
  const response = await fetch(`${apiUrl}/createJobApplication`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });
  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(errorResponse.message);
  }
  return response.json();
};

// Fetch data from the /jobs endpoint.
export const fetchData = async (): Promise<JobApplication[]> => {
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

// Update the status of a job application record.
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
  return response.json();
};

// Delete a job application record.
export const deleteApplication = async (jobId: string): Promise<void> => {
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