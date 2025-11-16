export enum TipoContenido {
  TEXTO = "TEXTO",
  IMAGEN = "IMAGEN",
  CONTENIDO_REDES_SOCIALES = "CONTENIDO_REDES_SOCIALES",
}

export enum EstadoPublicacion {
  PENDIENTE_CONFIRMACION = "PENDIENTE_CONFIRMACION",
  CONFIRMADO = "CONFIRMADO",
  PUBLICANDO = "PUBLICANDO",
  PUBLICADO = "PUBLICADO",
  ERROR = "ERROR",
}

export interface ContenidoRedesSociales {
  facebook: { caption: string };
  instagram: { caption: string };
  linkedin: { caption: string };
  whatsapp: { titulo: string };
  tiktok: { titulo: string; hashtags: string[] };
}

export interface ResultadoPublicacion {
  plataforma: string;
  exito: boolean;
  postId?: string;
  error?: string;
  link?: string;
}

export type Mensaje = {
  id: string;
  contenido: string;
  emisor: "USUARIO" | "LLM";
  chatId: string;
  tipo: TipoContenido;
  rutaImagen?: string;
  contenidoRedesSociales?: ContenidoRedesSociales;
  estadoPublicacion?: EstadoPublicacion;
  imagenGenerada?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
