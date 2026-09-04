import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../api/client';

export interface User {
  id: number;
  email: string;
  name: string;
  global_role: 'GLOBAL_ADMIN' | 'USER';
  created_at?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PREVIEW_USER: User = {
  id: 999,
  email: 'preview@guest.local',
  name: 'Preview Guest',
  global_role: 'GLOBAL_ADMIN',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(PREVIEW_USER);
  const [token, setToken] = useState<string | null>('preview-mock-token');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Bypass backend auth check for preview mode
  }, []);

  const login = async (email: string, password: string) => {
    return { token: 'preview-mock-token', user: PREVIEW_USER };
  };

  const register = async (name: string, email: string, password: string) => {
    return { token: 'preview-mock-token', user: PREVIEW_USER };
  };

  const logout = () => {
    setUser(PREVIEW_USER);
    setToken('preview-mock-token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: true,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
