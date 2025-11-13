"use client";

import Chat from "@/components/chat";
import { getMensajes } from "@/api/mensajes";
import { useState, useEffect } from "react";
import { Mensaje } from "@/types/mensajes";

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMensajes = async () => {
      try {
        setIsLoading(true);
        const data = await getMensajes('2b10ee99-3a04-48d4-b139-619ed211c56c');
        setMensajes(data);
      } catch (error) {
        console.error("Error al cargar mensajes:", error);
        // En caso de error, continuar con array vacío
        setMensajes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMensajes();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Cargando mensajes...</p>
        </div>
      </div>
    );
  }

  return <Chat mensajes={mensajes} />;
}
