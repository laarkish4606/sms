import { baseApi } from './baseApi.js';
import { buildQueryString } from './queryString.js';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    attendanceReport: builder.query({
      query: (params) => `/reports/attendance${buildQueryString(params)}`,
    }),
    academicReport: builder.query({
      query: (params) => `/reports/academic${buildQueryString(params)}`,
    }),
    financialReport: builder.query({
      query: (params) => `/reports/financial${buildQueryString(params)}`,
    }),
  }),
});

export const { useAttendanceReportQuery, useAcademicReportQuery, useFinancialReportQuery } = reportsApi;

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export function reportExportUrl(kind, format, params = {}) {
  return `${API_URL}/reports/${kind}/export/${format}${buildQueryString(params)}`;
}
