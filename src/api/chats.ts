import axios from "@/lib/axios";

export const getChats = async () => {
  const response = await axios.get("/chats");
  return response.data;
};

export const createChat = async (nombre: string) => {
  const response = await axios.post("/chats", { nombre });
  return response.data;
};
