import { createResourceApi } from './createResourceApi.js';

export const teachersResourceApi = createResourceApi('Teacher', '/teachers');

export const teachersApi = teachersResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    assignTeacher: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/teachers/${id}/assign`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Teacher', id }],
    }),
    uploadTeacherPhoto: builder.mutation({
      query: ({ id, formData }) => ({ url: `/teachers/${id}/photo`, method: 'POST', body: formData }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Teacher', id }],
    }),
  }),
});

export const {
  useListTeachersQuery,
  useGetTeacherQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
  useAssignTeacherMutation,
  useUploadTeacherPhotoMutation,
} = teachersApi;
