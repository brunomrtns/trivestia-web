import { apiTenant } from '../api/apiTenant';
import type {
  Course,
  Module,
  Lesson,
  Activity,
  ActivityType,
  CreateCourseDTO,
  UpdateCourseDTO,
  CreateModuleDTO,
  CreateLessonDTO,
  CreateActivityDTO,
  CreateQuestionDTO
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

  // ─── Activities ───────────────────────────────────────────────────────────
  createActivity: (slug: string, lessonId: string, data: CreateActivityDTO) =>
    apiTenant(slug)
      .post<Activity>(`/lessons/${lessonId}/activities`, data)
      .then((r) => r.data),

  updateActivity: (
    slug: string,
    lessonId: string,
    id: string,
    data: Partial<{ title: string; order: number; type: ActivityType }>
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
    apiTenant(slug).delete(`/activities/${activityId}/questions/${id}`)
};
