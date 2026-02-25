import { apiTenant } from '../api/apiTenant';
import type { CourseInteractiveDTO } from '@/types/api';

export const courseInteractiveEndpoints = {
  /** GET /courses/:courseId/interactive */
  getCourseInteractive: (slug: string, courseId: string) =>
    apiTenant(slug)
      .get<CourseInteractiveDTO>(`/courses/${courseId}/interactive`)
      .then((r) => r.data)
};
