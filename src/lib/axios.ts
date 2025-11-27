import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const baseURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  // Header requerido para ngrok
  config.headers.set("ngrok-skip-browser-warning", "true");

  // Si es usuario autenticado, usar token de autenticación
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

export default axiosInstance;
