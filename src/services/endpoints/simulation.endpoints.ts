import { apiTenant } from '../api/apiTenant';
import type {
  ScenarioPayload,
  SimEvent,
  ChallengeSubmitResponse,
  ChallengeBriefingData,
  PracticeScenarioRequest,
  PracticeScenarioResponse,
  PracticeSubmitResponse,
  PracticeHistoryResponse
} from '@/types/api';

export const simulationEndpoints = {
  /** GET /t/:slug/sim/challenge/:activityId/briefing */
  getChallengeBriefing: (slug: string, activityId: string) =>
    apiTenant(slug)
      .get<ChallengeBriefingData>(`/sim/challenge/${activityId}/briefing`)
      .then((r) => r.data),

  /** GET /t/:slug/sim/challenge/:activityId/scenario */
  getChallengeScenario: (slug: string, activityId: string) =>
    apiTenant(slug)
      .get<ScenarioPayload>(`/sim/challenge/${activityId}/scenario`)
      .then((r) => r.data),

  /** POST /t/:slug/sim/challenge/submit */
  submitChallenge: (
    slug: string,
    body: {
      scenarioToken: string;
      events: SimEvent[];
      clientStateHash: string;
    }
  ) =>
    apiTenant(slug)
      .post<ChallengeSubmitResponse>('/sim/challenge/submit', body)
      .then((r) => r.data),

  /** POST /t/:slug/sim/practice/scenario */
  createPracticeScenario: (slug: string, body: PracticeScenarioRequest) =>
    apiTenant(slug)
      .post<PracticeScenarioResponse>('/sim/practice/scenario', body)
      .then((r) => r.data),

  /** POST /t/:slug/sim/practice/submit */
  submitPractice: (
    slug: string,
    body: {
      scenarioToken: string;
      events: SimEvent[];
      clientStateHash: string;
    }
  ) =>
    apiTenant(slug)
      .post<PracticeSubmitResponse>('/sim/practice/submit', body)
      .then((r) => r.data),

  /** GET /t/:slug/sim/practice/history */
  getPracticeHistory: (slug: string, page = 1, limit = 10) =>
    apiTenant(slug)
      .get<PracticeHistoryResponse>('/sim/practice/history', {
        params: { page, limit }
      })
      .then((r) => r.data)
};
