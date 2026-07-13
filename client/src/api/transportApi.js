import { createResourceApi } from './createResourceApi.js';

export const vehiclesApi = createResourceApi('Vehicle', '/transport/vehicles');
export const routesResourceApi = createResourceApi('Route', '/transport/routes');

export const routesApi = routesResourceApi.injectEndpoints({
  endpoints: (builder) => ({
    listStudentsOnRoute: builder.query({
      query: (routeId) => `/transport/routes/${routeId}/students`,
    }),
    allocateStudentToRoute: builder.mutation({
      query: ({ studentId, ...body }) => ({ url: `/transport/students/${studentId}/allocation`, method: 'PUT', body }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
    removeStudentFromRoute: builder.mutation({
      query: (studentId) => ({ url: `/transport/students/${studentId}/allocation`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Student', id: 'LIST' }],
    }),
  }),
});

export const {
  useListVehiclesQuery,
  useGetVehicleQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} = vehiclesApi;

export const {
  useListRoutesQuery,
  useGetRouteQuery,
  useCreateRouteMutation,
  useUpdateRouteMutation,
  useDeleteRouteMutation,
  useListStudentsOnRouteQuery,
  useAllocateStudentToRouteMutation,
  useRemoveStudentFromRouteMutation,
} = routesApi;
