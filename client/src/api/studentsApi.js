import { createResourceApi } from './createResourceApi.js';
import { baseApi } from './baseApi.js';

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
} = studentsApi;
