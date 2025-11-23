import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { LoginResponse, AuthUser, LoginCredentials } from "@/types/auth";

const DEFAULT_USER: AuthUser = {
  id: "",
  email: "",
};

interface AuthStore {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  setAuth: (loginResponse: LoginResponse) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuthStatus: () => boolean;
  getAuthHeaders: () => { Authorization?: string };
  hasAccess: () => boolean;
  syncTokenToCookie: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      user: DEFAULT_USER,
      isLoading: false,
      error: null,

      setAuth: (loginResponse: LoginResponse) => {
        const { access_token, user } = loginResponse;

        // Guardar token en cookie para que el middleware pueda acceder
        if (typeof document !== 'undefined') {
          document.cookie = `auth-token=${access_token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 días
        }

        set({
          isAuthenticated: true,
          accessToken: access_token,
          user: {
            id: user.id,
            email: user.email,
          },
          error: null,
        });
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            throw new Error("Credenciales inválidas");
          }

          const loginResponse: LoginResponse = await response.json();

          get().setAuth(loginResponse);

          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Error de autenticación";
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            accessToken: null,
            user: DEFAULT_USER,
          });
          return false;
        }
      },

      logout: () => {
        // Eliminar token de cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }

        set({
          isAuthenticated: false,
          accessToken: null,
          user: DEFAULT_USER,
          error: null,
        });
      },

      clearAuth: () => {
        // Eliminar token de cookies
        if (typeof document !== 'undefined') {
          document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }

        set({
          isAuthenticated: false,
          accessToken: null,
          user: DEFAULT_USER,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      setError: (error: string | null) => {
        set({ error });
      },

      checkAuthStatus: () => {
        const { accessToken, user } = get();
        const isValid = !!(accessToken && user.id);

        if (!isValid) {
          get().clearAuth();
        }

        return isValid;
      },

      getAuthHeaders: () => {
        const { accessToken } = get();

        if (accessToken) {
          return {
            Authorization: `Bearer ${accessToken}`,
          };
        }

        return {};
      },

      hasAccess: () => {
        const { accessToken, user } = get();

        const isAuthenticatedUser = !!(accessToken && user.id);

        return isAuthenticatedUser;
      },

      // Función para sincronizar token en cookies (útil en hidratación)
      syncTokenToCookie: () => {
        const { accessToken } = get();
        if (accessToken && typeof document !== 'undefined') {
          document.cookie = `auth-token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);

export const useAuth = () => {
  const authStore = useAuthStore();

  return {
    ...authStore,
    isLoggedIn:
      authStore.isAuthenticated &&
      !!authStore.accessToken &&
      !!authStore.user.id,
    hasAccess: authStore.hasAccess(),
  };
};

export const getAuthToken = () => {
  return useAuthStore.getState().accessToken;
};

export const getAuthUser = () => {
  return useAuthStore.getState().user;
};

export const getAuthHeaders = () => {
  return useAuthStore.getState().getAuthHeaders();
};
