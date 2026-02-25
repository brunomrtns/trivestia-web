import { apiTenant } from '../api/apiTenant';
import type { AuthResponse, RefreshResponse, User } from '@/types/api';

// POST /t/:slug/auth/register
// POST /t/:slug/auth/login
// POST /t/:slug/auth/refresh
// GET  /t/:slug/auth/me
export const authEndpoints = {
  register: (
    slug: string,
    data: { name: string; email: string; password: string }
  ) =>
    apiTenant(slug)
      .post<AuthResponse>('/auth/register', data)
      .then((r) => r.data),

  login: (slug: string, data: { email: string; password: string }) =>
    apiTenant(slug)
      .post<AuthResponse>('/auth/login', data)
      .then((r) => r.data),

  refresh: (slug: string, refreshToken: string) =>
    apiTenant(slug)
      .post<RefreshResponse>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  getMe: (slug: string) =>
    apiTenant(slug)
      .get<User>('/auth/me')
      .then((r) => r.data)
};
