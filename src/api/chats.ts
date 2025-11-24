import axios from "@/lib/axios";
import { Chat } from "@/types/chats";

export const getChats = async (): Promise<Chat[]> => {
  const response = await axios.get("/chats");
  return response.data;
};

export const createChat = async (nombre: string, userId: string) => {
  const response = await axios.post("/chats", { nombre, userId });
  return response.data;
};

export const deleteChat = async (chatId: string) => {
  const response = await axios.delete(`/chats/${chatId}`);
  return response.data;
};
