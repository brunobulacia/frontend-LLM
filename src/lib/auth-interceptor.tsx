import axios from "axios";
import { getAuthToken, useAuthStore } from "@/store/auth.store";


export function setupAuthInterceptor() {
  axios.interceptors.request.use(
    (config) => {
      const token = getAuthToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        const { logout } = useAuthStore.getState();
        logout();

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/")
        ) {
          window.location.href = "/";
        }
      }

      return Promise.reject(error);
    }
  );
}


export function createAuthenticatedRequest() {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No hay token de autenticación disponible");
  }

  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}


export function useAuthenticatedAxios() {
  const token = getAuthToken();

  return axios.create({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}