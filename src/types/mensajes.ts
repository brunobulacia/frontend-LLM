export enum TipoContenido {
  TEXTO = "TEXTO",
  IMAGEN = "IMAGEN",
}

export type Mensaje = {
  id: string;
  contenido: string;
  emisor: "USUARIO" | "LLM";
  chatId: string;
  tipo: TipoContenido;
  rutaImagen?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
