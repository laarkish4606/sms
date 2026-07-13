import { createResourceApi } from './createResourceApi.js';
import { buildQueryString } from './queryString.js';

export const booksResourceApi = createResourceApi('Book', '/library/books');

export const libraryApi = booksResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    issueBook: builder.mutation({
      query: (body) => ({ url: '/library/issues', method: 'POST', body }),
      invalidatesTags: [{ type: 'Book', id: 'LIST' }, 'BookIssue'],
    }),
    returnBook: builder.mutation({
      query: (id) => ({ url: `/library/issues/${id}/return`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Book', id: 'LIST' }, 'BookIssue'],
    }),
    listIssues: builder.query({
      query: (params) => `/library/issues${buildQueryString(params)}`,
      providesTags: ['BookIssue'],
    }),
  }),
});

export const {
  useListBooksQuery,
  useGetBookQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useIssueBookMutation,
  useReturnBookMutation,
  useListIssuesQuery,
} = libraryApi;
