import { apiTenant } from '../api/apiTenant';
import type {
  CourseGenerationRequest,
  AiCourseAvailability,
} from '@/types/api';

export const aiCourseEndpoints = {
  getAvailability: (slug: string) =>
    apiTenant(slug)
      .get<AiCourseAvailability>('/ai-courses/availability')
      .then((r) => r.data),

  createRequest: (slug: string, briefing: string, includeVideo: boolean = false) =>
    apiTenant(slug)
      .post<CourseGenerationRequest>('/ai-courses', { briefing, includeVideo })
      .then((r) => r.data),

  getRequest: (slug: string, id: string) =>
    apiTenant(slug)
      .get<CourseGenerationRequest>(`/ai-courses/${id}`)
      .then((r) => r.data),

  listRequests: (slug: string) =>
    apiTenant(slug)
      .get<CourseGenerationRequest[]>('/ai-courses')
      .then((r) => r.data),
};
