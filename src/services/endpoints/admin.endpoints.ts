import { apiTenant } from '../api/apiTenant';
import type {
  Course,
  Module,
  Lesson,
  Activity,
  ActivityType,
  ActivityReviewPolicy,
  CreateCourseDTO,
  UpdateCourseDTO,
  CreateModuleDTO,
  CreateLessonDTO,
  CreateActivityDTO,
  CreateQuestionDTO,
  CreateStepDTO,
  UpdateStepDTO,
  LessonStepDTO,
  PeriodDTO,
  CreatePeriodRequest,
  UpdatePeriodRequest
} from '@/types/api';

// Todos os endpoints admin exigem Bearer ADMIN
export const adminEndpoints = {
  // ─── Courses ──────────────────────────────────────────────────────────────
  createCourse: (slug: string, data: CreateCourseDTO) =>
    apiTenant(slug)
      .post<Course>('/courses', data)
      .then((r) => r.data),

  updateCourse: (slug: string, id: string, data: UpdateCourseDTO) =>
    apiTenant(slug)
      .patch<Course>(`/courses/${id}`, data)
      .then((r) => r.data),

  deleteCourse: (slug: string, id: string) =>
    apiTenant(slug).delete(`/courses/${id}`),

  // ─── Modules ──────────────────────────────────────────────────────────────
  createModule: (slug: string, courseId: string, data: CreateModuleDTO) =>
    apiTenant(slug)
      .post<Module>(`/courses/${courseId}/modules`, data)
      .then((r) => r.data),

  updateModule: (
    slug: string,
    courseId: string,
    id: string,
    data: Partial<CreateModuleDTO>
  ) =>
    apiTenant(slug)
      .patch<Module>(`/courses/${courseId}/modules/${id}`, data)
      .then((r) => r.data),

  deleteModule: (slug: string, courseId: string, id: string) =>
    apiTenant(slug).delete(`/courses/${courseId}/modules/${id}`),

  reorderModules: (
    slug: string,
    courseId: string,
    orders: { moduleId: string; order: number }[]
  ) =>
    apiTenant(slug)
      .patch(`/courses/${courseId}/modules/reorder`, { orders })
      .then((r) => r.data),

  // ─── Lessons ──────────────────────────────────────────────────────────────
  createLesson: (slug: string, moduleId: string, data: CreateLessonDTO) =>
    apiTenant(slug)
      .post<Lesson>(`/modules/${moduleId}/lessons`, data)
      .then((r) => r.data),

  updateLesson: (
    slug: string,
    moduleId: string,
    id: string,
    data: Partial<CreateLessonDTO>
  ) =>
    apiTenant(slug)
      .patch<Lesson>(`/modules/${moduleId}/lessons/${id}`, data)
      .then((r) => r.data),

  deleteLesson: (slug: string, moduleId: string, id: string) =>
    apiTenant(slug).delete(`/modules/${moduleId}/lessons/${id}`),

  reorderLessons: (
    slug: string,
    moduleId: string,
    orders: { lessonId: string; order: number }[]
  ) =>
    apiTenant(slug)
      .patch(`/modules/${moduleId}/lessons/reorder`, { orders })
      .then((r) => r.data),

  // ─── Activities ───────────────────────────────────────────────────────────
  createActivity: (slug: string, lessonId: string, data: CreateActivityDTO) =>
    apiTenant(slug)
      .post<Activity>(`/lessons/${lessonId}/activities`, data)
      .then((r) => r.data),

  updateActivity: (
    slug: string,
    lessonId: string,
    id: string,
    data: Partial<{
      title: string;
      order: number;
      type: ActivityType;
      reviewPolicy: ActivityReviewPolicy;
      reviewAfterDate: string | null;
    }>
  ) =>
    apiTenant(slug)
      .patch<Activity>(`/lessons/${lessonId}/activities/${id}`, data)
      .then((r) => r.data),

  deleteActivity: (slug: string, lessonId: string, id: string) =>
    apiTenant(slug).delete(`/lessons/${lessonId}/activities/${id}`),

  // ─── Questions ────────────────────────────────────────────────────────────
  getQuestions: (slug: string, activityId: string) =>
    apiTenant(slug)
      .get(`/activities/${activityId}/questions`)
      .then((r) => r.data),

  createQuestion: (slug: string, activityId: string, data: CreateQuestionDTO) =>
    apiTenant(slug)
      .post(`/activities/${activityId}/questions`, data)
      .then((r) => r.data),

  updateQuestion: (
    slug: string,
    activityId: string,
    id: string,
    data: Partial<CreateQuestionDTO>
  ) =>
    apiTenant(slug)
      .patch(`/activities/${activityId}/questions/${id}`, data)
      .then((r) => r.data),

  deleteQuestion: (slug: string, activityId: string, id: string) =>
    apiTenant(slug).delete(`/activities/${activityId}/questions/${id}`),

  // ─── Lesson Steps ─────────────────────────────────────────────────────────
  createStep: (slug: string, lessonId: string, data: CreateStepDTO) =>
    apiTenant(slug)
      .post<LessonStepDTO>(`/lessons/${lessonId}/steps`, data)
      .then((r) => r.data),

  updateStep: (slug: string, lessonId: string, stepId: string, data: UpdateStepDTO) =>
    apiTenant(slug)
      .patch<LessonStepDTO>(`/lessons/${lessonId}/steps/${stepId}`, data)
      .then((r) => r.data),

  deleteStep: (slug: string, lessonId: string, stepId: string) =>
    apiTenant(slug).delete(`/lessons/${lessonId}/steps/${stepId}`),

  reorderSteps: (slug: string, lessonId: string, orders: { stepId: string; order: number }[]) =>
    apiTenant(slug)
      .patch(`/lessons/${lessonId}/steps/reorder`, { orders })
      .then((r) => r.data),

  generateSteps: (slug: string, lessonId: string) =>
    apiTenant(slug)
      .post(`/lessons/${lessonId}/steps/generate`)
      .then((r) => r.data),

  // ─── Upload ─────────────────────────────────────────────────
  uploadQuestionImage: (slug: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return apiTenant(slug)
      .post<{ url: string }>('/upload/question-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((r) => r.data.url);
  },

  // ─── Períodos Avaliativos ──────────────────────────────────
  listPeriods: (slug: string, courseId: string) =>
    apiTenant(slug)
      .get<PeriodDTO[]>(`/courses/${courseId}/periods`)
      .then((r) => r.data),

  createPeriod: (slug: string, courseId: string, data: CreatePeriodRequest) =>
    apiTenant(slug)
      .post<PeriodDTO>(`/courses/${courseId}/periods`, data)
      .then((r) => r.data),

  updatePeriod: (slug: string, courseId: string, id: string, data: UpdatePeriodRequest) =>
    apiTenant(slug)
      .patch<PeriodDTO>(`/courses/${courseId}/periods/${id}`, data)
      .then((r) => r.data),

  deletePeriod: (slug: string, courseId: string, id: string) =>
    apiTenant(slug).delete(`/courses/${courseId}/periods/${id}`)
};
