import { apiTenant } from '@/services/api/apiTenant';
import type { UserSettings, UpdateSettingsPayload } from './settings.types';

export const settingsApi = {
  /** GET /t/:slug/settings/me */
  getMe: (slug: string): Promise<UserSettings> =>
    apiTenant(slug)
      .get<UserSettings>('/settings/me')
      .then((r) => r.data),

  /** PATCH /t/:slug/settings/me */
  updateMe: (
    slug: string,
    data: UpdateSettingsPayload
  ): Promise<UserSettings> =>
    apiTenant(slug)
      .patch<UserSettings>('/settings/me', data)
      .then((r) => r.data)
};
