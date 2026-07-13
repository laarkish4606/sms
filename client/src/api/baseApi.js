import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logout } from '../features/auth/authSlice.js';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Wraps fetchBaseQuery to transparently refresh the access token on a 401
// and replay the original request once.
async function baseQueryWithReauth(args, api, extraOptions) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !args?.url?.includes('/auth/')) {
    const refreshResult = await rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions);

    if (refreshResult.data?.data?.accessToken) {
      api.dispatch(setCredentials({ accessToken: refreshResult.data.data.accessToken }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Me',
    'Student',
    'Teacher',
    'Parent',
    'AcademicYear',
    'Class',
    'Section',
    'Subject',
    'Timetable',
    'StudentAttendance',
    'TeacherAttendance',
    'Exam',
    'Mark',
    'FeeStructure',
    'Invoice',
    'Payment',
    'Book',
    'BookIssue',
    'Vehicle',
    'Route',
    'Hostel',
    'Room',
    'Notice',
    'Message',
    'School',
    'User',
    'Settings',
  ],
  endpoints: () => ({}),
});
