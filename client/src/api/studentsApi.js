import { createResourceApi } from './createResourceApi.js';
import { baseApi } from './baseApi.js';
import { buildQueryString } from './queryString.js';

export const studentsResourceApi = createResourceApi('Student', '/students');

export const studentsApi = studentsResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadStudentPhoto: builder.mutation({
      query: ({ id, formData }) => ({ url: `/students/${id}/photo`, method: 'POST', body: formData }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Student', id }],
    }),
    promoteStudents: builder.mutation({
      query: (body) => ({ url: '/students/promote', method: 'POST', body }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    getMyStudentProfile: builder.query({
      query: () => '/students/me',
      providesTags: ['Student'],
    }),

    previewStudentImport: builder.mutation({
      query: ({ academicYear, formData }) => {
        formData.append('academicYear', academicYear);
        return { url: '/students/import/preview', method: 'POST', body: formData };
      },
    }),
    commitStudentImport: builder.mutation({
      query: (body) => ({ url: '/students/import/commit', method: 'POST', body }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),

    matchBulkPhotos: builder.mutation({
      query: (formData) => ({ url: '/students/photos/bulk/match', method: 'POST', body: formData }),
    }),
    commitBulkPhotos: builder.mutation({
      query: (body) => ({ url: '/students/photos/bulk/commit', method: 'POST', body }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),

    getPromotionPreview: builder.query({
      query: (params) => `/students/promotion/preview${buildQueryString(params)}`,
    }),
    commitPromotion: builder.mutation({
      query: (body) => ({ url: '/students/promotion/commit', method: 'POST', body }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
  }),
});

export const {
  useListStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useUploadStudentPhotoMutation,
  usePromoteStudentsMutation,
  useGetMyStudentProfileQuery,
  usePreviewStudentImportMutation,
  useCommitStudentImportMutation,
  useMatchBulkPhotosMutation,
  useCommitBulkPhotosMutation,
  useGetPromotionPreviewQuery,
  useCommitPromotionMutation,
} = studentsApi;

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function studentImportTemplateUrl() {
  return `${API_URL}/students/import/template`;
}

export function studentExportUrl(params = {}) {
  return `${API_URL}/students/export/excel${buildQueryString(params)}`;
}
