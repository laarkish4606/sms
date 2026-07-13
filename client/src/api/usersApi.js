import { createResourceApi } from './createResourceApi.js';
import { baseApi } from './baseApi.js';

export const usersResourceApi = createResourceApi('User', '/users');

export const usersApi = usersResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    setUserActive: builder.mutation({
      query: ({ id, isActive }) => ({ url: `/users/${id}/status`, method: 'PATCH', body: { isActive } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
    uploadAvatar: builder.mutation({
      query: (formData) => ({ url: '/users/me/avatar', method: 'POST', body: formData }),
      invalidatesTags: ['Me'],
    }),
    getDirectory: builder.query({
      query: () => '/users/directory',
    }),
  }),
});

export const schoolsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSchools: builder.query({
      query: (params) => ({ url: '/schools', params }),
      providesTags: [{ type: 'School', id: 'LIST' }],
    }),
    createSchool: builder.mutation({
      query: (body) => ({ url: '/schools', method: 'POST', body }),
      invalidatesTags: [{ type: 'School', id: 'LIST' }],
    }),
    updateSchool: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/schools/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'School', id: 'LIST' }],
    }),
    deactivateSchool: builder.mutation({
      query: (id) => ({ url: `/schools/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'School', id: 'LIST' }],
    }),
  }),
});

export const {
  useListUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSetUserActiveMutation,
  useUploadAvatarMutation,
  useGetDirectoryQuery,
} = usersApi;

export const { useListSchoolsQuery, useCreateSchoolMutation, useUpdateSchoolMutation, useDeactivateSchoolMutation } =
  schoolsApi;
