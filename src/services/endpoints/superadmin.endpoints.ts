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
  Role,
  Enrollment
} from '@/types/api';

type SuperTenantOffer = {
  id: string;
  title: string;
  type: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION';
  active: boolean;
  billingInterval: 'MONTH' | 'YEAR' | null;
  priceAmount: number | null;
  priceCurrency: string | null;
};

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

  listTenantOffers: (tenantId: string) =>
    apiGlobal
      .get<SuperTenantOffer[]>(`/super/tenants/${tenantId}/offers`)
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

  assignUserLicense: (
    userId: string,
    data: { offerId: string; reason: string; endsAt?: string }
  ) =>
    apiGlobal
      .post<{
        license: Enrollment;
        selfAssignment: boolean;
      }>(`/super/users/${userId}/licenses`, data)
      .then((r) => r.data),

  assignUserPlanLicense: (
    userId: string,
    data: { planId: string; reason: string }
  ) =>
    apiGlobal
      .post<{
        plan: { id: string; name: string; label: string };
        selfAssignment: boolean;
      }>(`/super/users/${userId}/plan-license`, data)
      .then((r) => r.data),

  // ─── Stats ────────────────────────────────────────────────────────────────

  stats: () => apiGlobal.get<PlatformStats>('/super/stats').then((r) => r.data)
};
