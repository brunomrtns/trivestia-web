import { apiClient } from '../api/client';
import type {
  PaginatedUsers,
  AdminUserDetail,
  AdminUser,
  ListUsersParams,
  Role
} from '@/types/api';

// GET  /admin/users
// GET  /admin/users/:id
// PATCH /admin/users/:id/role
export const adminUsersEndpoints = {
  listUsers: (params: ListUsersParams = {}) =>
    apiClient
      .get<PaginatedUsers>('/admin/users', { params })
      .then((r) => r.data),

  getUser: (id: string) =>
    apiClient.get<AdminUserDetail>(`/admin/users/${id}`).then((r) => r.data),

  updateRole: (id: string, role: Role) =>
    apiClient
      .patch<AdminUser>(`/admin/users/${id}/role`, { role })
      .then((r) => r.data)
};
