import { createResourceApi } from './createResourceApi.js';

export const parentsResourceApi = createResourceApi('Parent', '/parents');

export const parentsApi = parentsResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    linkChild: builder.mutation({
      query: ({ id, studentId }) => ({ url: `/parents/${id}/children`, method: 'POST', body: { studentId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Parent', id }],
    }),
    unlinkChild: builder.mutation({
      query: ({ id, studentId }) => ({ url: `/parents/${id}/children/${studentId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Parent', id }],
    }),
    getMyChildren: builder.query({
      query: () => '/parents/me/children',
      providesTags: ['Parent'],
    }),
    getChildAttendance: builder.query({
      query: (studentId) => `/parents/children/${studentId}/attendance`,
    }),
    getChildGrades: builder.query({
      query: (studentId) => `/parents/children/${studentId}/grades`,
    }),
    getChildFeeStatus: builder.query({
      query: (studentId) => `/parents/children/${studentId}/fees`,
    }),
  }),
});

export const {
  useListParentsQuery,
  useGetParentQuery,
  useCreateParentMutation,
  useUpdateParentMutation,
  useDeleteParentMutation,
  useLinkChildMutation,
  useUnlinkChildMutation,
  useGetMyChildrenQuery,
  useGetChildAttendanceQuery,
  useGetChildGradesQuery,
  useGetChildFeeStatusQuery,
} = parentsApi;
