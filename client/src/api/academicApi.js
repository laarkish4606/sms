import { createResourceApi } from './createResourceApi.js';

export const academicYearsResourceApi = createResourceApi('AcademicYear', '/academic-years');
export const academicYearsApi = academicYearsResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    setCurrentAcademicYear: builder.mutation({
      query: (id) => ({ url: `/academic-years/${id}/set-current`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'AcademicYear', id: 'LIST' }],
    }),
  }),
});

export const classesResourceApi = createResourceApi('Class', '/classes');
export const classesApi = classesResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    assignSubjectTeacher: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/classes/${id}/assign-subject`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Class', id }],
    }),
  }),
});

export const sectionsApi = createResourceApi('Section', '/sections');
export const subjectsApi = createResourceApi('Subject', '/subjects');

export const timetableApi = subjectsApi.injectEndpoints({
  endpoints: (builder) => ({
    getSectionTimetable: builder.query({
      query: ({ sectionId, academicYear }) => `/timetables/section/${sectionId}?academicYear=${academicYear || ''}`,
      providesTags: ['Timetable'],
    }),
    getTeacherTimetable: builder.query({
      query: (teacherId) => `/timetables/teacher/${teacherId}`,
      providesTags: ['Timetable'],
    }),
    saveTimetable: builder.mutation({
      query: (body) => ({ url: '/timetables', method: 'PUT', body }),
      invalidatesTags: ['Timetable'],
    }),
  }),
});

export const {
  useListAcademicYearsQuery,
  useGetAcademicYearQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useDeleteAcademicYearMutation,
  useSetCurrentAcademicYearMutation,
} = academicYearsApi;

export const {
  useListClasssQuery: useListClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useAssignSubjectTeacherMutation,
} = classesApi;

export const {
  useListSectionsQuery,
  useGetSectionQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} = sectionsApi;

export const {
  useListSubjectsQuery,
  useGetSubjectQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
} = subjectsApi;

export const { useGetSectionTimetableQuery, useGetTeacherTimetableQuery, useSaveTimetableMutation } = timetableApi;
