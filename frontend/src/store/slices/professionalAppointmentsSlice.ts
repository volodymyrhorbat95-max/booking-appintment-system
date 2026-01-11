import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type {
  ApiResponse,
  ProfessionalAppointment,
  ProfessionalAppointmentDetail,
  AppointmentsSummary,
  TodayAppointment,
  AppointmentsListResponse,
  AppointmentsSummaryResponse,
  AppointmentsPagination,
  AppointmentStatus
} from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components
// RULE: Global loading spinner for all requests

// ============================================
// STATE INTERFACE
// ============================================

interface ProfessionalAppointmentsState {
  // List view
  appointments: ProfessionalAppointment[];
  pagination: AppointmentsPagination | null;

  // Dashboard summary
  summary: AppointmentsSummary | null;
  todayAppointments: TodayAppointment[];

  // Detail view
  selectedAppointment: ProfessionalAppointmentDetail | null;

  // Filters
  filters: {
    status: string;
    startDate: string;
    endDate: string;
  };

  // State
  error: string | null;
  successMessage: string | null;
  lastFetched: number | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: ProfessionalAppointmentsState = {
  appointments: [],
  pagination: null,
  summary: null,
  todayAppointments: [],
  selectedAppointment: null,
  filters: {
    status: '',
    startDate: '',
    endDate: ''
  },
  error: null,
  successMessage: null,
  lastFetched: null
};

// ============================================
// ASYNC THUNKS
// ============================================

// Get appointments summary for dashboard
export const getAppointmentsSummary = createAsyncThunk<
  AppointmentsSummaryResponse,
  void,
  { rejectValue: string }
>(
  'professionalAppointments/getSummary',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AppointmentsSummaryResponse>>(
        '/professional/appointments/summary'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener resumen');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener resumen de citas';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Get appointments list with filters
interface GetAppointmentsParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const getAppointments = createAsyncThunk<
  AppointmentsListResponse,
  GetAppointmentsParams | void,
  { rejectValue: string }
>(
  'professionalAppointments/getAppointments',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());

      const queryParams = new URLSearchParams();
      if (params) {
        if (params.status) queryParams.append('status', params.status);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
      }

      const url = `/professional/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ApiResponse<AppointmentsListResponse>>(url);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener citas');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener citas';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Get single appointment detail
export const getAppointmentDetail = createAsyncThunk<
  ProfessionalAppointmentDetail,
  string,
  { rejectValue: string }
>(
  'professionalAppointments/getDetail',
  async (appointmentId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<ProfessionalAppointmentDetail>>(
        `/professional/appointments/${appointmentId}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener detalles de la cita');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener detalles de la cita';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Cancel appointment
interface CancelAppointmentParams {
  appointmentId: string;
  reason?: string;
}

interface CancelAppointmentResponse {
  id: string;
  bookingReference: string;
  status: AppointmentStatus;
  message: string;
}

export const cancelAppointment = createAsyncThunk<
  CancelAppointmentResponse,
  CancelAppointmentParams,
  { rejectValue: string }
>(
  'professionalAppointments/cancel',
  async ({ appointmentId, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<CancelAppointmentResponse>>(
        `/professional/appointments/${appointmentId}/cancel`,
        { reason }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al cancelar la cita');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al cancelar la cita';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Update appointment status
interface UpdateStatusParams {
  appointmentId: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW';
}

interface UpdateStatusResponse {
  id: string;
  bookingReference: string;
  status: AppointmentStatus;
}

export const updateAppointmentStatus = createAsyncThunk<
  UpdateStatusResponse,
  UpdateStatusParams,
  { rejectValue: string }
>(
  'professionalAppointments/updateStatus',
  async ({ appointmentId, status }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<UpdateStatusResponse>>(
        `/professional/appointments/${appointmentId}/status`,
        { status }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar estado');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al actualizar estado de la cita';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLICE
// ============================================

const professionalAppointmentsSlice = createSlice({
  name: 'professionalAppointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearSelectedAppointment: (state) => {
      state.selectedAppointment = null;
    },
    setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = { status: '', startDate: '', endDate: '' };
    },
    // WebSocket real-time updates
    handleAppointmentCreated: (state, action: PayloadAction<any>) => {
      // Refresh summary counts
      if (state.summary) {
        if (action.payload.status === 'PENDING' || action.payload.status === 'PENDING_PAYMENT') {
          state.summary.pending += 1;
        }
      }
      // Add to today's appointments if it's today
      const today = new Date().toISOString().split('T')[0];
      if (action.payload.date === today) {
        state.todayAppointments.unshift({
          id: action.payload.appointmentId,
          bookingReference: action.payload.bookingReference,
          time: action.payload.startTime,
          patientName: action.payload.patientName,
          status: action.payload.status
        });
        if (state.summary) {
          state.summary.today += 1;
        }
      }
      // Trigger refetch by clearing lastFetched
      state.lastFetched = null;
    },
    handleAppointmentCancelled: (state, action: PayloadAction<any>) => {
      // Update in list
      const index = state.appointments.findIndex(apt => apt.id === action.payload.appointmentId);
      if (index !== -1) {
        state.appointments[index].status = 'CANCELLED';
      }
      // Update today's list
      const todayIndex = state.todayAppointments.findIndex(apt => apt.id === action.payload.appointmentId);
      if (todayIndex !== -1) {
        state.todayAppointments[todayIndex].status = 'CANCELLED';
      }
      // Update summary
      if (state.summary) {
        state.summary.pending = Math.max(0, state.summary.pending - 1);
      }
    },
    handleAppointmentStatusChanged: (state, action: PayloadAction<any>) => {
      // Update in list
      const index = state.appointments.findIndex(apt => apt.id === action.payload.appointmentId);
      if (index !== -1) {
        const oldStatus = state.appointments[index].status;
        state.appointments[index].status = action.payload.status;

        // Update summary counts
        if (state.summary) {
          if (['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT'].includes(oldStatus)) {
            state.summary.pending = Math.max(0, state.summary.pending - 1);
          } else if (oldStatus === 'CONFIRMED') {
            state.summary.confirmed = Math.max(0, state.summary.confirmed - 1);
          }
          if (action.payload.status === 'CONFIRMED') {
            state.summary.confirmed += 1;
          }
        }
      }
      // Update today's list
      const todayIndex = state.todayAppointments.findIndex(apt => apt.id === action.payload.appointmentId);
      if (todayIndex !== -1) {
        state.todayAppointments[todayIndex].status = action.payload.status;
      }
    }
  },
  extraReducers: (builder) => {
    // Get summary
    builder
      .addCase(getAppointmentsSummary.fulfilled, (state, action: PayloadAction<AppointmentsSummaryResponse>) => {
        state.summary = action.payload.summary;
        state.todayAppointments = action.payload.todayAppointments;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getAppointmentsSummary.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener resumen';
      });

    // Get appointments list
    builder
      .addCase(getAppointments.fulfilled, (state, action: PayloadAction<AppointmentsListResponse>) => {
        state.appointments = action.payload.appointments;
        state.pagination = action.payload.pagination;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getAppointments.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener citas';
      });

    // Get appointment detail
    builder
      .addCase(getAppointmentDetail.fulfilled, (state, action: PayloadAction<ProfessionalAppointmentDetail>) => {
        state.selectedAppointment = action.payload;
        state.error = null;
      })
      .addCase(getAppointmentDetail.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener detalles';
      });

    // Cancel appointment
    builder
      .addCase(cancelAppointment.fulfilled, (state, action: PayloadAction<CancelAppointmentResponse>) => {
        // Update in list
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
        if (index !== -1) {
          state.appointments[index].status = action.payload.status;
        }
        // Update today's list
        const todayIndex = state.todayAppointments.findIndex(apt => apt.id === action.payload.id);
        if (todayIndex !== -1) {
          state.todayAppointments[todayIndex].status = action.payload.status;
        }
        // Update summary counts
        if (state.summary) {
          state.summary.pending = Math.max(0, state.summary.pending - 1);
        }
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.error = action.payload || 'Error al cancelar cita';
      });

    // Update status
    builder
      .addCase(updateAppointmentStatus.fulfilled, (state, action: PayloadAction<UpdateStatusResponse>) => {
        // Update in list
        const index = state.appointments.findIndex(apt => apt.id === action.payload.id);
        if (index !== -1) {
          const oldStatus = state.appointments[index].status;
          state.appointments[index].status = action.payload.status;

          // Update summary counts
          if (state.summary) {
            // Decrease old status count
            if (['PENDING', 'PENDING_PAYMENT', 'REMINDER_SENT'].includes(oldStatus)) {
              state.summary.pending = Math.max(0, state.summary.pending - 1);
            } else if (oldStatus === 'CONFIRMED') {
              state.summary.confirmed = Math.max(0, state.summary.confirmed - 1);
            }
            // Increase new status count
            if (action.payload.status === 'CONFIRMED') {
              state.summary.confirmed += 1;
            }
          }
        }
        // Update today's list
        const todayIndex = state.todayAppointments.findIndex(apt => apt.id === action.payload.id);
        if (todayIndex !== -1) {
          state.todayAppointments[todayIndex].status = action.payload.status;
        }
        // Update selected appointment if viewing
        if (state.selectedAppointment && state.selectedAppointment.id === action.payload.id) {
          state.selectedAppointment.status = action.payload.status;
        }
        state.successMessage = 'Estado actualizado correctamente';
        state.error = null;
      })
      .addCase(updateAppointmentStatus.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar estado';
      });
  }
});

export const {
  clearError,
  clearSuccessMessage,
  clearSelectedAppointment,
  setFilters,
  clearFilters,
  handleAppointmentCreated,
  handleAppointmentCancelled,
  handleAppointmentStatusChanged
} = professionalAppointmentsSlice.actions;

export default professionalAppointmentsSlice.reducer;
