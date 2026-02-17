import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  userId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<RegisterResponse>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Token exists, try to validate it and get user info
        const userData: any = await authService.validateToken(token);
        if (userData) {
          // Map backend user data to our User interface
          const userObj = {
            id: userData.id,
            email: userData.email,
            name: userData.username || userData.firstName || userData.email,
            role: userData.role || 'User',
            companyId: userData.companyId
          };

          // If user doesn't have a company, ensure one is created
          if (!userObj.companyId && (userData.role === 'Company' || userData.role === 'Admin')) {
            try {
              const companyResponse = await authService.ensureCompany();
              if (companyResponse.companyId) {
                userObj.companyId = companyResponse.companyId;
              }
            } catch (error) {
              console.error('Failed to ensure company:', error);
            }
          }

          setUser(userObj);
        }
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      // Only remove token if we got an authentication error
      if (error?.response?.status === 401) {
        localStorage.removeItem('token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response: any = await authService.login(email, password);
      // The backend returns the token and user data
      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      // Map the user data from backend response
      const userData: any = response.user || response;
      const userObj = {
        id: userData.id,
        email: userData.email,
        name: userData.username || userData.firstName || userData.email,
        role: userData.role || 'User',
        companyId: userData.companyId
      };

      // If user doesn't have a company, ensure one is created
      if (!userObj.companyId && (userData.role === 'Company' || userData.role === 'Admin')) {
        try {
          const companyResponse = await authService.ensureCompany();
          if (companyResponse.companyId) {
            userObj.companyId = companyResponse.companyId;
          }
        } catch (error) {
          console.error('Failed to ensure company:', error);
        }
      }

      setUser(userObj);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const register = async (data: any): Promise<RegisterResponse> => {
    try {
      const response = await authService.register(data);
      // Registration successful but no token yet (email verification required)
      return response as RegisterResponse;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};