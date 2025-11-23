'use client';
import AuthPage from "@/components/auth/auth";
import { PublicRoute } from "@/components/auth/PublicRoute";

export default function HomePage() {
  return (
    <PublicRoute>
      <AuthPage />
    </PublicRoute>
  );
}