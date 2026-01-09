import { createSlice } from '@reduxjs/toolkit';

// RULE: Single global loading state for ALL requests
// Never use individual loading spinners per component

interface LoadingState {
  isLoading: boolean;
  loadingCount: number; // Track multiple concurrent requests
}

const initialState: LoadingState = {
  isLoading: false,
  loadingCount: 0
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    startLoading: (state) => {
      state.loadingCount += 1;
      state.isLoading = true;
    },
    stopLoading: (state) => {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
      state.isLoading = state.loadingCount > 0;
    },
    resetLoading: (state) => {
      state.loadingCount = 0;
      state.isLoading = false;
    }
  }
});

export const { startLoading, stopLoading, resetLoading } = loadingSlice.actions;
export default loadingSlice.reducer;
