import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { Availability, ApiResponse } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components

interface AvailabilityState {
  availabilities: Availability[];
  appointmentDuration: number;
  error: string | null;
  lastFetched: number | null;
}

interface AvailabilityResponse {
  availabilities: Availability[];
  appointmentDuration: number;
}

interface SaveAvailabilityRequest {
  availabilities: {
    dayOfWeek: number;
    slotNumber: number;
    startTime: string;
    endTime: string;
  }[];
  appointmentDuration: number;
}

const initialState: AvailabilityState = {
  availabilities: [],
  appointmentDuration: 30,
  error: null,
  lastFetched: null
};

// Get availability settings
export const getAvailability = createAsyncThunk<
  AvailabilityResponse,
  void,
  { rejectValue: string }
>(
  'availability/getAvailability',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AvailabilityResponse>>('/professional/availability');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener disponibilidad');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener disponibilidad';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Save availability settings
export const saveAvailability = createAsyncThunk<
  AvailabilityResponse,
  SaveAvailabilityRequest,
  { rejectValue: string }
>(
  'availability/saveAvailability',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<AvailabilityResponse>>('/professional/availability', data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al guardar disponibilidad');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al guardar disponibilidad';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const availabilitySlice = createSlice({
  name: 'availability',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get availability
    builder
      .addCase(getAvailability.fulfilled, (state, action: PayloadAction<AvailabilityResponse>) => {
        state.availabilities = action.payload.availabilities;
        state.appointmentDuration = action.payload.appointmentDuration;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getAvailability.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener disponibilidad';
      });

    // Save availability
    builder
      .addCase(saveAvailability.fulfilled, (state, action: PayloadAction<AvailabilityResponse>) => {
        state.availabilities = action.payload.availabilities;
        state.appointmentDuration = action.payload.appointmentDuration;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(saveAvailability.rejected, (state, action) => {
        state.error = action.payload || 'Error al guardar disponibilidad';
      });
  }
});

export const { clearError } = availabilitySlice.actions;
export default availabilitySlice.reducer;
