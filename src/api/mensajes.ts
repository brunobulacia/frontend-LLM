import axios from "@/lib/axios";
import { Mensaje } from "@/types/mensajes";

export const getMensajes = async (chatId: string): Promise<Mensaje[]> => {
  const response = await axios.get(`/mensajes/chat/${chatId}`);
  return response.data;
};
