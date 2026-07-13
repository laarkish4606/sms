import { createResourceApi } from './createResourceApi.js';

export const hostelsApi = createResourceApi('Hostel', '/hostel/hostels');
export const roomsResourceApi = createResourceApi('Room', '/hostel/rooms');

export const roomsApi = roomsResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    allocateBed: builder.mutation({
      query: ({ roomId, studentId }) => ({ url: `/hostel/rooms/${roomId}/allocate`, method: 'POST', body: { studentId } }),
      invalidatesTags: [{ type: 'Room', id: 'LIST' }],
    }),
    vacateBed: builder.mutation({
      query: ({ roomId, bedId }) => ({ url: `/hostel/rooms/${roomId}/beds/${bedId}/vacate`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Room', id: 'LIST' }],
    }),
  }),
});

export const {
  useListHostelsQuery,
  useGetHostelQuery,
  useCreateHostelMutation,
  useUpdateHostelMutation,
  useDeleteHostelMutation,
} = hostelsApi;

export const {
  useListRoomsQuery,
  useGetRoomQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useAllocateBedMutation,
  useVacateBedMutation,
} = roomsApi;
