import { apiTenant } from '../api/apiTenant';
import type {
  CourseGenerationRequest,
  AiCourseAvailability,
  CourseGenDocument,
  UploadDocResult,
  LinkedDocPair,
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

  listDocuments: (slug: string, requestId: string) =>
    apiTenant(slug)
      .get<CourseGenDocument[]>(`/ai-courses/${requestId}/documents`)
      .then((r) => r.data),

  uploadDocuments: (slug: string, requestId: string, formData: FormData) =>
    apiTenant(slug)
      .post<UploadDocResult>(`/ai-courses/${requestId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  deleteDocument: (slug: string, requestId: string, docId: string) =>
    apiTenant(slug)
      .delete(`/ai-courses/${requestId}/documents/${docId}`)
      .then((r) => r.data),

  linkDocuments: (slug: string, requestId: string, provaId: string, gabaritoId: string) =>
    apiTenant(slug)
      .post<LinkedDocPair>(`/ai-courses/${requestId}/documents/link`, { provaId, gabaritoId })
      .then((r) => r.data),

  unlinkDocument: (slug: string, requestId: string, docId: string) =>
    apiTenant(slug)
      .post(`/ai-courses/${requestId}/documents/${docId}/unlink`)
      .then((r) => r.data),
};
