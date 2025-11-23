"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Componente HOC que protege rutas requiriendo autenticación completa
 * NO permite acceso a colaboradores sin cuenta
 * Redirige a la página de invitación si es colaborador
 */
export function AuthenticatedRoute({ 
  children, 
  redirectTo = "/invitation", 
  fallback 
}: AuthenticatedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, checkAuthStatus } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
 
      const hasValidAuth = checkAuthStatus();
      
      if (!hasValidAuth) {
        console.log("🚫 Acceso denegado: Usuario no autenticado");
        router.push("/");
        return;
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, checkAuthStatus, router, redirectTo]);

    if (isChecking || !isAuthenticated) {
    return fallback || <AuthLoadingFallback />;
  }

  return <>{children}</>;
}


function AuthLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Verificando autenticación...
        </h2>
        <p className="text-muted-foreground">
          Por favor espera mientras verificamos tu sesión
        </p>
      </div>
    </div>
  );
}