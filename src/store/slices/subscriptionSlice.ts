import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/api';
import type {
  SubscriptionPlanOption,
  CurrentSubscription,
  SubscriptionPreference,
  BillingPeriod
} from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components
// RULE: Global loading spinner for all requests

// ============================================
// STATE
// ============================================

interface SubscriptionState {
  plans: SubscriptionPlanOption[];
  currentSubscription: CurrentSubscription | null;
  preference: SubscriptionPreference | null;
  error: string | null;
  successMessage: string | null;
}

const initialState: SubscriptionState = {
  plans: [],
  currentSubscription: null,
  preference: null,
  error: null,
  successMessage: null
};

// ============================================
// ASYNC THUNKS
// ============================================

// Get available plans
export const getPlans = createAsyncThunk(
  'subscription/getPlans',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get('/subscription/plans');
      return response.data.plans;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al obtener planes');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Get current subscription
export const getMySubscription = createAsyncThunk(
  'subscription/getMySubscription',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get('/subscription/my-subscription');
      return response.data.subscription;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al obtener suscripción');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Subscribe to a plan
export const subscribeToPlan = createAsyncThunk(
  'subscription/subscribeToPlan',
  async (data: { planId: string; billingPeriod: BillingPeriod }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post('/subscription/subscribe', data);
      return response.data.preference;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al crear suscripción');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Change plan
export const changePlan = createAsyncThunk(
  'subscription/changePlan',
  async (data: { planId: string; billingPeriod: BillingPeriod }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post('/subscription/change-plan', data);
      return response.data.preference;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cambiar plan');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Cancel subscription
export const cancelSubscription = createAsyncThunk(
  'subscription/cancelSubscription',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post('/subscription/cancel');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al cancelar suscripción');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLICE
// ============================================

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearPreference: (state) => {
      state.preference = null;
    }
  },
  extraReducers: (builder) => {
    // Get plans
    builder
      .addCase(getPlans.fulfilled, (state, action) => {
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(getPlans.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Get my subscription
    builder
      .addCase(getMySubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload;
        state.error = null;
      })
      .addCase(getMySubscription.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Subscribe to plan
    builder
      .addCase(subscribeToPlan.fulfilled, (state, action) => {
        state.preference = action.payload;
        state.error = null;
      })
      .addCase(subscribeToPlan.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Change plan
    builder
      .addCase(changePlan.fulfilled, (state, action) => {
        state.preference = action.payload;
        state.error = null;
      })
      .addCase(changePlan.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Cancel subscription
    builder
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.successMessage = 'Suscripción cancelada exitosamente';
        state.error = null;
        // Clear current subscription status
        if (state.currentSubscription) {
          state.currentSubscription.status = 'CANCELLED';
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  }
});

export const { clearError, clearSuccessMessage, clearPreference } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
