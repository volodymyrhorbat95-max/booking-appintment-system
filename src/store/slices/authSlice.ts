import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { User, Professional, LoginRequest, ApiResponse, LoginResponse, GoogleAuthResponse } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components

interface AuthState {
  user: Omit<User, 'password'> | null;
  professional: Professional | null;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  professional: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  error: null
};

// Admin login thunk
export const adminLogin = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>(
  'auth/adminLogin',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/admin/login', credentials);

      if (response.data.success && response.data.data) {
        localStorage.setItem('token', response.data.data.token);
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Login failed');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Professional Google login thunk
export const professionalGoogleLogin = createAsyncThunk<
  GoogleAuthResponse,
  string, // Google ID token
  { rejectValue: string }
>(
  'auth/professionalGoogleLogin',
  async (idToken, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<GoogleAuthResponse>>('/professional/auth/google', { idToken });

      if (response.data.success && response.data.data) {
        localStorage.setItem('token', response.data.data.token);
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Google login failed');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Google login failed';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Get current user thunk
export const getCurrentUser = createAsyncThunk<
  { user: Omit<User, 'password'>; professional?: Professional },
  void,
  { rejectValue: string }
>(
  'auth/getCurrentUser',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<any>>('/auth/me');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Failed to get user');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to get user';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Logout thunk
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      dispatch(startLoading());
      await api.post('/auth/logout');
      localStorage.removeItem('token');
    } catch (error: any) {
      // Even if API fails, clear local storage
      localStorage.removeItem('token');
    } finally {
      dispatch(stopLoading());
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.professional = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    }
  },
  extraReducers: (builder) => {
    // Admin login
    builder
      .addCase(adminLogin.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });

    // Professional Google login
    builder
      .addCase(professionalGoogleLogin.fulfilled, (state, action: PayloadAction<GoogleAuthResponse>) => {
        state.user = action.payload.user;
        state.professional = action.payload.professional;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(professionalGoogleLogin.rejected, (state, action) => {
        state.error = action.payload || 'Google login failed';
        state.isAuthenticated = false;
      });

    // Get current user
    builder
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.professional = action.payload.professional || null;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.error = action.payload || 'Failed to get user';
        state.user = null;
        state.professional = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.professional = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  }
});

export const { clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
