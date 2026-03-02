import { apiTenant } from '../api/apiTenant';
import type {
  AnnouncementListDTO,
  AnnouncementAdminListDTO,
  AnnouncementUnreadCountDTO,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  AnnouncementAdminItem
} from '@/types/api';

export const announcementsEndpoints = {
  /** GET /t/:slug/announcements?page=&pageSize= */
  list: (slug: string, page = 1, pageSize = 20) =>
    apiTenant(slug)
      .get<AnnouncementListDTO>('/announcements', { params: { page, pageSize } })
      .then((r) => r.data),

  /** GET /t/:slug/announcements/admin */
  listAdmin: (slug: string, page = 1, pageSize = 20) =>
    apiTenant(slug)
      .get<AnnouncementAdminListDTO>('/announcements/admin', { params: { page, pageSize } })
      .then((r) => r.data),

  /** GET /t/:slug/announcements/unread-count */
  getUnreadCount: (slug: string) =>
    apiTenant(slug)
      .get<AnnouncementUnreadCountDTO>('/announcements/unread-count')
      .then((r) => r.data),

  /** POST /t/:slug/announcements/:id/read */
  markRead: (slug: string, announcementId: string) =>
    apiTenant(slug)
      .post(`/announcements/${announcementId}/read`)
      .then(() => undefined),

  /** POST /t/:slug/announcements/read-all */
  markAllRead: (slug: string) =>
    apiTenant(slug)
      .post<{ marked: number }>('/announcements/read-all')
      .then((r) => r.data),

  /** POST /t/:slug/announcements  (admin) */
  create: (slug: string, data: CreateAnnouncementRequest) =>
    apiTenant(slug)
      .post<AnnouncementAdminItem>('/announcements', data)
      .then((r) => r.data),

  /** PATCH /t/:slug/announcements/:id  (admin) */
  update: (slug: string, id: string, data: UpdateAnnouncementRequest) =>
    apiTenant(slug)
      .patch<AnnouncementAdminItem>(`/announcements/${id}`, data)
      .then((r) => r.data),

  /** DELETE /t/:slug/announcements/:id  (admin) */
  remove: (slug: string, id: string) =>
    apiTenant(slug)
      .delete(`/announcements/${id}`)
      .then(() => undefined)
};
