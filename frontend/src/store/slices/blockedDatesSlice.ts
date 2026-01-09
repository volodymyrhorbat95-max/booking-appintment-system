import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { BlockedDate, ApiResponse } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components

interface BlockedDatesState {
  blockedDates: BlockedDate[];
  error: string | null;
  lastFetched: number | null;
}

interface AddBlockedDateRequest {
  date: string;
  reason?: string;
}

interface AddBlockedDateRangeRequest {
  startDate: string;
  endDate: string;
  reason?: string;
}

interface AddBlockedDateRangeResponse {
  blockedCount: number;
  skippedCount: number;
}

const initialState: BlockedDatesState = {
  blockedDates: [],
  error: null,
  lastFetched: null
};

// Get blocked dates
export const getBlockedDates = createAsyncThunk<
  BlockedDate[],
  void,
  { rejectValue: string }
>(
  'blockedDates/getBlockedDates',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<BlockedDate[]>>('/professional/blocked-dates');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener fechas bloqueadas');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener fechas bloqueadas';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Add single blocked date
export const addBlockedDate = createAsyncThunk<
  BlockedDate,
  AddBlockedDateRequest,
  { rejectValue: string }
>(
  'blockedDates/addBlockedDate',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<BlockedDate>>('/professional/blocked-dates', data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al bloquear fecha');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al bloquear fecha';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Add blocked date range
export const addBlockedDateRange = createAsyncThunk<
  AddBlockedDateRangeResponse,
  AddBlockedDateRangeRequest,
  { rejectValue: string }
>(
  'blockedDates/addBlockedDateRange',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<AddBlockedDateRangeResponse>>('/professional/blocked-dates/range', data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al bloquear fechas');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al bloquear fechas';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Remove blocked date
export const removeBlockedDate = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'blockedDates/removeBlockedDate',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.delete<ApiResponse<void>>(`/professional/blocked-dates/${id}`);

      if (response.data.success) {
        return id;
      }

      return rejectWithValue(response.data.error || 'Error al desbloquear fecha');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al desbloquear fecha';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const blockedDatesSlice = createSlice({
  name: 'blockedDates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get blocked dates
    builder
      .addCase(getBlockedDates.fulfilled, (state, action: PayloadAction<BlockedDate[]>) => {
        state.blockedDates = action.payload;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getBlockedDates.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener fechas bloqueadas';
      });

    // Add single blocked date
    builder
      .addCase(addBlockedDate.fulfilled, (state, action: PayloadAction<BlockedDate>) => {
        state.blockedDates.push(action.payload);
        // Sort by date
        state.blockedDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        state.error = null;
      })
      .addCase(addBlockedDate.rejected, (state, action) => {
        state.error = action.payload || 'Error al bloquear fecha';
      });

    // Add blocked date range - refetch after success
    builder
      .addCase(addBlockedDateRange.rejected, (state, action) => {
        state.error = action.payload || 'Error al bloquear fechas';
      });

    // Remove blocked date
    builder
      .addCase(removeBlockedDate.fulfilled, (state, action: PayloadAction<string>) => {
        state.blockedDates = state.blockedDates.filter((d) => d.id !== action.payload);
        state.error = null;
      })
      .addCase(removeBlockedDate.rejected, (state, action) => {
        state.error = action.payload || 'Error al desbloquear fecha';
      });
  }
});

export const { clearError } = blockedDatesSlice.actions;
export default blockedDatesSlice.reducer;
