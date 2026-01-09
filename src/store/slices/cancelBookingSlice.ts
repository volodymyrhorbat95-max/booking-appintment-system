import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { ApiResponse } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components

interface AppointmentDetails {
  bookingReference: string;
  status: string;
  date: string;
  time: string;
  professional: {
    fullName: string;
    slug: string;
  };
  patient: {
    firstName: string;
    lastName: string;
    email: string;
  };
  canCancel: boolean;
  deposit: {
    required: boolean;
    amount: number | null;
    paid: boolean;
  };
}

interface CancelBookingState {
  appointment: AppointmentDetails | null;
  cancelled: boolean;
  error: string | null;
  notFound: boolean;
}

const initialState: CancelBookingState = {
  appointment: null,
  cancelled: false,
  error: null,
  notFound: false
};

// Get appointment by reference
export const getAppointmentByReference = createAsyncThunk<
  AppointmentDetails,
  { reference: string; email: string },
  { rejectValue: string }
>(
  'cancelBooking/getAppointmentByReference',
  async ({ reference, email }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AppointmentDetails>>(
        `/appointments/reference/${reference}?email=${encodeURIComponent(email)}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al buscar la reserva');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 404) {
        return rejectWithValue('NOT_FOUND');
      }
      const message = err.response?.data?.error || 'Error al buscar la reserva';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Cancel appointment
export const cancelAppointment = createAsyncThunk<
  { bookingReference: string; status: string; message: string },
  { reference: string; email: string; reason?: string },
  { rejectValue: string }
>(
  'cancelBooking/cancelAppointment',
  async ({ reference, email, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<
        ApiResponse<{ bookingReference: string; status: string; message: string }>
      >(`/appointments/cancel/${reference}`, { email, reason });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al cancelar la reserva');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al cancelar la reserva';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const cancelBookingSlice = createSlice({
  name: 'cancelBooking',
  initialState,
  reducers: {
    clearCancelBookingState: (state) => {
      state.appointment = null;
      state.cancelled = false;
      state.error = null;
      state.notFound = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get appointment by reference
    builder
      .addCase(getAppointmentByReference.fulfilled, (state, action: PayloadAction<AppointmentDetails>) => {
        state.appointment = action.payload;
        state.error = null;
        state.notFound = false;
      })
      .addCase(getAppointmentByReference.rejected, (state, action) => {
        if (action.payload === 'NOT_FOUND') {
          state.notFound = true;
          state.error = null;
        } else {
          state.error = action.payload || 'Error al buscar la reserva';
          state.notFound = false;
        }
      });

    // Cancel appointment
    builder
      .addCase(cancelAppointment.fulfilled, (state) => {
        state.cancelled = true;
        state.error = null;
        if (state.appointment) {
          state.appointment.status = 'CANCELLED';
          state.appointment.canCancel = false;
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.error = action.payload || 'Error al cancelar la reserva';
      });
  }
});

export const { clearCancelBookingState, clearError } = cancelBookingSlice.actions;
export default cancelBookingSlice.reducer;
