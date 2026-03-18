import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios';
import { authStorage } from '@/features/auth/storage';

const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3333'
  : window.location.hostname === 'trivestia.vercel.app'
    ? 'https://trademaster-api.vercel.app'
    : `${window.location.origin}/trivestia/api`;

/**
 * Factory: cria instancia Axios com baseURL /t/{slug}.
 * Cada pagina chama apiTenant(slug) e usa a instancia retornada.
 * Refresh automatico redireciona para /t/{slug}/login em caso de falha.
 */
const instanceCache = new Map<string, AxiosInstance>();

export function apiTenant(slug: string) {
  let instance = instanceCache.get(slug);
  
  if (!instance) {
    instance = axios.create({
      baseURL: `${BASE_URL}/t/${slug}`,
      timeout: 60000, // Aumentado para suportar uploads grandes
      headers: { 'Content-Type': 'application/json' }
    });

    // Request interceptor: inject Bearer token
    instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = authStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: refresh automatico em 401
    let isRefreshing = false;
    let failedQueue: Array<{
      resolve: (token: string) => void;
      reject: (err: unknown) => void;
    }> = [];

    const processQueue = (error: unknown, token: string | null) => {
      failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
      failedQueue = [];
    };

    instance.interceptors.response.use(
      (res: AxiosResponse) => res,
      async (error) => {
        const originalRequest = error.config as any;

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
            return instance!(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const hadSession = !!authStorage.getToken();

        try {
          const refreshToken = authStorage.getRefreshToken();
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await axios.post(
            `${BASE_URL}/t/${slug}/auth/refresh`,
            { refreshToken }
          );

          const currentUser = authStorage.getUser();
          authStorage.setSession(
            data.token,
            data.refreshToken,
            currentUser ?? ''
          );

          processQueue(null, data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return instance!(originalRequest);
        } catch (err) {
          processQueue(err, null);
          authStorage.clearSession();
          if (hadSession) {
            window.location.href = `/t/${slug}/login`;
          }
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    );

    instanceCache.set(slug, instance);
  }

  return {
    ...instance,
    get: instance.get.bind(instance),
    post: instance.post.bind(instance),
    put: instance.put.bind(instance),
    patch: instance.patch.bind(instance),
    delete: instance.delete.bind(instance),
    /**
     * Helper para upload de arquivos com progresso.
     */
    async upload<T>(
      url: string,
      file: File,
      category: string,
      onProgress?: (pct: number) => void
    ) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      return instance!.post<T>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });
    }
  };
}

/**
 * Axios global (sem slug) para rotas /tenants/*.
 */
export const apiGlobal = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

apiGlobal.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Axios para rotas de plataforma (/platform/*, /auth/resolve).
 * Injeta o token de plataforma (localStorage @tm:plt:token) separado do token de tenant.
 */
export const apiPlatform = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

apiPlatform.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Leitura direta para evitar dependência circular com o store Zustand
  const token = localStorage.getItem('@tm:plt:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiPlatform.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('@tm:plt:refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${BASE_URL}/platform/auth/refresh`,
            { refreshToken }
          );
          localStorage.setItem('@tm:plt:token', data.token);
          localStorage.setItem('@tm:plt:refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return apiPlatform(error.config);
        } catch {
          localStorage.removeItem('@tm:plt:token');
          localStorage.removeItem('@tm:plt:refreshToken');
          localStorage.removeItem('@tm:plt:user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
