import { apiConfig } from '../config/apiConfig';

// API helper functions
export const getApiBaseUrl = () => {
  return apiConfig.baseURL + '/api';
};

// The function should be exported like this:
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("Authentication required. Please log in again.");
  }
  
  // This is correct - keep it this way:
  const url = `${apiConfig.baseURL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Token ${token}`,
    ...(options.headers || {})
  };
  
  try {
    console.log(`Fetching from: ${url}`, { method: options.method || 'GET' });
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    // Check content type before trying to parse as JSON
    const contentType = response.headers.get('content-type');
    
    // Parse response based on content type
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      if (text.length === 0) {
        return null; // Empty response
      }
      try {
        // Try to parse as JSON anyway, in case content type header is wrong
        return JSON.parse(text);
      } catch (e) {
        // Return as text if parsing fails
        return text;
      }
    }
  } catch (error: any) {
    console.error("API Request failed:", error);
    throw error;
  }
};