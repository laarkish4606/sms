import { baseApi } from './baseApi.js';
import { buildQueryString } from './queryString.js';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => '/dashboard/admin',
    }),
    getAccountantDashboard: builder.query({
      query: () => '/dashboard/accountant',
    }),
    getTeacherDashboard: builder.query({
      query: () => '/dashboard/teacher',
    }),
    getStudentDashboard: builder.query({
      query: (params) => `/dashboard/student${buildQueryString(params)}`,
    }),
    getParentDashboard: builder.query({
      query: () => '/dashboard/parent',
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAccountantDashboardQuery,
  useGetTeacherDashboardQuery,
  useGetStudentDashboardQuery,
  useGetParentDashboardQuery,
} = dashboardApi;
