import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

// Import slices
import loadingReducer from './slices/loadingSlice';
import authReducer from './slices/authSlice';
import availabilityReducer from './slices/availabilitySlice';
import blockedDatesReducer from './slices/blockedDatesSlice';
import customFormFieldsReducer from './slices/customFormFieldsSlice';
import depositSettingsReducer from './slices/depositSettingsSlice';
import publicBookingReducer from './slices/publicBookingSlice';
import cancelBookingReducer from './slices/cancelBookingSlice';
import professionalAppointmentsReducer from './slices/professionalAppointmentsSlice';
import googleCalendarReducer from './slices/googleCalendarSlice';
import whatsappReducer from './slices/whatsappSlice';
import adminReducer from './slices/adminSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import statisticsReducer from './slices/statisticsSlice';

// Configure store
export const store = configureStore({
  reducer: {
    loading: loadingReducer,
    auth: authReducer,
    availability: availabilityReducer,
    blockedDates: blockedDatesReducer,
    customFormFields: customFormFieldsReducer,
    depositSettings: depositSettingsReducer,
    publicBooking: publicBookingReducer,
    cancelBooking: cancelBookingReducer,
    professionalAppointments: professionalAppointmentsReducer,
    googleCalendar: googleCalendarReducer,
    whatsapp: whatsappReducer,
    admin: adminReducer,
    subscription: subscriptionReducer,
    statistics: statisticsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore date serialization warnings
        ignoredActions: ['auth/adminLogin/fulfilled', 'auth/professionalGoogleLogin/fulfilled'],
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt', 'auth.professional.createdAt']
      }
    })
});

// Types for store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks - use these instead of plain useDispatch and useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
