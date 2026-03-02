import { apiTenant } from '../api/apiTenant';
import type { DashboardContinueDTO, DashboardLabSummaryDTO } from '@/types/api';

export const dashboardEndpoints = {
  /** GET /t/:slug/dashboard/continue */
  getContinue: (slug: string) =>
    apiTenant(slug)
      .get<DashboardContinueDTO>('/dashboard/continue')
      .then((r) => r.data),

  /** GET /t/:slug/dashboard/lab-summary */
  getLabSummary: (slug: string) =>
    apiTenant(slug)
      .get<DashboardLabSummaryDTO>('/dashboard/lab-summary')
      .then((r) => r.data)
};
