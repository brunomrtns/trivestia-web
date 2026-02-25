import { apiGlobal } from '../api/apiTenant';
import type {
  TenantCreatedResponse,
  CreateTenantPublicData,
  CreateTenantClaimData
} from '@/types/api';

/** Rotas globais (sem slug): /tenants/* */
export const tenantEndpoints = {
  /** POST /tenants -- cria tenant + owner (publico) */
  createPublic: (data: CreateTenantPublicData) =>
    apiGlobal.post<TenantCreatedResponse>('/tenants', data).then((r) => r.data),

  /** POST /tenants/claim -- cria tenant para user autenticado */
  claim: (data: CreateTenantClaimData) =>
    apiGlobal
      .post<TenantCreatedResponse>('/tenants/claim', data)
      .then((r) => r.data),

  /** GET /tenants/check-slug/:slug */
  checkSlug: (slug: string) =>
    apiGlobal
      .get<{ available: boolean }>(`/tenants/check-slug/${slug}`)
      .then((r) => r.data)
};
