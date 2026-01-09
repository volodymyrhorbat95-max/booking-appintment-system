import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { ApiResponse } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components

interface DepositSettings {
  depositEnabled: boolean;
  depositAmount: number | null;
}

interface DepositSettingsState {
  depositEnabled: boolean;
  depositAmount: number | null;
  error: string | null;
  lastFetched: number | null;
}

interface UpdateDepositSettingsRequest {
  depositEnabled: boolean;
  depositAmount?: number | null;
}

const initialState: DepositSettingsState = {
  depositEnabled: false,
  depositAmount: null,
  error: null,
  lastFetched: null
};

// Get deposit settings
export const getDepositSettings = createAsyncThunk<
  DepositSettings,
  void,
  { rejectValue: string }
>(
  'depositSettings/getDepositSettings',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<DepositSettings>>('/professional/deposit-settings');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener configuración de depósito');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener configuración de depósito';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Update deposit settings
export const updateDepositSettings = createAsyncThunk<
  DepositSettings,
  UpdateDepositSettingsRequest,
  { rejectValue: string }
>(
  'depositSettings/updateDepositSettings',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<DepositSettings>>('/professional/deposit-settings', data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar configuración de depósito');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al actualizar configuración de depósito';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const depositSettingsSlice = createSlice({
  name: 'depositSettings',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get deposit settings
    builder
      .addCase(getDepositSettings.fulfilled, (state, action: PayloadAction<DepositSettings>) => {
        state.depositEnabled = action.payload.depositEnabled;
        state.depositAmount = action.payload.depositAmount;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getDepositSettings.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener configuración de depósito';
      });

    // Update deposit settings
    builder
      .addCase(updateDepositSettings.fulfilled, (state, action: PayloadAction<DepositSettings>) => {
        state.depositEnabled = action.payload.depositEnabled;
        state.depositAmount = action.payload.depositAmount;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(updateDepositSettings.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar configuración de depósito';
      });
  }
});

export const { clearError } = depositSettingsSlice.actions;
export default depositSettingsSlice.reducer;
