import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthSession } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('ksp_token');
    const storedUser = localStorage.getItem('ksp_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Simulate backend authentication call
      // In production, this would be: await apiClient.post('/api/auth/login', { username, password })
      await new Promise((resolve) => setTimeout(resolve, 800)); // Network delay simulation

      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Check credentials (mocking local check)
      const mockUser: User = {
        id: 'U001',
        name: username === 'suresh' ? 'Suresh Patil' : 'KSP Investigator',
        role: username === 'suresh' ? 'Supervisor' : 'Investigator',
        email: `${username}@karnataka.gov.in`,
        clearance: username === 'suresh' ? 'Clearance: L5' : 'Clearance: L3',
      };

      const mockToken = 'mock_jwt_token_for_ksp_copilot_' + Math.random().toString(36).substring(2);

      localStorage.setItem('ksp_token', mockToken);
      localStorage.setItem('ksp_user', JSON.stringify(mockUser));

      setToken(mockToken);
      setUser(mockUser);
    } catch (err: any) {
      throw new Error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ksp_token');
    localStorage.removeItem('ksp_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
