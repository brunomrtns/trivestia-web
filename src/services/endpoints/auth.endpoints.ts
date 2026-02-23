import { apiClient } from '../api/client';
import type { AuthResponse, RefreshResponse, User } from '@/types/api';

// POST /auth/register
// POST /auth/login
// POST /auth/refresh
// GET  /auth/me
export const authEndpoints = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<RefreshResponse>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  getMe: () => apiClient.get<User>('/auth/me').then((r) => r.data)
};
