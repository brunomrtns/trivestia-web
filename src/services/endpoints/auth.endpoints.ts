import { apiTenant } from '../api/apiTenant';
import type { User } from '@/types/api';

// BI Identity SSO — login/register/refresh are handled by the Identity Service
// at /id/. Trivestia only exposes /me (current user) and /sso-redirect.
//
// GET  /t/:slug/auth/me          — current user profile (cookie auth)
// GET  /t/:slug/auth/sso-redirect — redirect to /id/login
export const authEndpoints = {
  getMe: (slug: string) =>
    apiTenant(slug)
      .get<User>('/auth/me')
      .then((r) => r.data),
};
