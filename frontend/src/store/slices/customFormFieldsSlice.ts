import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';
import type { CustomFormField, ApiResponse } from '../../types';
import { startLoading, stopLoading } from './loadingSlice';

// RULE: All API calls go through Redux, NO direct calls from components

// Extended CustomFormField with isFixed flag
interface FormField extends Omit<CustomFormField, 'professionalId' | 'professional' | 'values' | 'createdAt' | 'updatedAt'> {
  isFixed: boolean;
}

interface CustomFormFieldsState {
  fixedFields: FormField[];
  customFields: FormField[];
  allFields: FormField[];
  error: string | null;
  lastFetched: number | null;
}

interface GetFormFieldsResponse {
  fixedFields: FormField[];
  customFields: FormField[];
  allFields: FormField[];
}

interface AddCustomFieldRequest {
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  options?: string[];
}

interface UpdateCustomFieldRequest {
  id: string;
  fieldName: string;
  fieldType: string;
  isRequired: boolean;
  options?: string[];
}

const initialState: CustomFormFieldsState = {
  fixedFields: [],
  customFields: [],
  allFields: [],
  error: null,
  lastFetched: null
};

// Get form fields
export const getFormFields = createAsyncThunk<
  GetFormFieldsResponse,
  void,
  { rejectValue: string }
>(
  'customFormFields/getFormFields',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.get<ApiResponse<GetFormFieldsResponse>>('/professional/form-fields');

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al obtener campos del formulario');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al obtener campos del formulario';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Add custom field
export const addCustomField = createAsyncThunk<
  FormField,
  AddCustomFieldRequest,
  { rejectValue: string }
>(
  'customFormFields/addCustomField',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.post<ApiResponse<FormField>>('/professional/form-fields', data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al crear campo personalizado');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al crear campo personalizado';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Update custom field
export const updateCustomField = createAsyncThunk<
  FormField,
  UpdateCustomFieldRequest,
  { rejectValue: string }
>(
  'customFormFields/updateCustomField',
  async ({ id, ...data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<FormField>>(`/professional/form-fields/${id}`, data);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al actualizar campo personalizado');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al actualizar campo personalizado';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Delete custom field
export const deleteCustomField = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'customFormFields/deleteCustomField',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.delete<ApiResponse<void>>(`/professional/form-fields/${id}`);

      if (response.data.success) {
        return id;
      }

      return rejectWithValue(response.data.error || 'Error al eliminar campo personalizado');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al eliminar campo personalizado';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// Reorder custom fields
export const reorderCustomFields = createAsyncThunk<
  FormField[],
  string[],
  { rejectValue: string }
>(
  'customFormFields/reorderCustomFields',
  async (fieldIds, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await api.put<ApiResponse<FormField[]>>('/professional/form-fields/reorder/batch', { fieldIds });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      return rejectWithValue(response.data.error || 'Error al reordenar campos');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      const message = err.response?.data?.error || 'Error al reordenar campos';
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const customFormFieldsSlice = createSlice({
  name: 'customFormFields',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get form fields
    builder
      .addCase(getFormFields.fulfilled, (state, action: PayloadAction<GetFormFieldsResponse>) => {
        state.fixedFields = action.payload.fixedFields;
        state.customFields = action.payload.customFields;
        state.allFields = action.payload.allFields;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(getFormFields.rejected, (state, action) => {
        state.error = action.payload || 'Error al obtener campos del formulario';
      });

    // Add custom field
    builder
      .addCase(addCustomField.fulfilled, (state, action: PayloadAction<FormField>) => {
        state.customFields.push(action.payload);
        state.allFields = [...state.fixedFields, ...state.customFields];
        state.error = null;
      })
      .addCase(addCustomField.rejected, (state, action) => {
        state.error = action.payload || 'Error al crear campo personalizado';
      });

    // Update custom field
    builder
      .addCase(updateCustomField.fulfilled, (state, action: PayloadAction<FormField>) => {
        const index = state.customFields.findIndex((f) => f.id === action.payload.id);
        if (index !== -1) {
          state.customFields[index] = action.payload;
          state.allFields = [...state.fixedFields, ...state.customFields];
        }
        state.error = null;
      })
      .addCase(updateCustomField.rejected, (state, action) => {
        state.error = action.payload || 'Error al actualizar campo personalizado';
      });

    // Delete custom field
    builder
      .addCase(deleteCustomField.fulfilled, (state, action: PayloadAction<string>) => {
        state.customFields = state.customFields.filter((f) => f.id !== action.payload);
        state.allFields = [...state.fixedFields, ...state.customFields];
        state.error = null;
      })
      .addCase(deleteCustomField.rejected, (state, action) => {
        state.error = action.payload || 'Error al eliminar campo personalizado';
      });

    // Reorder custom fields
    builder
      .addCase(reorderCustomFields.fulfilled, (state, action: PayloadAction<FormField[]>) => {
        state.customFields = action.payload;
        state.allFields = [...state.fixedFields, ...state.customFields];
        state.error = null;
      })
      .addCase(reorderCustomFields.rejected, (state, action) => {
        state.error = action.payload || 'Error al reordenar campos';
      });
  }
});

export const { clearError } = customFormFieldsSlice.actions;
export default customFormFieldsSlice.reducer;
