import { apiConfig } from '../config/apiConfig';

// API helper functions
export const getApiBaseUrl = () => {
  return apiConfig.baseURL + '/api';
};

// The function should be exported like this:
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  // Ensure endpoint starts with a slash but not with '/api' if the baseURL already includes it
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Construct the full URL
  const url = `${apiConfig.baseURL}${normalizedEndpoint}`;
  
  // Set up the headers with authentication
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${localStorage.getItem('token') || ''}`,
    ...options.headers
  };

  // Combine with other options
  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    // Return the parsed JSON response
    return await response.json();
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
};