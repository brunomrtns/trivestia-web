import { apiTenant } from '../api/apiTenant';
import type {
  LessonTimelineDTO,
  LessonStepDTO,
  CreateStepDTO,
  UpdateStepDTO,
  ReorderStepsDTO
} from '@/types/api';

export const stepsEndpoints = {
  /** GET /t/:slug/lessons/:lessonId/timeline */
  getTimeline: (slug: string, lessonId: string) =>
    apiTenant(slug)
      .get<LessonTimelineDTO>(`/lessons/${lessonId}/timeline`)
      .then((r) => r.data),

  /** POST /t/:slug/lessons/:lessonId/steps/:stepId/view */
  markViewed: (slug: string, lessonId: string, stepId: string) =>
    apiTenant(slug)
      .post<{ success: boolean }>(`/lessons/${lessonId}/steps/${stepId}/view`)
      .then((r) => r.data),

  /** POST /t/:slug/lessons/:lessonId/steps */
  createStep: (slug: string, lessonId: string, data: CreateStepDTO) =>
    apiTenant(slug)
      .post<LessonStepDTO>(`/lessons/${lessonId}/steps`, data)
      .then((r) => r.data),

  /** PATCH /t/:slug/lessons/:lessonId/steps/:stepId */
  updateStep: (
    slug: string,
    lessonId: string,
    stepId: string,
    data: UpdateStepDTO
  ) =>
    apiTenant(slug)
      .patch<LessonStepDTO>(`/lessons/${lessonId}/steps/${stepId}`, data)
      .then((r) => r.data),

  /** DELETE /t/:slug/lessons/:lessonId/steps/:stepId */
  deleteStep: (slug: string, lessonId: string, stepId: string) =>
    apiTenant(slug).delete(`/lessons/${lessonId}/steps/${stepId}`),

  /** PATCH /t/:slug/lessons/:lessonId/steps/reorder */
  reorderSteps: (slug: string, lessonId: string, data: ReorderStepsDTO) =>
    apiTenant(slug)
      .patch<{ success: boolean }>(`/lessons/${lessonId}/steps/reorder`, data)
      .then((r) => r.data),

  /** POST /t/:slug/lessons/:lessonId/steps/generate */
  generateSteps: (slug: string, lessonId: string) =>
    apiTenant(slug)
      .post<LessonStepDTO[]>(`/lessons/${lessonId}/steps/generate`)
      .then((r) => r.data)
};
