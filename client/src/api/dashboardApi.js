import { baseApi } from './baseApi.js';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => '/dashboard/admin',
    }),
    getTeacherDashboard: builder.query({
      query: () => '/dashboard/teacher',
    }),
    getStudentDashboard: builder.query({
      query: () => '/dashboard/student',
    }),
  }),
});

export const { useGetAdminDashboardQuery, useGetTeacherDashboardQuery, useGetStudentDashboardQuery } = dashboardApi;
