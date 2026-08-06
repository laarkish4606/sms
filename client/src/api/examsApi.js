import { createResourceApi } from './createResourceApi.js';
import { buildQueryString } from './queryString.js';

export const examsResourceApi = createResourceApi('Exam', '/exams');

export const examsApi = examsResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    submitExam: builder.mutation({
      query: (id) => ({ url: `/exams/${id}/submit`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Exam', id }, { type: 'Exam', id: 'LIST' }],
    }),
    publishExam: builder.mutation({
      query: (id) => ({ url: `/exams/${id}/publish`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Exam', id }, { type: 'Exam', id: 'LIST' }],
    }),
    enterMarks: builder.mutation({
      query: ({ examId, records }) => ({ url: `/exams/${examId}/marks`, method: 'POST', body: { records } }),
      invalidatesTags: ['Mark'],
    }),
    getExamMarks: builder.query({
      query: ({ examId, ...params }) => `/exams/${examId}/marks${buildQueryString(params)}`,
      providesTags: ['Mark'],
    }),
    getClassResultsSummary: builder.query({
      query: (examId) => `/exams/${examId}/results-summary`,
    }),
    getStudentReportCard: builder.query({
      query: ({ examId, studentId }) => `/exams/${examId}/report-card/${studentId}`,
    }),
    getTermReportCard: builder.query({
      query: (params) => `/exams/term-report${buildQueryString(params)}`,
    }),
    getTermRanking: builder.query({
      query: (params) => `/exams/term-ranking${buildQueryString(params)}`,
    }),
  }),
});

export const {
  useListExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useSubmitExamMutation,
  usePublishExamMutation,
  useEnterMarksMutation,
  useGetExamMarksQuery,
  useGetClassResultsSummaryQuery,
  useGetStudentReportCardQuery,
  useGetTermReportCardQuery,
  useGetTermRankingQuery,
} = examsApi;
