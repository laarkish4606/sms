import { baseApi } from './baseApi.js';
import { buildQueryString } from './queryString.js';

export const feesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFeeStructures: builder.query({
      query: (params) => `/fees/structures${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((i) => ({ type: 'FeeStructure', id: i._id })), { type: 'FeeStructure', id: 'LIST' }]
          : [{ type: 'FeeStructure', id: 'LIST' }],
    }),
    createFeeStructure: builder.mutation({
      query: (body) => ({ url: '/fees/structures', method: 'POST', body }),
      invalidatesTags: [{ type: 'FeeStructure', id: 'LIST' }],
    }),
    updateFeeStructure: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/fees/structures/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'FeeStructure', id: 'LIST' }],
    }),
    deleteFeeStructure: builder.mutation({
      query: (id) => ({ url: `/fees/structures/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'FeeStructure', id: 'LIST' }],
    }),

    generateInvoices: builder.mutation({
      query: (body) => ({ url: '/fees/invoices/generate', method: 'POST', body }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    listInvoices: builder.query({
      query: (params) => `/fees/invoices${buildQueryString(params)}`,
      providesTags: (result) =>
        result?.data
          ? [...result.data.map((i) => ({ type: 'Invoice', id: i._id })), { type: 'Invoice', id: 'LIST' }]
          : [{ type: 'Invoice', id: 'LIST' }],
    }),
    listOverdueInvoices: builder.query({
      query: () => '/fees/invoices/overdue',
      providesTags: [{ type: 'Invoice', id: 'LIST' }],
    }),
    getInvoice: builder.query({
      query: (id) => `/fees/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),

    recordPayment: builder.mutation({
      query: ({ invoiceId, ...body }) => ({ url: `/fees/invoices/${invoiceId}/payments`, method: 'POST', body }),
      invalidatesTags: (result, error, { invoiceId }) => [
        { type: 'Invoice', id: invoiceId },
        { type: 'Invoice', id: 'LIST' },
        'Payment',
      ],
    }),
    listPaymentsForInvoice: builder.query({
      query: (invoiceId) => `/fees/invoices/${invoiceId}/payments`,
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useListFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useUpdateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  useGenerateInvoicesMutation,
  useListInvoicesQuery,
  useListOverdueInvoicesQuery,
  useGetInvoiceQuery,
  useRecordPaymentMutation,
  useListPaymentsForInvoiceQuery,
} = feesApi;

export function receiptDownloadUrl(paymentId) {
  return `${import.meta.env.VITE_API_URL || '/api/v1'}/fees/payments/${paymentId}/receipt`;
}
