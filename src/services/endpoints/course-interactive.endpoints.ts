import { apiClient } from '../api/client';
import type { CourseInteractiveDTO } from '@/types/api';

export const courseInteractiveEndpoints = {
  /** GET /courses/:courseId/interactive */
  getCourseInteractive: (courseId: string) =>
    apiClient
      .get<CourseInteractiveDTO>(`/courses/${courseId}/interactive`)
      .then((r) => r.data)
};
