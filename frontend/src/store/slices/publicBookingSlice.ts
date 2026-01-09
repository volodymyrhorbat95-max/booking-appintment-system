import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { ApiResponse, BookingPageData, AvailableSlotsData } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components

// Request/Response types for appointment creation
interface CreateAppointmentRequest {
  slug: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  countryCode: string;
  date: string;
  time: string;
  sessionId?: string; // For slot hold validation (Requirement 10.1)
  customFieldValues?: Record<string, string>;
}

// Slot hold response (Requirement 10.1)
interface SlotHoldResponse {
  holdId: string;
  expiresAt: string;
}

interface AppointmentConfirmation {
  bookingReference: string;
  professional: {
    fullName: string;
  };
  appointment: {
    date: string;
    time: string;
    status: string;
  };
  patient: {
    firstName: string;
    lastName: string;
    email: string;
  };
  deposit: {
    required: boolean;
    amount?: number;
    paymentUrl?: string | null;
  };
}

// Deposit payment preference response
interface DepositPaymentPreference {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
  amount: number;
  currency: string;
}

interface PublicBookingState {
  pageData: BookingPageData | null;
  selectedDate: string | null;
  selectedTime: string | null;
  availableSlots: AvailableSlotsData | null;
  bookingConfirmation: AppointmentConfirmation | null;
  depositPaymentPreference: DepositPaymentPreference | null;
  bookingError: string | null;
  depositPaymentError: string | null;
  error: string | null;
  notFound: boolean;
  // Slot hold state (Requirement 10.1)
  sessionId: string;
  currentHold: { holdId: string; expiresAt: string } | null;
  holdError: string | null;
}

// Generate a unique session ID for this booking session
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const initialState: PublicBookingState = {
  pageData: null,
  selectedDate: null,
  selectedTime: null,
  availableSlots: null,
  bookingConfirmation: null,
  depositPaymentPreference: null,
  bookingError: null,
  depositPaymentError: null,
  error: null,
  notFound: false,
  // Slot hold state (Requirement 10.1)
  sessionId: generateSessionId(),
  currentHold: null,
  holdError: null
};

// Get booking page data by professional slug
export const getBookingPageData = createAsyncThunk<
  BookingPageData,
  string,
  { rejectValue: string }
>(
  'publicBooking/getBookingPageData',
  async (slug, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<BookingPageData>>(`/booking/${slug}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener datos de la página');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 404) {
        return rejectWithValue('NOT_FOUND');
      }
      const message = err.response?.data?.error || 'Error al obtener datos de la página';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Get available time slots for a specific date
export const getAvailableSlots = createAsyncThunk<
  AvailableSlotsData,
  { slug: string; date: string },
  { rejectValue: string }
>(
  'publicBooking/getAvailableSlots',
  async ({ slug, date }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AvailableSlotsData>>(
        `/booking/${slug}/slots?date=${date}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener horarios disponibles');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener horarios disponibles';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Create appointment
export const createAppointment = createAsyncThunk<
  AppointmentConfirmation,
  CreateAppointmentRequest,
  { rejectValue: string }
>(
  'publicBooking/createAppointment',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const { slug, ...appointmentData } = data;
      const response = await api.post<ApiResponse<AppointmentConfirmation>>(
        `/appointments/${slug}`,
        appointmentData
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al crear la reserva');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 409) {
        return rejectWithValue(
          err.response?.data?.error || 'Este horario ya no está disponible'
        );
      }
      const message = err.response?.data?.error || 'Error al crear la reserva';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Create deposit payment preference
export const createDepositPayment = createAsyncThunk<
  DepositPaymentPreference,
  { bookingReference: string; email: string },
  { rejectValue: string }
>(
  'publicBooking/createDepositPayment',
  async ({ bookingReference, email }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<DepositPaymentPreference>>(
        `/appointments/deposit/${bookingReference}`,
        { email }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al crear el pago');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al crear el pago';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLOT HOLD THUNKS (Requirement 10.1)
// "When someone starts booking, that slot should be temporarily held"
// ============================================

// Hold a time slot when user selects it
export const holdSlot = createAsyncThunk<
  SlotHoldResponse,
  { slug: string; date: string; time: string },
  { rejectValue: string; state: { publicBooking: PublicBookingState } }
>(
  'publicBooking/holdSlot',
  async ({ slug, date, time }, { getState, rejectWithValue }) => {
    try {
      const { sessionId } = getState().publicBooking;
      const response = await api.post<ApiResponse<SlotHoldResponse>>(
        `/booking/${slug}/hold`,
        { date, time, sessionId }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al reservar el horario');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 409) {
        return rejectWithValue(
          err.response?.data?.error || 'Este horario está siendo reservado por otra persona'
        );
      }
      const message = err.response?.data?.error || 'Error al reservar el horario';
      return rejectWithValue(message);
    }
  }
);

// Release a slot hold (when user changes selection or navigates away)
export const releaseHold = createAsyncThunk<
  void,
  { slug: string; date: string; time: string },
  { rejectValue: string; state: { publicBooking: PublicBookingState } }
>(
  'publicBooking/releaseHold',
  async ({ slug, date, time }, { getState, rejectWithValue }) => {
    try {
      const { sessionId } = getState().publicBooking;
      await api.post(`/booking/${slug}/release`, { date, time, sessionId });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al liberar el horario';
      return rejectWithValue(message);
    }
  }
);

// Refresh available slots (for polling - Requirement 10.2)
export const refreshAvailableSlots = createAsyncThunk<
  AvailableSlotsData,
  { slug: string; date: string },
  { rejectValue: string; state: { publicBooking: PublicBookingState } }
>(
  'publicBooking/refreshAvailableSlots',
  async ({ slug, date }, { getState, rejectWithValue }) => {
    try {
      // Don't show loading spinner for background refresh
      const { sessionId } = getState().publicBooking;
      const response = await api.get<ApiResponse<AvailableSlotsData>>(
        `/booking/${slug}/slots?date=${date}&sessionId=${sessionId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar horarios');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al actualizar horarios';
      return rejectWithValue(message);
    }
  }
);

const publicBookingSlice = createSlice({
  name: 'publicBooking',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string | null>) => {
      state.selectedDate = action.payload;
      state.selectedTime = null; // Reset time when date changes
      state.availableSlots = null;
    },
    setSelectedTime: (state, action: PayloadAction<string | null>) => {
      state.selectedTime = action.payload;
    },
    clearBookingState: (state) => {
      state.pageData = null;
      state.selectedDate = null;
      state.selectedTime = null;
      state.availableSlots = null;
      state.bookingConfirmation = null;
      state.depositPaymentPreference = null;
      state.bookingError = null;
      state.depositPaymentError = null;
      state.error = null;
      state.notFound = false;
      // Reset session for new booking flow
      state.sessionId = generateSessionId();
      state.currentHold = null;
      state.holdError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearBookingError: (state) => {
      state.bookingError = null;
    },
    resetBookingForm: (state) => {
      state.selectedDate = null;
      state.selectedTime = null;
      state.availableSlots = null;
      state.bookingConfirmation = null;
      state.depositPaymentPreference = null;
      state.bookingError = null;
      state.depositPaymentError = null;
      // Reset session for new booking
      state.sessionId = generateSessionId();
      state.currentHold = null;
      state.holdError = null;
    },
    clearHoldError: (state) => {
      state.holdError = null;
    },
    clearDepositPaymentError: (state) => {
      state.depositPaymentError = null;
    },
    clearDepositPaymentPreference: (state) => {
      state.depositPaymentPreference = null;
    }
  },
  extraReducers: (builder) => {
    // Get booking page data
    builder
      .addCase(getBookingPageData.fulfilled, (state, action: PayloadAction<BookingPageData>) => {
        state.pageData = action.payload;
        state.error = null;
        state.notFound = false;
      })
      .addCase(getBookingPageData.rejected, (state, action) => {
        if (action.payload === 'NOT_FOUND') {
          state.notFound = true;
          state.error = null;
        } else {
          state.error = action.payload || 'Error al obtener datos de la página';
          state.notFound = false;
        }
      });

    // Get available slots
    builder
      .addCase(getAvailableSlots.fulfilled, (state, action: PayloadAction<AvailableSlotsData>) => {
        state.availableSlots = action.payload;
        state.error = null;
      })
      .addCase(getAvailableSlots.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener horarios disponibles';
      });

    // Create appointment
    builder
      .addCase(createAppointment.fulfilled, (state, action: PayloadAction<AppointmentConfirmation>) => {
        state.bookingConfirmation = action.payload;
        state.bookingError = null;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.bookingError = action.payload || 'Error al crear la reserva';
      });

    // Create deposit payment
    builder
      .addCase(createDepositPayment.fulfilled, (state, action: PayloadAction<DepositPaymentPreference>) => {
        state.depositPaymentPreference = action.payload;
        state.depositPaymentError = null;
      })
      .addCase(createDepositPayment.rejected, (state, action) => {
        state.depositPaymentError = action.payload || 'Error al crear el pago';
      });

    // Hold slot (Requirement 10.1)
    builder
      .addCase(holdSlot.fulfilled, (state, action: PayloadAction<SlotHoldResponse>) => {
        state.currentHold = action.payload;
        state.holdError = null;
      })
      .addCase(holdSlot.rejected, (state, action) => {
        state.holdError = action.payload || 'Error al reservar el horario';
        state.currentHold = null;
        state.selectedTime = null; // Clear selection if hold failed
      });

    // Release hold
    builder
      .addCase(releaseHold.fulfilled, (state) => {
        state.currentHold = null;
      });

    // Refresh available slots (for polling - Requirement 10.2)
    builder
      .addCase(refreshAvailableSlots.fulfilled, (state, action: PayloadAction<AvailableSlotsData>) => {
        state.availableSlots = action.payload;
      });
  }
});

export const {
  setSelectedDate,
  setSelectedTime,
  clearBookingState,
  clearError,
  clearBookingError,
  resetBookingForm,
  clearHoldError,
  clearDepositPaymentError,
  clearDepositPaymentPreference
} = publicBookingSlice.actions;
export default publicBookingSlice.reducer;
