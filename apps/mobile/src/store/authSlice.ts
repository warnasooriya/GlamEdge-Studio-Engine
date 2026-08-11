import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tenant } from "@/types";
import { saveSession, saveTenant, clearSession } from "@/lib/secureStore";

interface AuthState {
  token: string | null;
  tenant: Tenant | null;
  // False until the SecureStore/AsyncStorage read on launch resolves — the root
  // layout must not redirect to (auth) or (app) before this settles, or a
  // logged-in user briefly flashes the login screen on every cold start.
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  tenant: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<{ token: string | null; tenant: Tenant | null }>) {
      state.token = action.payload.token;
      state.tenant = action.payload.tenant;
      state.hydrated = true;
    },
    setAuth(state, action: PayloadAction<{ token: string; tenant: Tenant }>) {
      state.token = action.payload.token;
      state.tenant = action.payload.tenant;
      state.hydrated = true;
      saveSession(action.payload.token, action.payload.tenant);
    },
    updateTenant(state, action: PayloadAction<Tenant>) {
      state.tenant = action.payload;
      saveTenant(action.payload);
    },
    logout(state) {
      state.token = null;
      state.tenant = null;
      clearSession();
    },
  },
});

export const { hydrate, setAuth, updateTenant, logout } = authSlice.actions;
export default authSlice.reducer;
