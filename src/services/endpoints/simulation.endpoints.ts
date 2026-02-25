import { apiClient } from '../api/client';
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

// ─── Challenge ────────────────────────────────────────────────────────────────

export const simulationEndpoints = {
  /** GET /sim/challenge/:activityId/briefing — Bearer ANY */
  getChallengeBriefing: (activityId: string) =>
    apiClient
      .get<ChallengeBriefingData>(`/sim/challenge/${activityId}/briefing`)
      .then((r) => r.data),

  /** GET /sim/challenge/:activityId/scenario — Bearer ANY */
  getChallengeScenario: (activityId: string) =>
    apiClient
      .get<ScenarioPayload>(`/sim/challenge/${activityId}/scenario`)
      .then((r) => r.data),

  /** POST /sim/challenge/submit — Bearer ANY */
  submitChallenge: (body: {
    scenarioToken: string;
    events: SimEvent[];
    clientStateHash: string;
  }) =>
    apiClient
      .post<ChallengeSubmitResponse>('/sim/challenge/submit', body)
      .then((r) => r.data),

  // ─── Practice ──────────────────────────────────────────────────────────────

  /** POST /sim/practice/scenario — Bearer ANY */
  createPracticeScenario: (body: PracticeScenarioRequest) =>
    apiClient
      .post<PracticeScenarioResponse>('/sim/practice/scenario', body)
      .then((r) => r.data),

  /** POST /sim/practice/submit — Bearer ANY */
  submitPractice: (body: {
    scenarioToken: string;
    events: SimEvent[];
    clientStateHash: string;
  }) =>
    apiClient
      .post<PracticeSubmitResponse>('/sim/practice/submit', body)
      .then((r) => r.data),

  /** GET /sim/practice/history?page=&limit= — Bearer ANY */
  getPracticeHistory: (page = 1, limit = 10) =>
    apiClient
      .get<PracticeHistoryResponse>('/sim/practice/history', {
        params: { page, limit }
      })
      .then((r) => r.data)
};
