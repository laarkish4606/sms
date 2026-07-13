import { baseApi } from './baseApi.js';
import { buildQueryString } from './queryString.js';

/**
 * Generates standard list/get/create/update/remove RTK Query endpoints for a
 * school-scoped REST resource, mirroring the backend's crudFactory. Modules
 * with extra actions (e.g. publish, assign) inject additional endpoints
 * alongside this on the same `baseApi` instance.
 */
export function createResourceApi(tagType, basePath) {
  return baseApi.injectEndpoints({
    endpoints: (builder) => ({
      [`list${tagType}s`]: builder.query({
        query: (params) => `${basePath}${buildQueryString(params)}`,
        providesTags: (result) =>
          result?.data
            ? [...result.data.map((item) => ({ type: tagType, id: item._id || item.id })), { type: tagType, id: 'LIST' }]
            : [{ type: tagType, id: 'LIST' }],
      }),
      [`get${tagType}`]: builder.query({
        query: (id) => `${basePath}/${id}`,
        providesTags: (result, error, id) => [{ type: tagType, id }],
      }),
      [`create${tagType}`]: builder.mutation({
        query: (body) => ({ url: basePath, method: 'POST', body }),
        invalidatesTags: [{ type: tagType, id: 'LIST' }],
      }),
      [`update${tagType}`]: builder.mutation({
        query: ({ id, ...body }) => ({ url: `${basePath}/${id}`, method: 'PATCH', body }),
        invalidatesTags: (result, error, { id }) => [
          { type: tagType, id },
          { type: tagType, id: 'LIST' },
        ],
      }),
      [`delete${tagType}`]: builder.mutation({
        query: (id) => ({ url: `${basePath}/${id}`, method: 'DELETE' }),
        invalidatesTags: [{ type: tagType, id: 'LIST' }],
      }),
    }),
  });
}

export default createResourceApi;
