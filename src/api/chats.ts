import axios from "@/lib/axios";
import { Chat } from "@/types/chats";

export const getChats = async (): Promise<Chat[]> => {
  const response = await axios.get("/chats");
  return response.data;
};

export const createChat = async (nombre: string) => {
  const response = await axios.post("/chats", { nombre });
  return response.data;
};
