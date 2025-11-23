"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/", 
  fallback 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, checkAuthStatus, hasAccess } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const hasValidAccess = hasAccess();
      
      if (!hasValidAccess) {
        router.push(redirectTo);
      } else {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [hasAccess, router, redirectTo]);

  if (isChecking || !hasAccess()) {
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