import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Client } from "@/types";

interface ClientAuthState {
  token: string | null;
  client: Client | null;
}

const initialState: ClientAuthState = {
  token: localStorage.getItem("glamedge_client_token"),
  client: JSON.parse(localStorage.getItem("glamedge_client") || "null"),
};

const clientAuthSlice = createSlice({
  name: "clientAuth",
  initialState,
  reducers: {
    setClientAuth(state, action: PayloadAction<{ token: string; client: Client }>) {
      state.token = action.payload.token;
      state.client = action.payload.client;
      localStorage.setItem("glamedge_client_token", action.payload.token);
      localStorage.setItem("glamedge_client", JSON.stringify(action.payload.client));
    },
    clientLogout(state) {
      state.token = null;
      state.client = null;
      localStorage.removeItem("glamedge_client_token");
      localStorage.removeItem("glamedge_client");
    },
  },
});

export const { setClientAuth, clientLogout } = clientAuthSlice.actions;
export default clientAuthSlice.reducer;
