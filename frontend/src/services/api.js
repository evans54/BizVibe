import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const STORAGE_KEY = 'bizvibe.auth';

export const getStoredTokens = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const setStoredTokens = (payload) => {
  if (!payload) {
    return;
  }
  const { accessToken, refreshToken, expiresAt } = payload;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ accessToken, refreshToken, expiresAt })
  );
};

export const clearStoredTokens = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const stored = getStoredTokens();
  if (stored?.accessToken) {
    config.headers.Authorization = `Bearer ${stored.accessToken}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthError = error.response?.status === 401;
    const stored = getStoredTokens();

    if (
      isAuthError &&
      stored?.refreshToken &&
      !originalRequest.__isRetryRequest &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest.__isRetryRequest = true;
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/refresh`, { refreshToken: stored.refreshToken })
          .then((response) => {
            setStoredTokens(response.data);
            refreshPromise = null;
            return response.data;
          })
          .catch((refreshError) => {
            refreshPromise = null;
            clearStoredTokens();
            return Promise.reject(refreshError);
          });
      }

      try {
        const refreshed = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
