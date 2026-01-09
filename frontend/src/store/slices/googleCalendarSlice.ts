import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type {
  ApiResponse,
  GoogleCalendarStatus,
  ExternalCalendarEventResponse,
  SyncResult
} from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components
// RULE: Global loading spinner for all requests

// ============================================
// STATE INTERFACE
// ============================================

interface GoogleCalendarState {
  connected: boolean;
  calendarId: string | null;
  authUrl: string | null;
  externalEvents: ExternalCalendarEventResponse[];
  error: string | null;
  successMessage: string | null;
  lastSynced: number | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: GoogleCalendarState = {
  connected: false,
  calendarId: null,
  authUrl: null,
  externalEvents: [],
  error: null,
  successMessage: null,
  lastSynced: null
};

// ============================================
// ASYNC THUNKS
// ============================================

// Get connection status
export const getCalendarStatus = createAsyncThunk<
  GoogleCalendarStatus,
  void,
  { rejectValue: string }
>(
  'googleCalendar/getStatus',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<GoogleCalendarStatus>>(
        '/professional/google-calendar/status'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al verificar conexión');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al verificar conexión';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Get authorization URL
export const getConnectUrl = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>(
  'googleCalendar/getConnectUrl',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<{ authUrl: string }>>(
        '/professional/google-calendar/connect'
      );

      if (response.data.success && response.data.data) {
        return response.data.data.authUrl;
      }

      return rejectWithValue(response.data.error || 'Error al obtener URL de autorización');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener URL de autorización';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Disconnect calendar
export const disconnectCalendar = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  'googleCalendar/disconnect',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<void>>(
        '/professional/google-calendar/disconnect'
      );

      if (response.data.success) {
        return;
      }

      return rejectWithValue(response.data.error || 'Error al desconectar');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al desconectar Google Calendar';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Manual sync
export const syncCalendar = createAsyncThunk<
  SyncResult,
  void,
  { rejectValue: string }
>(
  'googleCalendar/sync',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<SyncResult>>(
        '/professional/google-calendar/sync'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al sincronizar');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al sincronizar con Google Calendar';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Get external events
export const getExternalEvents = createAsyncThunk<
  ExternalCalendarEventResponse[],
  { startDate?: string; endDate?: string } | void,
  { rejectValue: string }
>(
  'googleCalendar/getExternalEvents',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());

      const queryParams = new URLSearchParams();
      if (params) {
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
      }

      const url = `/professional/google-calendar/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ApiResponse<ExternalCalendarEventResponse[]>>(url);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener eventos');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener eventos externos';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLICE
// ============================================

const googleCalendarSlice = createSlice({
  name: 'googleCalendar',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearAuthUrl: (state) => {
      state.authUrl = null;
    }
  },
  extraReducers: (builder) => {
    // Get status
    builder
      .addCase(getCalendarStatus.fulfilled, (state, action: PayloadAction<GoogleCalendarStatus>) => {
        state.connected = action.payload.connected;
        state.calendarId = action.payload.calendarId;
        state.error = action.payload.error || null;
      })
      .addCase(getCalendarStatus.rejected, (state, action) => {
        state.error = action.payload || 'Error al verificar conexión';
      });

    // Get connect URL
    builder
      .addCase(getConnectUrl.fulfilled, (state, action: PayloadAction<string>) => {
        state.authUrl = action.payload;
        state.error = null;
      })
      .addCase(getConnectUrl.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener URL';
      });

    // Disconnect
    builder
      .addCase(disconnectCalendar.fulfilled, (state) => {
        state.connected = false;
        state.calendarId = null;
        state.externalEvents = [];
        state.successMessage = 'Google Calendar desconectado correctamente';
        state.error = null;
      })
      .addCase(disconnectCalendar.rejected, (state, action) => {
        state.error = action.payload || 'Error al desconectar';
      });

    // Sync
    builder
      .addCase(syncCalendar.fulfilled, (state, action: PayloadAction<SyncResult>) => {
        state.lastSynced = Date.now();
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(syncCalendar.rejected, (state, action) => {
        state.error = action.payload || 'Error al sincronizar';
      });

    // Get external events
    builder
      .addCase(getExternalEvents.fulfilled, (state, action: PayloadAction<ExternalCalendarEventResponse[]>) => {
        state.externalEvents = action.payload;
        state.error = null;
      })
      .addCase(getExternalEvents.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener eventos';
      });
  }
});

export const { clearError, clearSuccessMessage, clearAuthUrl } = googleCalendarSlice.actions;
export default googleCalendarSlice.reducer;
