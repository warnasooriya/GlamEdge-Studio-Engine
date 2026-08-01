import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import clientAuthReducer from "./clientAuthSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clientAuth: clientAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
