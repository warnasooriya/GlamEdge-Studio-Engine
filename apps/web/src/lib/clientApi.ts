import axios from "axios";
import { store } from "@/store/store";
import { clientLogout } from "@/store/clientAuthSlice";

export const clientApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

clientApi.interceptors.request.use((config) => {
  const token = store.getState().clientAuth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

clientApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(clientLogout());
    }
    return Promise.reject(error);
  }
);
