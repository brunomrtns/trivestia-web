import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios';
import { authStorage } from '@/features/auth/storage';

const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3333'
  : 'https://trademaster-api.vercel.app';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// ─── Request interceptor: injeta Bearer token ─────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: refresh automático em 401 ─────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const originalRequest = error.config as RetryConfig;

    // Não tentar refresh em rotas de auth
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      isAuthRoute
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken
      });

      authStorage.setSession(
        data.token,
        data.refreshToken,
        authStorage.getUser() ?? ''
      );

      processQueue(null, data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return apiClient(originalRequest);
    } catch (err) {
      processQueue(err, null);
      // Falha irreversível: limpar sessão e redirecionar
      authStorage.clearSession();
      // queryClient.clear() é chamado no App via listener de storage
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
