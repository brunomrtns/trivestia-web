import { apiTenant } from '../api/apiTenant';
import type {
  PaginatedUsers,
  AdminUserDetail,
  AdminUser,
  ListUsersParams,
  Role
} from '@/types/api';

export const adminUsersEndpoints = {
  listUsers: (slug: string, params: ListUsersParams = {}) =>
    apiTenant(slug)
      .get<PaginatedUsers>('/admin/users', { params })
      .then((r) => r.data),

  getUser: (slug: string, id: string) =>
    apiTenant(slug)
      .get<AdminUserDetail>(`/admin/users/${id}`)
      .then((r) => r.data),

  updateRole: (slug: string, id: string, role: Role) =>
    apiTenant(slug)
      .patch<AdminUser>(`/admin/users/${id}/role`, { role })
      .then((r) => r.data)
};
