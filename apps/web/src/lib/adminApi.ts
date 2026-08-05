import axios from "axios";
import { store } from "@/store/store";
import { adminLogout } from "@/store/adminAuthSlice";

export const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

adminApi.interceptors.request.use((config) => {
  const token = store.getState().adminAuth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(adminLogout());
    }
    return Promise.reject(error);
  }
);
