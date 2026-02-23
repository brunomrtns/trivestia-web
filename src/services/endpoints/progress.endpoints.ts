import { apiClient } from '../api/client';
import type {
  Progress,
  SubmissionResult,
  SubmissionResponse,
  SubmitActivityRequest
} from '@/types/api';

// POST /submissions           — Bearer ANY
// GET  /submissions/:id       — Bearer ANY
// GET  /progress              — Bearer ANY
// GET  /progress/lessons/:id  — Bearer ANY
// GET  /progress/lessons/:id/unlocked — Bearer ANY
export const progressEndpoints = {
  submit: (data: SubmitActivityRequest) =>
    apiClient.post<SubmissionResult>('/submissions', data).then((r) => r.data),

  getSubmission: (activityId: string) =>
    apiClient
      .get<SubmissionResponse>(`/submissions/${activityId}`)
      .then((r) => r.data),

  getProgress: () => apiClient.get<Progress[]>('/progress').then((r) => r.data),

  getLessonProgress: (lessonId: string) =>
    apiClient
      .get<Progress>(`/progress/lessons/${lessonId}`)
      .then((r) => r.data),

  isLessonUnlocked: (lessonId: string) =>
    apiClient
      .get<{ unlocked: boolean }>(`/progress/lessons/${lessonId}/unlocked`)
      .then((r) => r.data)
};
