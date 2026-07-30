import axios, { type AxiosResponse } from 'axios';
import { authStorage } from '@/features/auth/storage';

const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3333'
  : window.location.hostname === 'trivestia.vercel.app'
    ? 'https://trademaster-api.vercel.app'
    : `${window.location.origin}/trivestia/api`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  // CRITICAL: send BI Identity cookies (bi_auth / bi_refresh) with every request
  withCredentials: true
});

// ─── Response interceptor: redirect to BI Identity login on 401 ──────────────

apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    // 401 → SSO cookie invalid/expired → redirect to BI Identity login
    if (error.response?.status === 401) {
      authStorage.clearSession();
      window.location.href = '/id/login?redirect=/trivestia/';
    }
    return Promise.reject(error);
  }
);
