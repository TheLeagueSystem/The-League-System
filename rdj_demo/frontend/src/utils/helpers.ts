// Type definitions for common interfaces
export interface Theme {
  id: number;
  name: string;
  description?: string;
}

export interface Motion {
  id: number;
  theme: Theme | string;
  theme_name?: string;
  text: string;
  created_at: string;
  competition_type: string;
}

/**
 * Parse API response for motions
 */
export interface ApiTheme {
  id: number;
  name: string;
  description?: string;
}

export interface ApiMotion {
  id: number;
  theme: ApiTheme | string;
  theme_name?: string;
  text: string;
  created_at: string;
  competition_type: string;
}

/**
 * Parses motion data from various API response formats
 * @param data API response that may contain motions in different formats
 * @returns Normalized array of Motion objects
 */
export const parseMotionsFromResponse = (data: any): ApiMotion[] => {
  // Case 1: Direct array of motions
  if (Array.isArray(data)) {
    return data;
  } 
  // Case 2: Object with motions property containing array
  else if (data && data.motions && Array.isArray(data.motions)) {
    return data.motions;
  } 
  // Case 3: Object with single motion
  else if (data && data.id && data.text) {
    return [data];
  }
  // Default: Empty array
  else {
    console.warn("Unexpected motions response format:", data);
    return [];
  }
};

/**
 * Extracts unique themes from motions
 * @param motions Array of motion objects
 * @returns Array of unique Theme objects
 */
export const extractUniqueThemes = (motions: ApiMotion[]): ApiTheme[] => {
  // Create a Map to store unique themes by name
  const themeMap = new Map<string, ApiTheme>();
  
  motions.forEach(motion => {
    const themeName = typeof motion.theme === 'string' 
      ? motion.theme 
      : motion.theme.name;
    
    const themeId = typeof motion.theme === 'string' 
      ? 0 // Placeholder ID
      : motion.theme.id;
    
    // Only add if not already in map
    if (!themeMap.has(themeName)) {
      themeMap.set(themeName, {
        id: themeId,
        name: themeName
      });
    }
  });
  
  // Convert map values to array
  return Array.from(themeMap.values());
};

/**
 * Format a date string to a more readable format
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Apr 15, 2023")
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateString; // Return original if parsing fails
  }
};