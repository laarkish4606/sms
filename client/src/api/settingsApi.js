import { baseApi } from './baseApi.js';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSchoolInfo: builder.mutation({
      query: (body) => ({ url: '/settings/school-info', method: 'PATCH', body }),
      invalidatesTags: ['Settings'],
    }),
    updateSystemConfig: builder.mutation({
      query: (body) => ({ url: '/settings/system-config', method: 'PATCH', body }),
      invalidatesTags: ['Settings'],
    }),
    uploadSchoolLogo: builder.mutation({
      query: (formData) => ({ url: '/settings/logo', method: 'POST', body: formData }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSchoolInfoMutation,
  useUpdateSystemConfigMutation,
  useUploadSchoolLogoMutation,
} = settingsApi;
