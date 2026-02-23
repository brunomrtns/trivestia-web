import { apiClient } from '../api/client';
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
  createCourse: (data: CreateCourseDTO) =>
    apiClient.post<Course>('/courses', data).then((r) => r.data),

  updateCourse: (id: string, data: UpdateCourseDTO) =>
    apiClient.patch<Course>(`/courses/${id}`, data).then((r) => r.data),

  deleteCourse: (id: string) => apiClient.delete(`/courses/${id}`),

  // ─── Modules ──────────────────────────────────────────────────────────────
  createModule: (courseId: string, data: CreateModuleDTO) =>
    apiClient
      .post<Module>(`/courses/${courseId}/modules`, data)
      .then((r) => r.data),

  updateModule: (
    courseId: string,
    id: string,
    data: Partial<CreateModuleDTO>
  ) =>
    apiClient
      .patch<Module>(`/courses/${courseId}/modules/${id}`, data)
      .then((r) => r.data),

  deleteModule: (courseId: string, id: string) =>
    apiClient.delete(`/courses/${courseId}/modules/${id}`),

  // ─── Lessons ──────────────────────────────────────────────────────────────
  createLesson: (moduleId: string, data: CreateLessonDTO) =>
    apiClient
      .post<Lesson>(`/modules/${moduleId}/lessons`, data)
      .then((r) => r.data),

  updateLesson: (
    moduleId: string,
    id: string,
    data: Partial<CreateLessonDTO>
  ) =>
    apiClient
      .patch<Lesson>(`/modules/${moduleId}/lessons/${id}`, data)
      .then((r) => r.data),

  deleteLesson: (moduleId: string, id: string) =>
    apiClient.delete(`/modules/${moduleId}/lessons/${id}`),

  // ─── Activities ───────────────────────────────────────────────────────────
  createActivity: (lessonId: string, data: CreateActivityDTO) =>
    apiClient
      .post<Activity>(`/lessons/${lessonId}/activities`, data)
      .then((r) => r.data),

  updateActivity: (
    lessonId: string,
    id: string,
    data: Partial<{ title: string; order: number; type: ActivityType }>
  ) =>
    apiClient
      .patch<Activity>(`/lessons/${lessonId}/activities/${id}`, data)
      .then((r) => r.data),

  deleteActivity: (lessonId: string, id: string) =>
    apiClient.delete(`/lessons/${lessonId}/activities/${id}`),

  // ─── Questions ────────────────────────────────────────────────────────────
  getQuestions: (activityId: string) =>
    apiClient.get(`/activities/${activityId}/questions`).then((r) => r.data),

  createQuestion: (activityId: string, data: CreateQuestionDTO) =>
    apiClient
      .post(`/activities/${activityId}/questions`, data)
      .then((r) => r.data),

  updateQuestion: (
    activityId: string,
    id: string,
    data: Partial<CreateQuestionDTO>
  ) =>
    apiClient
      .patch(`/activities/${activityId}/questions/${id}`, data)
      .then((r) => r.data),

  deleteQuestion: (activityId: string, id: string) =>
    apiClient.delete(`/activities/${activityId}/questions/${id}`)
};
