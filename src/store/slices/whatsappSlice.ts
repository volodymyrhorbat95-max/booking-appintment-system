import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type {
  ApiResponse,
  ReminderSettingInput,
  ReminderSettingsResponse,
  MessageTemplateData,
  MessageTemplatesResponse,
  MessageTemplateType,
  MessageTemplateVariable
} from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components
// RULE: Global loading spinner for all requests

// ============================================
// STATE INTERFACE
// ============================================

interface WhatsAppState {
  // Reminder settings
  reminders: ReminderSettingInput[];

  // Message templates
  templates: MessageTemplateData[];
  availableVariables: MessageTemplateVariable[];

  // State
  error: string | null;
  successMessage: string | null;
  lastFetched: number | null;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: WhatsAppState = {
  reminders: [],
  templates: [],
  availableVariables: [],
  error: null,
  successMessage: null,
  lastFetched: null
};

// ============================================
// ASYNC THUNKS - REMINDERS
// ============================================

// Get reminder settings
export const getReminderSettings = createAsyncThunk<
  ReminderSettingsResponse,
  void,
  { rejectValue: string }
>(
  'whatsapp/getReminderSettings',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<ReminderSettingsResponse>>(
        '/professional/whatsapp/reminders'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener configuración de recordatorios');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener configuración de recordatorios';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Update reminder settings
export const updateReminderSettings = createAsyncThunk<
  ReminderSettingsResponse,
  ReminderSettingInput[],
  { rejectValue: string }
>(
  'whatsapp/updateReminderSettings',
  async (reminders, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<ReminderSettingsResponse>>(
        '/professional/whatsapp/reminders',
        { reminders }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar configuración');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al actualizar configuración de recordatorios';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// ASYNC THUNKS - TEMPLATES
// ============================================

// Get message templates
export const getMessageTemplates = createAsyncThunk<
  MessageTemplatesResponse,
  void,
  { rejectValue: string }
>(
  'whatsapp/getMessageTemplates',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<MessageTemplatesResponse>>(
        '/professional/whatsapp/templates'
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener plantillas');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener plantillas de mensajes';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Update message template
interface UpdateTemplateParams {
  type: MessageTemplateType;
  messageText: string;
}

export const updateMessageTemplate = createAsyncThunk<
  MessageTemplateData,
  UpdateTemplateParams,
  { rejectValue: string }
>(
  'whatsapp/updateMessageTemplate',
  async ({ type, messageText }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<MessageTemplateData>>(
        `/professional/whatsapp/templates/${type}`,
        { messageText }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar plantilla');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al actualizar plantilla de mensaje';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Reset template to default
export const resetMessageTemplate = createAsyncThunk<
  MessageTemplateData,
  MessageTemplateType,
  { rejectValue: string }
>(
  'whatsapp/resetMessageTemplate',
  async (type, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.delete<ApiResponse<MessageTemplateData>>(
        `/professional/whatsapp/templates/${type}`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al restablecer plantilla');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al restablecer plantilla de mensaje';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// ============================================
// SLICE
// ============================================

const whatsappSlice = createSlice({
  name: 'whatsapp',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    // Get reminder settings
    builder
      .addCase(getReminderSettings.fulfilled, (state, action: PayloadAction<ReminderSettingsResponse>) => {
        state.reminders = action.payload.reminders;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getReminderSettings.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener configuración de recordatorios';
      });

    // Update reminder settings
    builder
      .addCase(updateReminderSettings.fulfilled, (state, action: PayloadAction<ReminderSettingsResponse>) => {
        state.reminders = action.payload.reminders;
        state.error = null;
        state.successMessage = 'Configuración de recordatorios guardada';
      })
      .addCase(updateReminderSettings.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar configuración';
      });

    // Get message templates
    builder
      .addCase(getMessageTemplates.fulfilled, (state, action: PayloadAction<MessageTemplatesResponse>) => {
        state.templates = action.payload.templates;
        state.availableVariables = action.payload.availableVariables;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getMessageTemplates.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener plantillas';
      });

    // Update message template
    builder
      .addCase(updateMessageTemplate.fulfilled, (state, action: PayloadAction<MessageTemplateData>) => {
        const index = state.templates.findIndex(t => t.type === action.payload.type);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.error = null;
        state.successMessage = 'Plantilla actualizada correctamente';
      })
      .addCase(updateMessageTemplate.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar plantilla';
      });

    // Reset message template
    builder
      .addCase(resetMessageTemplate.fulfilled, (state, action: PayloadAction<MessageTemplateData>) => {
        const index = state.templates.findIndex(t => t.type === action.payload.type);
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        state.error = null;
        state.successMessage = 'Plantilla restablecida a valores por defecto';
      })
      .addCase(resetMessageTemplate.rejected, (state, action) => {
        state.error = action.payload || 'Error al restablecer plantilla';
      });
  }
});

export const { clearError, clearSuccessMessage } = whatsappSlice.actions;
export default whatsappSlice.reducer;
