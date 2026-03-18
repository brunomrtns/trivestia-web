import { apiTenant } from './api/apiTenant';

export interface UploadResponse {
  path: string;
  url: string;
}

export const FileUploadService = {
  /**
   * Faz upload de um arquivo para uma categoria específica.
   */
  upload: async (
    slug: string,
    file: File,
    category: 'courses/thumbnails' | 'courses/videos' | 'courses/materials' | 'users/avatars' | 'questions' | 'tenants/logos',
    onProgress?: (pct: number) => void
  ): Promise<UploadResponse> => {
    const api = apiTenant(slug);
    const { data } = await api.upload<UploadResponse>(
      '/upload',
      file,
      category,
      onProgress
    );
    return data;
  }
};
