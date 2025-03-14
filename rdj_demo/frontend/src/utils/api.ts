import { apiConfig } from '../config/apiConfig';

// API helper functions
export const getApiBaseUrl = () => {
  return apiConfig.baseURL + '/api';
};

// The function should be exported like this:
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  // Normalize the endpoint path
  let normalizedEndpoint = endpoint;
  
  // Ensure endpoint starts with /
  if (!normalizedEndpoint.startsWith('/')) {
    normalizedEndpoint = `/${normalizedEndpoint}`;
  }
  
  // Make sure endpoint starts with /api/ unless it already does
  if (!normalizedEndpoint.startsWith('/api/')) {
    normalizedEndpoint = `/api${normalizedEndpoint}`;
  }
  
  // Construct the full URL
  const url = `${apiConfig.baseURL}${normalizedEndpoint}`;
  
  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  
  // Set up authentication headers
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };
  
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  // Make the request
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `Server returned ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `Server returned ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};