import { createResourceApi } from './createResourceApi.js';
import { buildQueryString } from './queryString.js';

export const noticesApi = createResourceApi('Notice', '/communication/notices');

export const messagesApi = noticesApi.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (body) => ({ url: '/communication/messages', method: 'POST', body }),
      invalidatesTags: ['Message'],
    }),
    getInbox: builder.query({
      query: (params) => `/communication/messages/inbox${buildQueryString(params)}`,
      providesTags: ['Message'],
    }),
    getSent: builder.query({
      query: (params) => `/communication/messages/sent${buildQueryString(params)}`,
      providesTags: ['Message'],
    }),
    markMessageRead: builder.mutation({
      query: (id) => ({ url: `/communication/messages/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Message'],
    }),
  }),
});

export const {
  useListNoticesQuery,
  useGetNoticeQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} = noticesApi;

export const { useSendMessageMutation, useGetInboxQuery, useGetSentQuery, useMarkMessageReadMutation } = messagesApi;
