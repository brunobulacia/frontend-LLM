"use client";

import { useEffect } from "react";
import { setupAuthInterceptor } from "@/lib/auth-interceptor";
import { useAuthStore } from "@/store/auth.store";
import "@/utils/auth-debug"; // Importar utilidades de debug

/**
 * Componente que inicializa la configuración de autenticación
 * Debe ser usado en el layout raíz de la aplicación
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { syncTokenToCookie, checkAuthStatus, clearAuth } = useAuthStore();

  useEffect(() => {
    // Configurar interceptores de axios al cargar la app
    setupAuthInterceptor();
    
    // Verificar estado de autenticación al cargar
    const isValid = checkAuthStatus();
    
    if (isValid) {
      // Si es válido, sincronizar token a cookie
      syncTokenToCookie();
    } else {
      // Si no es válido, limpiar todo completamente
      clearAuth();
    }
  }, [syncTokenToCookie, checkAuthStatus, clearAuth]);

  return <>{children}</>;
}