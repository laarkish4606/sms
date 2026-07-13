import { createResourceApi } from './createResourceApi.js';
import { buildQueryString } from './queryString.js';

export const examsResourceApi = createResourceApi('Exam', '/exams');

export const examsApi = examsResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    publishExam: builder.mutation({
      query: (id) => ({ url: `/exams/${id}/publish`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'Exam', id }],
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
  }),
});

export const {
  useListExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  useDeleteExamMutation,
  usePublishExamMutation,
  useEnterMarksMutation,
  useGetExamMarksQuery,
  useGetClassResultsSummaryQuery,
  useGetStudentReportCardQuery,
} = examsApi;
