"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, } from "lucide-react";
import { toast } from "sonner";
import { LoginData, RegisterData } from "@/types/auth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { loginApi, } from "@/api/auth";

interface LoginFormData extends LoginData {}

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  
  const { setAuth, isLoading, isAuthenticated } = useAuthStore();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>();

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginApi(data);
      
      setAuth(response);
      
      toast.success("Inicio de sesión exitoso");
      console.log("Login response:", response);
      router.push("/chat");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Error al iniciar sesión");
    }
  };


  useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            FICCT Noticias
          </h1>
          <p className="text-slate-600">Iniciá sesión o crea una cuenta</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsContent value="login">
            <Card className="border border-slate-200 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-slate-900">
                  Iniciar Sesión
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Ingresa tus credenciales para acceder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  onSubmit={handleLoginSubmit(onLoginSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-slate-700 font-medium"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="pl-10 h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500"
                        {...loginRegister("email", {
                          required: "El email es requerido",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Email inválido",
                          },
                        })}
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="text-red-500 text-sm">
                        {loginErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-slate-700 font-medium"
                    >
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12 border-slate-300 focus:border-sky-500 focus:ring-sky-500"
                        {...loginRegister("password", {
                          required: "La contraseña es requerida",
                          minLength: {
                            value: 6,
                            message:
                              "La contraseña debe tener al menos 6 caracteres",
                          },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-red-500 text-sm">
                        {loginErrors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-50"
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}