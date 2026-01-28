import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const BusinessContext = createContext(null);
const STORAGE_KEY = 'bizvibe.businessId';

export const BusinessProvider = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    localStorage.getItem(STORAGE_KEY) || null
  );

  const refreshBusinesses = async () => {
    if (!user) {
      setBusinesses([]);
      return;
    }
    const { data } = await api.get('/businesses');
    const list = data.businesses || [];
    setBusinesses(list);
    const currentExists = list.some((item) => item.id === selectedBusinessId);
    if ((!selectedBusinessId || !currentExists) && list[0]) {
      setSelectedBusinessId(list[0].id);
    }
  };

  useEffect(() => {
    if (user) {
      refreshBusinesses();
    } else {
      setBusinesses([]);
      setSelectedBusinessId(null);
    }
  }, [user]);

  useEffect(() => {
    if (selectedBusinessId) {
      localStorage.setItem(STORAGE_KEY, selectedBusinessId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedBusinessId]);

  const createBusiness = async (payload) => {
    const { data } = await api.post('/businesses', payload);
    await refreshBusinesses();
    setSelectedBusinessId(data.business.id);
    return data.business;
  };

  const value = useMemo(() => {
    const selectedBusiness = businesses.find((item) => item.id === selectedBusinessId) || null;
    return {
      businesses,
      selectedBusiness,
      selectedBusinessId,
      setSelectedBusinessId,
      refreshBusinesses,
      createBusiness
    };
  }, [businesses, selectedBusinessId]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider');
  }
  return context;
};
