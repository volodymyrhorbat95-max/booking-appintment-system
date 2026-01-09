import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { ProfessionalStatistics } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components
// RULE: Global loading spinner for all requests

// ============================================
// STATE
// ============================================

interface StatisticsState {
  statistics: ProfessionalStatistics | null;
  error: string | null;
}

const initialState: StatisticsState = {
  statistics: null,
  error: null
};

// ============================================
// ASYNC THUNKS
// ============================================

// Get my statistics
export const getMyStatistics = createAsyncThunk(
  'statistics/getMyStatistics',
  async (params: { startDate?: string; endDate?: string } = {}, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const url = `/professional/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data.statistics;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al obtener estadísticas');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLICE
// ============================================

const statisticsSlice = createSlice({
  name: 'statistics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
        state.error = null;
      })
      .addCase(getMyStatistics.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

export const { clearError } = statisticsSlice.actions;
export default statisticsSlice.reducer;
