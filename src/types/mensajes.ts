export type Mensaje = {
  id: string;
  contenido: string;
  emisor: "USUARIO" | "LLM";
  chatId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
