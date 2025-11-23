"use client";

import { useEffect } from "react";
import { setupAuthInterceptor } from "@/lib/auth-interceptor";
import { useAuthStore } from "@/store/auth.store";

/**
 * Componente que inicializa la configuración de autenticación
 * Debe ser usado en el layout raíz de la aplicación
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const syncTokenToCookie = useAuthStore((state) => state.syncTokenToCookie);

  useEffect(() => {
    // Configurar interceptores de axios al cargar la app
    setupAuthInterceptor();
    
    // Sincronizar token a cookie en caso de que ya esté logueado
    syncTokenToCookie();
  }, [syncTokenToCookie]);

  return <>{children}</>;
}