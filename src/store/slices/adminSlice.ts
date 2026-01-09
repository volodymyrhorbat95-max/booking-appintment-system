import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type {
  ApiResponse,
  AdminDashboardStats,
  AdminProfessional,
  AdminProfessionalDetail,
  AdminProfessionalsResponse,
  AdminPlan,
  AdminPlatformSettings,
  AdminStatistics
} from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components
// RULE: Global loading spinner for all requests

// ============================================
// STATE INTERFACE
// ============================================

interface AdminState {
  // Dashboard
  dashboardStats: AdminDashboardStats | null;

  // Professionals
  professionals: AdminProfessional[];
  professionalsPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  selectedProfessional: AdminProfessionalDetail | null;

  // Plans
  plans: AdminPlan[];

  // Settings
  settings: AdminPlatformSettings | null;

  // Statistics
  statistics: AdminStatistics | null;

  // State
  error: string | null;
  successMessage: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: AdminState = {
  dashboardStats: null,
  professionals: [],
  professionalsPagination: null,
  selectedProfessional: null,
  plans: [],
  settings: null,
  statistics: null,
  error: null,
  successMessage: null
};

// ============================================
// ASYNC THUNKS - DASHBOARD
// ============================================

export const getDashboardStats = createAsyncThunk<
  AdminDashboardStats,
  void,
  { rejectValue: string }
>(
  'admin/getDashboardStats',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener estadísticas');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al obtener estadísticas');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// ASYNC THUNKS - PROFESSIONALS
// ============================================

interface GetProfessionalsParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const getProfessionals = createAsyncThunk<
  AdminProfessionalsResponse,
  GetProfessionalsParams | void,
  { rejectValue: string }
>(
  'admin/getProfessionals',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());

      const queryParams = new URLSearchParams();
      if (params) {
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
      }

      const url = `/admin/professionals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ApiResponse<AdminProfessionalsResponse>>(url);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener profesionales');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al obtener profesionales');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const getProfessionalDetail = createAsyncThunk<
  AdminProfessionalDetail,
  string,
  { rejectValue: string }
>(
  'admin/getProfessionalDetail',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AdminProfessionalDetail>>(`/admin/professionals/${id}`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener detalles');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al obtener detalles del profesional');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const suspendProfessional = createAsyncThunk<
  { id: string; message: string },
  { id: string; reason?: string },
  { rejectValue: string }
>(
  'admin/suspendProfessional',
  async ({ id, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<{ message: string }>>(`/admin/professionals/${id}/suspend`, { reason });

      if (response.data.success) {
        return { id, message: response.data.message || 'Profesional suspendido' };
      }

      return rejectWithValue(response.data.error || 'Error al suspender');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al suspender profesional');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const activateProfessional = createAsyncThunk<
  { id: string; message: string },
  string,
  { rejectValue: string }
>(
  'admin/activateProfessional',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<{ message: string }>>(`/admin/professionals/${id}/activate`);

      if (response.data.success) {
        return { id, message: response.data.message || 'Profesional activado' };
      }

      return rejectWithValue(response.data.error || 'Error al activar');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al activar profesional');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// ASYNC THUNKS - PLANS
// ============================================

export const getPlans = createAsyncThunk<
  AdminPlan[],
  void,
  { rejectValue: string }
>(
  'admin/getPlans',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AdminPlan[]>>('/admin/plans');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener planes');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al obtener planes');
    } finally {
      dispatch(stopLoading());
    }
  }
);

interface CreatePlanParams {
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isActive?: boolean;
}

export const createPlan = createAsyncThunk<
  AdminPlan,
  CreatePlanParams,
  { rejectValue: string }
>(
  'admin/createPlan',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<AdminPlan>>('/admin/plans', params);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al crear plan');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al crear plan');
    } finally {
      dispatch(stopLoading());
    }
  }
);

interface UpdatePlanParams {
  id: string;
  name?: string;
  description?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  features?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

export const updatePlan = createAsyncThunk<
  AdminPlan,
  UpdatePlanParams,
  { rejectValue: string }
>(
  'admin/updatePlan',
  async ({ id, ...params }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<AdminPlan>>(`/admin/plans/${id}`, params);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar plan');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al actualizar plan');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const deletePlan = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'admin/deletePlan',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.delete<ApiResponse<void>>(`/admin/plans/${id}`);

      if (response.data.success) {
        return id;
      }

      return rejectWithValue(response.data.error || 'Error al eliminar plan');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al eliminar plan');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Reorder plans - updates displayOrder for all plans in the database
export const reorderPlans = createAsyncThunk<
  string[],
  string[],
  { rejectValue: string }
>(
  'admin/reorderPlans',
  async (planIds, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<{ message: string }>>('/admin/plans/reorder', { planIds });

      if (response.data.success) {
        return planIds;
      }

      return rejectWithValue(response.data.error || 'Error al reordenar planes');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al reordenar planes');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// ASYNC THUNKS - SETTINGS
// ============================================

export const getSettings = createAsyncThunk<
  AdminPlatformSettings,
  void,
  { rejectValue: string }
>(
  'admin/getSettings',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<AdminPlatformSettings>>('/admin/settings');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener configuración');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al obtener configuración');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateSettings = createAsyncThunk<
  AdminPlatformSettings,
  Partial<AdminPlatformSettings>,
  { rejectValue: string }
>(
  'admin/updateSettings',
  async (settings, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<void>>('/admin/settings', settings);

      if (response.data.success) {
        return settings as AdminPlatformSettings;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar configuración');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al actualizar configuración');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// ASYNC THUNKS - STATISTICS
// ============================================

interface GetStatisticsParams {
  startDate?: string;
  endDate?: string;
}

export const getStatistics = createAsyncThunk<
  AdminStatistics,
  GetStatisticsParams | void,
  { rejectValue: string }
>(
  'admin/getStatistics',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());

      const queryParams = new URLSearchParams();
      if (params) {
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
      }

      const url = `/admin/statistics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get<ApiResponse<AdminStatistics>>(url);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener estadísticas');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Error al obtener estadísticas');
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLICE
// ============================================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearSelectedProfessional: (state) => {
      state.selectedProfessional = null;
    }
  },
  extraReducers: (builder) => {
    // Dashboard
    builder
      .addCase(getDashboardStats.fulfilled, (state, action: PayloadAction<AdminDashboardStats>) => {
        state.dashboardStats = action.payload;
        state.error = null;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener estadísticas';
      });

    // Professionals
    builder
      .addCase(getProfessionals.fulfilled, (state, action: PayloadAction<AdminProfessionalsResponse>) => {
        state.professionals = action.payload.professionals;
        state.professionalsPagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getProfessionals.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener profesionales';
      });

    builder
      .addCase(getProfessionalDetail.fulfilled, (state, action: PayloadAction<AdminProfessionalDetail>) => {
        state.selectedProfessional = action.payload;
        state.error = null;
      })
      .addCase(getProfessionalDetail.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener detalles';
      });

    builder
      .addCase(suspendProfessional.fulfilled, (state, action) => {
        const index = state.professionals.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.professionals[index].isSuspended = true;
        }
        if (state.selectedProfessional?.id === action.payload.id) {
          state.selectedProfessional.isSuspended = true;
        }
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(suspendProfessional.rejected, (state, action) => {
        state.error = action.payload || 'Error al suspender';
      });

    builder
      .addCase(activateProfessional.fulfilled, (state, action) => {
        const index = state.professionals.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.professionals[index].isSuspended = false;
          state.professionals[index].isActive = true;
        }
        if (state.selectedProfessional?.id === action.payload.id) {
          state.selectedProfessional.isSuspended = false;
          state.selectedProfessional.isActive = true;
        }
        state.successMessage = action.payload.message;
        state.error = null;
      })
      .addCase(activateProfessional.rejected, (state, action) => {
        state.error = action.payload || 'Error al activar';
      });

    // Plans
    builder
      .addCase(getPlans.fulfilled, (state, action: PayloadAction<AdminPlan[]>) => {
        state.plans = action.payload;
        state.error = null;
      })
      .addCase(getPlans.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener planes';
      });

    builder
      .addCase(createPlan.fulfilled, (state, action: PayloadAction<AdminPlan>) => {
        state.plans.push(action.payload);
        state.successMessage = 'Plan creado correctamente';
        state.error = null;
      })
      .addCase(createPlan.rejected, (state, action) => {
        state.error = action.payload || 'Error al crear plan';
      });

    builder
      .addCase(updatePlan.fulfilled, (state, action: PayloadAction<AdminPlan>) => {
        const index = state.plans.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.plans[index] = action.payload;
        }
        state.successMessage = 'Plan actualizado correctamente';
        state.error = null;
      })
      .addCase(updatePlan.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar plan';
      });

    builder
      .addCase(deletePlan.fulfilled, (state, action: PayloadAction<string>) => {
        state.plans = state.plans.filter(p => p.id !== action.payload);
        state.successMessage = 'Plan eliminado correctamente';
        state.error = null;
      })
      .addCase(deletePlan.rejected, (state, action) => {
        state.error = action.payload || 'Error al eliminar plan';
      });

    // Reorder plans
    builder
      .addCase(reorderPlans.fulfilled, (state, action: PayloadAction<string[]>) => {
        // Reorder plans array based on the new order of IDs
        const orderedPlans: AdminPlan[] = [];
        for (const id of action.payload) {
          const plan = state.plans.find(p => p.id === id);
          if (plan) {
            orderedPlans.push({ ...plan, displayOrder: orderedPlans.length + 1 });
          }
        }
        state.plans = orderedPlans;
        state.successMessage = 'Orden de planes actualizado';
        state.error = null;
      })
      .addCase(reorderPlans.rejected, (state, action) => {
        state.error = action.payload || 'Error al reordenar planes';
      });

    // Settings
    builder
      .addCase(getSettings.fulfilled, (state, action: PayloadAction<AdminPlatformSettings>) => {
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener configuración';
      });

    builder
      .addCase(updateSettings.fulfilled, (state, action: PayloadAction<AdminPlatformSettings>) => {
        state.settings = { ...state.settings, ...action.payload };
        state.successMessage = 'Configuración actualizada';
        state.error = null;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar configuración';
      });

    // Statistics
    builder
      .addCase(getStatistics.fulfilled, (state, action: PayloadAction<AdminStatistics>) => {
        state.statistics = action.payload;
        state.error = null;
      })
      .addCase(getStatistics.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener estadísticas';
      });
  }
});

export const { clearError, clearSuccessMessage, clearSelectedProfessional } = adminSlice.actions;
export default adminSlice.reducer;
