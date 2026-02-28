import { apiTenant } from '../api/apiTenant';
import type { Course, Module, Lesson, Activity, LessonTimelineDTO } from '@/types/api';

export const learningEndpoints = {
  getCourses: (slug: string) =>
    apiTenant(slug)
      .get<Course[]>('/courses')
      .then((r) => r.data),

  getCourse: (slug: string, id: string) =>
    apiTenant(slug)
      .get<Course>(`/courses/${id}`)
      .then((r) => r.data),

  getModules: (slug: string, courseId: string) =>
    apiTenant(slug)
      .get<Module[]>(`/courses/${courseId}/modules`)
      .then((r) => r.data),

  getLessons: (slug: string, moduleId: string) =>
    apiTenant(slug)
      .get<Lesson[]>(`/modules/${moduleId}/lessons`)
      .then((r) => r.data),

  getActivities: (slug: string, lessonId: string) =>
    apiTenant(slug)
      .get<Activity[]>(`/lessons/${lessonId}/activities`)
      .then((r) => r.data),

  getActivity: (slug: string, lessonId: string, activityId: string) =>
    apiTenant(slug)
      .get<Activity>(`/lessons/${lessonId}/activities/${activityId}`)
      .then((r) => r.data),

  getTimeline: (slug: string, lessonId: string) =>
    apiTenant(slug)
      .get<LessonTimelineDTO>(`/lessons/${lessonId}/timeline`)
      .then((r) => r.data)
};
