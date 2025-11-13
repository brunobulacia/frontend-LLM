"use client";

import Chat from "@/components/chat";
import { getMensajes } from "@/api/mensajes";
import { useState, useEffect } from "react";
import { Mensaje } from "@/types/mensajes";

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  useEffect(() => {
    const fetchMensajes = async () => {
      const data = await getMensajes('2b10ee99-3a04-48d4-b139-619ed211c56c');
      setMensajes(data);
    };
    fetchMensajes();
  }, []);


  console.log(mensajes);


  return <>
    <Chat mensajes={mensajes}/>
  </>;
}
