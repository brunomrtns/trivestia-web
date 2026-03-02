import { apiTenant } from '../api/apiTenant';
import type {
  DashboardContinueDTO,
  DashboardLabSummaryDTO,
  DashboardGoalsDTO,
  UpdateGoalRequest,
  UpdateGoalResponse
} from '@/types/api';

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
      .then((r) => r.data),

  /** GET /t/:slug/dashboard/goals */
  getGoals: (slug: string) =>
    apiTenant(slug)
      .get<DashboardGoalsDTO>('/dashboard/goals')
      .then((r) => r.data),

  /** PATCH /t/:slug/dashboard/goals */
  updateGoal: (slug: string, data: UpdateGoalRequest) =>
    apiTenant(slug)
      .patch<UpdateGoalResponse>('/dashboard/goals', data)
      .then((r) => r.data)
};
