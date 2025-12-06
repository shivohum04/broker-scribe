import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Modal states
  isPropertyFormOpen: boolean;
  isProfilePopupOpen: boolean;
  isMediaViewerOpen: boolean;
  
  // Form states
  isSubmitting: boolean;
  showInfo: boolean;
  
  // Loading states
  loading: boolean;
  
  // Error states
  error: string | null;
}

const initialState: UIState = {
  isPropertyFormOpen: false,
  isProfilePopupOpen: false,
  isMediaViewerOpen: false,
  isSubmitting: false,
  showInfo: false,
  loading: false,
  error: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openPropertyForm: (state) => {
      state.isPropertyFormOpen = true;
    },
    closePropertyForm: (state) => {
      state.isPropertyFormOpen = false;
    },
    openProfilePopup: (state) => {
      state.isProfilePopupOpen = true;
    },
    closeProfilePopup: (state) => {
      state.isProfilePopupOpen = false;
    },
    openMediaViewer: (state) => {
      state.isMediaViewerOpen = true;
    },
    closeMediaViewer: (state) => {
      state.isMediaViewerOpen = false;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setShowInfo: (state, action: PayloadAction<boolean>) => {
      state.showInfo = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  openPropertyForm,
  closePropertyForm,
  openProfilePopup,
  closeProfilePopup,
  openMediaViewer,
  closeMediaViewer,
  setSubmitting,
  setShowInfo,
  setLoading,
  setError,
  clearError,
} = uiSlice.actions;

export default uiSlice.reducer;









