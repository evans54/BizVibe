import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearStoredTokens, getStoredTokens, setStoredTokens } from '../services/api';

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) {
    return null;
  }
  return {
    ...user,
    mfaEnabled: user.mfaEnabled ?? user.mfa_enabled ?? false
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const bootstrap = async () => {
    const stored = getStoredTokens();
    if (!stored?.accessToken) {
      setInitializing(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(normalizeUser(data.user));
    } catch (error) {
      try {
        const { data } = await api.post('/auth/refresh', { refreshToken: stored.refreshToken });
        setStoredTokens(data);
        const me = await api.get('/auth/me');
        setUser(normalizeUser(me.data.user));
      } catch (refreshError) {
        clearStoredTokens();
        setUser(null);
      }
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const login = async (payload) => {
    const { data } = await api.post('/auth/login', payload);
    setStoredTokens(data);
    setUser(normalizeUser(data.user));
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setStoredTokens(data);
    setUser(normalizeUser(data.user));
    return data;
  };

  const logout = async () => {
    const stored = getStoredTokens();
    if (stored?.refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken: stored.refreshToken });
      } catch (error) {
        // ignore
      }
    }
    clearStoredTokens();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => normalizeUser({ ...prev, ...updates }));
  };

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      register,
      logout,
      updateUser
    }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
