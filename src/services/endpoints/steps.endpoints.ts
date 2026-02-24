import { apiClient } from '../api/client';
import type {
  LessonTimelineDTO,
  LessonStepDTO,
  CreateStepDTO,
  UpdateStepDTO,
  ReorderStepsDTO
} from '@/types/api';

// ─── Student (Bearer) ────────────────────────────────────────────────────────

export const stepsEndpoints = {
  /** GET /lessons/:lessonId/timeline */
  getTimeline: (lessonId: string) =>
    apiClient
      .get<LessonTimelineDTO>(`/lessons/${lessonId}/timeline`)
      .then((r) => r.data),

  /** POST /lessons/:lessonId/steps/:stepId/view */
  markViewed: (lessonId: string, stepId: string) =>
    apiClient
      .post<{ success: boolean }>(`/lessons/${lessonId}/steps/${stepId}/view`)
      .then((r) => r.data),

  // ─── Admin (ADMIN Bearer) ──────────────────────────────────────────────────

  /** POST /lessons/:lessonId/steps */
  createStep: (lessonId: string, data: CreateStepDTO) =>
    apiClient
      .post<LessonStepDTO>(`/lessons/${lessonId}/steps`, data)
      .then((r) => r.data),

  /** PATCH /lessons/:lessonId/steps/:stepId */
  updateStep: (lessonId: string, stepId: string, data: UpdateStepDTO) =>
    apiClient
      .patch<LessonStepDTO>(`/lessons/${lessonId}/steps/${stepId}`, data)
      .then((r) => r.data),

  /** DELETE /lessons/:lessonId/steps/:stepId */
  deleteStep: (lessonId: string, stepId: string) =>
    apiClient.delete(`/lessons/${lessonId}/steps/${stepId}`),

  /** PATCH /lessons/:lessonId/steps/reorder */
  reorderSteps: (lessonId: string, data: ReorderStepsDTO) =>
    apiClient
      .patch<{ success: boolean }>(`/lessons/${lessonId}/steps/reorder`, data)
      .then((r) => r.data),

  /** POST /lessons/:lessonId/steps/generate */
  generateSteps: (lessonId: string) =>
    apiClient
      .post<LessonStepDTO[]>(`/lessons/${lessonId}/steps/generate`)
      .then((r) => r.data)
};
