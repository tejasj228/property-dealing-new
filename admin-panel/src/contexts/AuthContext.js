import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Configure axios to include token in all requests
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});


// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(async () => {
    try {
      // Notify backend about logout (optional)
      if (localStorage.getItem('adminToken')) {
        await api.post('/auth/logout').catch(() => {
          // Ignore errors for logout
        });
      }
    } finally {
      // Clear local storage and state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      console.log('🚪 Admin logged out');
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    async function restoreSession() {
      const token = localStorage.getItem('adminToken'), savedUser = localStorage.getItem('adminUser');
      if (!token || !savedUser) { setLoading(false); return; }
      try {
        const response = await api.post('/auth/verify');
        if (disposed) return;
        if (response.data.success) { setIsAuthenticated(true); setUser(JSON.parse(savedUser)); }
        else await logout();
      } catch { if (!disposed) await logout(); }
      finally { if (!disposed) setLoading(false); }
    }
    restoreSession();
    return () => { disposed = true; };
  }, [logout]);

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, admin } = response.data.data;
        
        // Store token and user info
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(admin));
        
        setIsAuthenticated(true);
        setUser(admin);
        
        console.log('✅ Admin login successful');
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };


  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout,
    api // Export configured axios instance
  };

  return (
    <AuthContext.Provider value={value}>
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