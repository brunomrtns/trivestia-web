import { apiTenant } from '../api/apiTenant';
import type {
  Progress,
  SubmissionResult,
  SubmissionResponse,
  SubmitActivityRequest
} from '@/types/api';

export const progressEndpoints = {
  submit: (slug: string, data: SubmitActivityRequest) =>
    apiTenant(slug)
      .post<SubmissionResult>('/submissions', data)
      .then((r) => r.data),

  getSubmission: (slug: string, activityId: string) =>
    apiTenant(slug)
      .get<SubmissionResponse>(`/submissions/${activityId}`)
      .then((r) => r.data),

  getProgress: (slug: string) =>
    apiTenant(slug)
      .get<Progress[]>('/progress')
      .then((r) => r.data),

  getLessonProgress: (slug: string, lessonId: string) =>
    apiTenant(slug)
      .get<Progress>(`/progress/lessons/${lessonId}`)
      .then((r) => r.data),

  isLessonUnlocked: (slug: string, lessonId: string) =>
    apiTenant(slug)
      .get<{ unlocked: boolean }>(`/progress/lessons/${lessonId}/unlocked`)
      .then((r) => r.data)
};
