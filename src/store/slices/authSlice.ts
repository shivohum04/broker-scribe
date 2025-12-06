import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  brokerProfile: {
    whatsappName: string | null;
    whatsappContact: string | null;
  } | null;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  brokerProfile: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action: PayloadAction<{ user: User | null; session: Session | null; loading: boolean }>) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.loading = action.payload.loading;
    },
    setBrokerProfile: (state, action: PayloadAction<{ whatsappName: string | null; whatsappContact: string | null }>) => {
      state.brokerProfile = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.brokerProfile = null;
    },
  },
});

export const { setAuthState, setBrokerProfile, clearAuth } = authSlice.actions;
export default authSlice.reducer;









