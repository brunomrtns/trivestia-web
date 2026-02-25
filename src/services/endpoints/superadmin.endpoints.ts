import { apiGlobal } from '../api/apiTenant';
import type {
  PaginatedSuperTenants,
  SuperTenantDetail,
  SuperTenant,
  CreateTenantSuperData,
  UpdateTenantSuperData,
  PaginatedSuperUsers,
  SuperUser,
  ListSuperTenantsParams,
  ListSuperUsersParams,
  PlatformStats,
  Role
} from '@/types/api';

/** Rotas globais /super/* — requer SUPER_ADMIN */
export const superadminEndpoints = {
  // ─── Tenants ──────────────────────────────────────────────────────────────

  listTenants: (params: ListSuperTenantsParams = {}) =>
    apiGlobal
      .get<PaginatedSuperTenants>('/super/tenants', { params })
      .then((r) => r.data),

  getTenant: (id: string) =>
    apiGlobal
      .get<SuperTenantDetail>(`/super/tenants/${id}`)
      .then((r) => r.data),

  createTenant: (data: CreateTenantSuperData) =>
    apiGlobal
      .post<{
        tenant: SuperTenant;
        owner: SuperUser | null;
      }>('/super/tenants', data)
      .then((r) => r.data),

  updateTenant: (id: string, data: UpdateTenantSuperData) =>
    apiGlobal
      .patch<SuperTenant>(`/super/tenants/${id}`, data)
      .then((r) => r.data),

  // ─── Users ────────────────────────────────────────────────────────────────

  listUsers: (params: ListSuperUsersParams = {}) =>
    apiGlobal
      .get<PaginatedSuperUsers>('/super/users', { params })
      .then((r) => r.data),

  updateUserRole: (id: string, role: Role) =>
    apiGlobal
      .patch<SuperUser>(`/super/users/${id}`, { role })
      .then((r) => r.data),

  // ─── Stats ────────────────────────────────────────────────────────────────

  stats: () => apiGlobal.get<PlatformStats>('/super/stats').then((r) => r.data)
};
