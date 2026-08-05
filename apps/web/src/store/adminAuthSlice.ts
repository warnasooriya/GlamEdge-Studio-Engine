import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Admin } from "@/types";

interface AdminAuthState {
  token: string | null;
  admin: Admin | null;
}

const initialState: AdminAuthState = {
  token: localStorage.getItem("glamedge_admin_token"),
  admin: JSON.parse(localStorage.getItem("glamedge_admin") || "null"),
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    setAdminAuth(state, action: PayloadAction<{ token: string; admin: Admin }>) {
      state.token = action.payload.token;
      state.admin = action.payload.admin;
      localStorage.setItem("glamedge_admin_token", action.payload.token);
      localStorage.setItem("glamedge_admin", JSON.stringify(action.payload.admin));
    },
    adminLogout(state) {
      state.token = null;
      state.admin = null;
      localStorage.removeItem("glamedge_admin_token");
      localStorage.removeItem("glamedge_admin");
    },
  },
});

export const { setAdminAuth, adminLogout } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
