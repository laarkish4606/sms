import { baseApi } from './baseApi.js';
import { buildQueryString } from './queryString.js';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => '/dashboard/admin',
    }),
    getTeacherDashboard: builder.query({
      query: () => '/dashboard/teacher',
    }),
    getStudentDashboard: builder.query({
      query: (params) => `/dashboard/student${buildQueryString(params)}`,
    }),
  }),
});

export const { useGetAdminDashboardQuery, useGetTeacherDashboardQuery, useGetStudentDashboardQuery } = dashboardApi;
