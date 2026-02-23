import { apiClient } from '../api/client';
import type { Course, Module, Lesson, Activity } from '@/types/api';

// GET /courses                        — público
// GET /courses/:id                    — público
// GET /courses/:courseId/modules      — público
// GET /modules/:moduleId/lessons      — público
// GET /lessons/:lessonId/activities   — Bearer ANY
// GET /lessons/:lessonId/activities/:id — Bearer ANY
export const learningEndpoints = {
  getCourses: () => apiClient.get<Course[]>('/courses').then((r) => r.data),

  getCourse: (id: string) =>
    apiClient.get<Course>(`/courses/${id}`).then((r) => r.data),

  getModules: (courseId: string) =>
    apiClient.get<Module[]>(`/courses/${courseId}/modules`).then((r) => r.data),

  getLessons: (moduleId: string) =>
    apiClient.get<Lesson[]>(`/modules/${moduleId}/lessons`).then((r) => r.data),

  getActivities: (lessonId: string) =>
    apiClient
      .get<Activity[]>(`/lessons/${lessonId}/activities`)
      .then((r) => r.data),

  getActivity: (lessonId: string, activityId: string) =>
    apiClient
      .get<Activity>(`/lessons/${lessonId}/activities/${activityId}`)
      .then((r) => r.data)
};
