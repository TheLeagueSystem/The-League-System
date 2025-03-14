import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWithAuth } from '../utils/api';

// Define the User interface
interface UserData {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string;
  loading: boolean;
}

// Define the context type
interface UserContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}

// Create the context with initial values
const UserContext = createContext<UserContextType | undefined>(undefined);

// Define the provider props type
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData>({
    isAuthenticated: !!localStorage.getItem("token"),
    isAdmin: localStorage.getItem("is_admin") === "true",
    username: localStorage.getItem("username") || "",
    loading: true
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user.isAuthenticated) return;
      
      try {
        const userData = await fetchWithAuth('/users/me/');
        const isAdmin = userData.is_staff || userData.is_superuser;
        
        localStorage.setItem("is_admin", isAdmin.toString());
        localStorage.setItem("username", userData.username);
        
        setUser({
          isAuthenticated: true,
          isAdmin,
          username: userData.username,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        setUser(prev => ({ ...prev, loading: false }));
      }
    };
    
    fetchUserData();
  }, [user.isAuthenticated]);

  // Provide the user data and setter function
  const contextValue: UserContextType = {
    ...user,
    setUser
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};