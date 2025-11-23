"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}


export function PublicRoute({ children, redirectTo = "/chat" }: PublicRouteProps) {
  const router = useRouter();
  const { isAuthenticated, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && checkAuthStatus()) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, checkAuthStatus, router, redirectTo]);

  return <>{children}</>;
}