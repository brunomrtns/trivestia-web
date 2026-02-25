import { apiGlobal, apiPlatform } from '../api/apiTenant';
import type {
  ResolveEmailResponse,
  PlatformAuthResponse,
  PlatformMeResponse,
  CreatePlatformTenantData,
  PlatformTenantCreatedResponse,
  AuthResponse
} from '@/types/api';

export const platformEndpoints = {
  /** POST /auth/resolve */
  resolve: (email: string) =>
    apiGlobal
      .post<ResolveEmailResponse>('/auth/resolve', { email })
      .then((r) => r.data),

  /** POST /platform/auth/register */
  register: (data: { name: string; email: string; password: string }) =>
    apiPlatform
      .post<PlatformAuthResponse>('/platform/auth/register', data)
      .then((r) => r.data),

  /** POST /platform/auth/login */
  login: (data: { email: string; password: string }) =>
    apiPlatform
      .post<PlatformAuthResponse>('/platform/auth/login', data)
      .then((r) => r.data),

  /** POST /platform/auth/tenant-session — gera token de tenant sem nova senha */
  autoTenantSession: () =>
    apiPlatform
      .post<
        AuthResponse & { tenantSlug: string }
      >('/platform/auth/tenant-session')
      .then((r) => r.data),

  /** GET /platform/me */
  me: () =>
    apiPlatform.get<PlatformMeResponse>('/platform/me').then((r) => r.data),

  /** POST /platform/tenants */
  createTenant: (data: CreatePlatformTenantData) =>
    apiPlatform
      .post<PlatformTenantCreatedResponse>('/platform/tenants', data)
      .then((r) => r.data)
};
