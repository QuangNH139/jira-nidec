import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(credentials);
      
      // Handle different response structures from the backend
      let token, userData;
      
      if (response.data.data) {
        // Expected structure: response.data.data.token and response.data.data.user
        ({ token, user: userData } = response.data.data);
      } else if ((response.data as any).token && (response.data as any).user) {
        // Alternative structure: response.data.token and response.data.user
        token = (response.data as any).token;
        userData = (response.data as any).user;
      } else {
        throw new Error('Invalid response structure from server');
      }
      
      if (!token || !userData) {
        throw new Error('Missing token or user data in response');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Login successful - message will be shown by Login component
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.error || error.message || 'Login failed' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.register(userData);
      
      // Handle different response structures from the backend
      let token, newUser;
      
      if (response.data.data) {
        // Expected structure: response.data.data.token and response.data.data.user
        ({ token, user: newUser } = response.data.data);
      } else if ((response.data as any).token && (response.data as any).user) {
        // Alternative structure: response.data.token and response.data.user
        token = (response.data as any).token;
        newUser = (response.data as any).user;
      } else {
        throw new Error('Invalid response structure from server');
      }
      
      if (!token || !newUser) {
        throw new Error('Missing token or user data in response');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      // Registration successful - message will be shown by Register component
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.response?.data?.error || error.message || 'Registration failed' };
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Logout completed successfully
  };

  const updateUser = (updatedUser: User): void => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
