import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi.js';
import authReducer from '../features/auth/authSlice.js';
import themeReducer from '../features/theme/themeSlice.js';
import uiReducer from '../features/ui/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    ui: uiReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;
