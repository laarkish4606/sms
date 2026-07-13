import { baseApi } from './baseApi.js';
import { buildQueryString } from './queryString.js';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    markStudentAttendance: builder.mutation({
      query: (body) => ({ url: '/attendance/students', method: 'POST', body }),
      invalidatesTags: ['StudentAttendance'],
    }),
    listStudentAttendance: builder.query({
      query: (params) => `/attendance/students${buildQueryString(params)}`,
      providesTags: ['StudentAttendance'],
    }),
    studentAttendanceReport: builder.query({
      query: (params) => `/attendance/students/report${buildQueryString(params)}`,
    }),
    markTeacherAttendance: builder.mutation({
      query: (body) => ({ url: '/attendance/teachers', method: 'POST', body }),
      invalidatesTags: ['TeacherAttendance'],
    }),
    listTeacherAttendance: builder.query({
      query: (params) => `/attendance/teachers${buildQueryString(params)}`,
      providesTags: ['TeacherAttendance'],
    }),
  }),
});

export const {
  useMarkStudentAttendanceMutation,
  useListStudentAttendanceQuery,
  useStudentAttendanceReportQuery,
  useMarkTeacherAttendanceMutation,
  useListTeacherAttendanceQuery,
} = attendanceApi;
