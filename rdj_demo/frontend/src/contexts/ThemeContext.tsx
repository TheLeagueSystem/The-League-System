import React, { createContext, useState, useContext, useEffect } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  pageTransition: (callback: () => void) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get the theme from localStorage, default to dark
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as Theme) || "dark";
  });

  // Effect to update document class when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove both classes and add the current one
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");
    
    root.classList.add(theme);
    body.classList.add(theme);
    
    // Update CSS variables for the custom colors
    if (theme === 'dark') {
      root.style.setProperty('--primary-bg', '#333333');
      root.style.setProperty('--secondary-bg', '#3A3A3A');
      root.style.setProperty('--primary-text', '#F5F5F5');
    } else {
      root.style.setProperty('--primary-bg', '#FAFAFA');
      root.style.setProperty('--secondary-bg', '#F0F0F0');
      root.style.setProperty('--primary-text', '#333333');
    }
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    // Add brief transition animation
    document.body.classList.add('theme-transition');
    
    // Toggle the theme
    setTheme(prevTheme => prevTheme === "dark" ? "light" : "dark");
    
    // Remove the transition class after animation completes
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
  };

  // Page transition helper function
  const pageTransition = (callback: () => void) => {
    document.body.classList.add('page-transition');
    setTimeout(() => {
      document.body.classList.remove('page-transition');
      callback();
    }, 300);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, pageTransition }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};