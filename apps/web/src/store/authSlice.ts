import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tenant } from "@/types";

interface AuthState {
  token: string | null;
  tenant: Tenant | null;
}

const initialState: AuthState = {
  token: localStorage.getItem("glamedge_token"),
  tenant: JSON.parse(localStorage.getItem("glamedge_tenant") || "null"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; tenant: Tenant }>) {
      state.token = action.payload.token;
      state.tenant = action.payload.tenant;
      localStorage.setItem("glamedge_token", action.payload.token);
      localStorage.setItem("glamedge_tenant", JSON.stringify(action.payload.tenant));
    },
    updateTenant(state, action: PayloadAction<Tenant>) {
      state.tenant = action.payload;
      localStorage.setItem("glamedge_tenant", JSON.stringify(action.payload));
    },
    logout(state) {
      state.token = null;
      state.tenant = null;
      localStorage.removeItem("glamedge_token");
      localStorage.removeItem("glamedge_tenant");
    },
  },
});

export const { setAuth, updateTenant, logout } = authSlice.actions;
export default authSlice.reducer;
