import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe, loginUser, registerUser, adminLoginUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('manit_token');
      if (token) {
        try {
          const response = await getMe();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('manit_token');
          }
        } catch (error) {
          console.error('Session initialization error:', error.message);
          localStorage.removeItem('manit_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response.success && response.data) {
        localStorage.setItem('manit_token', response.data.token);
        setUser(response.data.user);
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await registerUser(name, email, password);
      if (response.success && response.data) {
        localStorage.setItem('manit_token', response.data.token);
        setUser(response.data.user);
        return response;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, passkey) => {
    setLoading(true);
    try {
      const response = await adminLoginUser(email, passkey);
      if (response.success && response.data) {
        localStorage.setItem('manit_token', response.data.token);
        setUser(response.data.user);
        return response;
      }
      throw new Error(response.message || 'Admin login failed');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('manit_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    adminLogin,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
