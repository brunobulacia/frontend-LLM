"use client";

import Chat from "@/components/chat";
import { getMensajes } from "@/api/mensajes";
import { useState, useEffect, use } from "react";
import { Mensaje } from "@/types/mensajes";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function ChatPageContent({params} : {params: Promise<{ slug: string }>}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { slug } = use(params);
  console.log("ChatPage slug:", slug);

  useEffect(() => {
    const fetchMensajes = async () => {
      try {
        setIsLoading(true);
        const data = await getMensajes(slug);
        setMensajes(data);
      } catch (error) {
        console.error("Error al cargar mensajes:", error);
        setMensajes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMensajes();
  }, [slug]);

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

  return <Chat mensajes={mensajes} chatId={slug} />;
}

export default function ChatPage({params} : {params: Promise<{ slug: string }>}) {
  return (
    <ProtectedRoute>
      <ChatPageContent params={params} />
    </ProtectedRoute>
  );
}
