"use client"

import { useSocket } from "@/hooks/socket/useSocket";
import { Mensaje, TipoContenido, ContenidoRedesSociales, EstadoPublicacion, ResultadoPublicacion } from "@/types/mensajes";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Clock, CheckCircle, AlertCircle, ExternalLink, Send } from "lucide-react";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isStreaming?: boolean;
  type?: 'text' | 'image' | 'social-content';
  imageUrl?: string;
  modelUsed?: string;
  revisedPrompt?: string;
  contenidoRedesSociales?: ContenidoRedesSociales;
  estadoPublicacion?: EstadoPublicacion;
  imagenGenerada?: string;
  mensajeId?: string;
}

interface ChatProps {
  mensajes: Mensaje[];
  chatId: string;
}

export default function Chat({ mensajes, chatId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [publishingResults, setPublishingResults] = useState<Record<string, ResultadoPublicacion[]>>({});
  const [aiVideoStatus, setAiVideoStatus] = useState<Record<string, { status: string; message: string; progress?: number }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset } = useForm<{ message: string }>();

  const socket = useSocket();

  //PARA CARGAR LOS MENSAJES VIA REST API CUANDO SE RECARGA LA PAGINA
  useEffect(() => {
    if (mensajes && mensajes.length > 0) {
      const formattedMessages = mensajes.map(msg => ({
        id: msg.id,
        content: msg.contenido,
        sender: msg.emisor === "USUARIO" ? "user" as const : "bot" as const,
        timestamp: new Date(msg.createdAt),
        isStreaming: false,
        type: msg.tipo === TipoContenido.IMAGEN 
          ? "image" as const 
          : msg.tipo === TipoContenido.CONTENIDO_REDES_SOCIALES 
            ? "social-content" as const 
            : "text" as const,
        imageUrl: msg.rutaImagen ? `${BACKEND_BASE_URL}/images/${msg.rutaImagen}` : undefined,
        contenidoRedesSociales: msg.contenidoRedesSociales,
        estadoPublicacion: msg.estadoPublicacion,
        imagenGenerada: msg.rutaImagen ? `${BACKEND_BASE_URL}/images/${msg.rutaImagen}` : undefined,
        mensajeId: msg.id
      }));
      setMessages(formattedMessages);
    } else {
      // Si no hay mensajes (nuevo chat), limpiar
      setMessages([]);
    }
  }, [mensajes, chatId]); // Recargar cuando cambian mensajes o chatId

  // Manejar respuestas del WebSocket en tiempo real
  useEffect(() => {
    if (!socket) return;

    let streamTimeout: NodeJS.Timeout;

    // Evento para respuestas de texto (original)
    socket.on("prompt-response", (data) => {
      setIsTyping(false);
      
      setMessages(prev => {
        // Si el último mensaje es del bot y está siendo actualizado (streaming)
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.sender === 'bot' && lastMessage.isStreaming && lastMessage.type === 'text') {
          // Actualizar el último mensaje del bot con el contenido nuevo
          return prev.map((msg, index) => 
            index === prev.length - 1 
              ? { ...msg, content: data.respuesta }
              : msg
          );
        } else {
          // Crear un nuevo mensaje del bot
          return [...prev, {
            id: `bot-${Date.now()}`,
            content: data.respuesta,
            sender: 'bot',
            timestamp: new Date(),
            isStreaming: true,
            type: 'text'
          }];
        }
      });

      // Limpiar timeout anterior y crear uno nuevo
      clearTimeout(streamTimeout);
      streamTimeout = setTimeout(() => {
        setMessages(prev => 
          prev.map((msg, index) => 
            index === prev.length - 1 && msg.sender === 'bot' 
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
      }, 1000); 
    });

    // Nuevos eventos para manejo de imágenes
    socket.on('image-generation-start', (data) => {
      console.log('Iniciando generación de imagen...', data);
      setIsTyping(true);
      
      // Agregar mensaje temporal de "generando imagen"
      setMessages(prev => [
        ...prev,
        {
          id: `loading-${Date.now()}`,
          content: data.message || 'Generando imagen con DALL-E...',
          sender: 'bot',
          timestamp: new Date(),
          isStreaming: true,
          type: 'text',
        },
      ]);
    });

    socket.on('image-generation-complete', (data) => {
      console.log('🖼️ Imagen completa recibida:', data);
      console.log('📍 imageUrl recibida:', data.imageUrl);
      console.log('🤖 Modelo usado:', data.modelUsed);
      
      // Probar si la URL responde correctamente
      fetch(data.imageUrl)
        .then(response => {
          console.log('🔍 Test de URL de imagen:', response.status, response.statusText);
          if (!response.ok) {
            console.error('❌ El endpoint de imágenes no está funcionando correctamente');
            console.error('❌ Verificar que el ImagesController esté registrado en el backend');
          }
        })
        .catch(error => {
          console.error('❌ Error al acceder a la URL de imagen:', error);
        });
      
      setIsTyping(false);
      
      setMessages(prev => {
        // Remover mensajes temporales de carga
        const cleanMessages = prev.filter(msg => !msg.id.startsWith('loading-'));

        const newMessage = {
          id: `image-final-${Date.now()}`,
          content: 'Imagen generada exitosamente',
          sender: 'bot' as const,
          timestamp: new Date(),
          isStreaming: false,
          type: 'image' as const,
          imageUrl: data.imageUrl,
          modelUsed: data.modelUsed,
          revisedPrompt: data.revisedPrompt,
        };

        console.log('✅ Agregando mensaje de imagen al estado:', newMessage);

        return [
          ...cleanMessages,
          newMessage,
        ];
      });
    });

    socket.on('image-generation-error', (data) => {
      console.error('Error generando imagen:', data);
      setIsTyping(false);
      
      setMessages(prev => {
        const cleanMessages = prev.filter(
          msg => !msg.id.startsWith('loading-')
        );
        return [
          ...cleanMessages,
          {
            id: `error-${Date.now()}`,
            content: data.error,
            sender: 'bot',
            timestamp: new Date(),
            isStreaming: false,
            type: 'text',
          },
        ];
      });
    });

    // Eventos para contenido de redes sociales
    socket.on('social-content-generated', (data) => {
      console.log('📱 Contenido de redes sociales generado:', data);
      setIsTyping(false);
      
      setMessages(prev => {
        const cleanMessages = prev.filter(msg => !msg.isStreaming || msg.sender !== 'bot');

        return [
          ...cleanMessages,
          {
            id: `social-${Date.now()}`,
            content: 'Contenido para redes sociales generado. Generando imagen...',
            sender: 'bot',
            timestamp: new Date(),
            isStreaming: false,
            type: 'social-content',
            contenidoRedesSociales: data.contenido,
            estadoPublicacion: EstadoPublicacion.PENDIENTE_CONFIRMACION,
          },
        ];
      });
    });

    socket.on('social-image-generation-complete', (data) => {
      console.log('🖼️ Imagen para redes sociales completada:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.type === 'social-content' && msg.estadoPublicacion === EstadoPublicacion.PENDIENTE_CONFIRMACION
          ? {
              ...msg,
              imagenGenerada: data.imageUrl,
              content: 'Contenido para redes sociales listo para publicar',
              mensajeId: data.mensajeId
            }
          : msg
      ));
    });

    socket.on('social-publish-start', (data) => {
      console.log('🚀 Inicio de publicación:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.mensajeId === data.mensajeId
          ? { ...msg, estadoPublicacion: EstadoPublicacion.PUBLICANDO }
          : msg
      ));
    });

    socket.on('social-publish-complete', (data) => {
      console.log('✅ Publicación completada:', data);
      
      setPublishingResults(prev => ({
        ...prev,
        [data.mensajeId]: data.resultados
      }));
      
      setMessages(prev => prev.map(msg => 
        msg.mensajeId === data.mensajeId
          ? { ...msg, estadoPublicacion: EstadoPublicacion.PUBLICADO }
          : msg
      ));
    });

    socket.on('social-publish-error', (data) => {
      console.error('❌ Error en publicación:', data);
      
      setMessages(prev => prev.map(msg => 
        msg.mensajeId === data.mensajeId
          ? { ...msg, estadoPublicacion: EstadoPublicacion.ERROR }
          : msg
      ));
    });

    // Eventos para videos IA
    socket.on('ai-video-status', (data) => {
      console.log('🤖 Estado video IA:', data);
      
      setAiVideoStatus(prev => ({
        ...prev,
        [data.mensajeId]: {
          status: data.status,
          message: data.message,
          progress: data.progress
        }
      }));
    });

    socket.on('ai-video-complete', (data) => {
      console.log('✅ Video IA completado:', data);
      
      setPublishingResults(prev => ({
        ...prev,
        [data.mensajeId]: data.resultados
      }));
      
      setAiVideoStatus(prev => ({
        ...prev,
        [data.mensajeId]: {
          status: 'completed',
          message: data.message,
          progress: 100
        }
      }));
      
      setMessages(prev => prev.map(msg => 
        msg.mensajeId === data.mensajeId
          ? { ...msg, estadoPublicacion: EstadoPublicacion.PUBLICADO }
          : msg
      ));
    });

    socket.on('ai-video-error', (data) => {
      console.error('❌ Error video IA:', data);
      
      setAiVideoStatus(prev => ({
        ...prev,
        [data.mensajeId]: {
          status: 'error',
          message: data.message || data.error,
          progress: 0
        }
      }));
      
      setMessages(prev => prev.map(msg => 
        msg.mensajeId === data.mensajeId
          ? { ...msg, estadoPublicacion: EstadoPublicacion.ERROR }
          : msg
      ));
    });

    return () => {
      socket.off("prompt-response");
      socket.off('image-generation-start');
      socket.off('image-generation-complete');
      socket.off('image-generation-error');
      socket.off('social-content-generated');
      socket.off('social-image-generation-complete');
      socket.off('social-publish-start');
      socket.off('social-publish-complete');
      socket.off('social-publish-error');
      socket.off('ai-video-status');
      socket.off('ai-video-complete');
      socket.off('ai-video-error');
      clearTimeout(streamTimeout);
    };
  }, [socket]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const onSubmit = (data: { message: string }) => {
    if (!data.message.trim() || !socket) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: data.message,
      sender: 'user',
      timestamp: new Date(),
      isStreaming: false,
      type: 'text' // Siempre texto para mensajes del usuario
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    console.log("Enviando prompt:", data.message);
    
    // Siempre enviar como prompt genérico - el backend decide qué hacer
    socket.emit("prompt", { 
      chatId: chatId, 
      prompt: data.message
    });
    
    reset();
  };

  const confirmarPublicacion = (mensajeId: string) => {
    if (!socket) return;
    
    console.log('🚀 Confirmando publicación para mensaje:', mensajeId);
    socket.emit('confirm-social-publish', {
      mensajeId: mensajeId,
      chatId: chatId
    });
  };

  return (
    <div className="chat-container flex flex-col h-screen w-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">FICCT Noticias</h1>
        <p className="text-sm text-gray-500">Escribe tu mensaje para generar contenido o imágenes</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="w-full space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium">¡Hola! ¿En qué puedo ayudarte?</p>
              <p className="text-sm mt-2">Puedo ayudarte a generar texto o imágenes. Solo escribe tu mensaje y yo me encargo del resto.</p>
            </div>
          )}

          {messages.map((message) => {
            if (message.type === 'image') {
              console.log('🖼️ Renderizando mensaje de imagen:', message);
            }
            
            return (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-6 py-4 rounded-2xl min-w-[100px] ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-sm max-w-[75%]' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm max-w-[85%]'
              }`}>

                {/* Renderizar contenido según el tipo */}
                {message.type === 'image' ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">{message.content}</p>
                    
                    {message.imageUrl ? (
                      <div className="relative">
                        <img
                          src={message.imageUrl}
                          alt="Imagen generada"
                          className="max-w-full h-auto rounded-lg"
                          onLoad={() => {
                            console.log('🖼️ Imagen cargada correctamente:', message.imageUrl);
                            scrollToBottom();
                          }}
                          onError={(e) => {
                            console.error('❌ Error cargando imagen:', message.imageUrl, e);
                            console.error('❌ Verificar que el backend tenga configurado el endpoint /images/:filename');
                          }}
                        />
                        {message.modelUsed && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            {message.modelUsed.toUpperCase()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative bg-gray-100 rounded-lg p-8 text-center">
                        <div className="text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm">Imagen no disponible</p>
                          <p className="text-xs text-gray-400 mt-1">Verificar configuración del backend</p>
                        </div>
                      </div>
                    )}
                    
                    {message.revisedPrompt && message.revisedPrompt !== message.content && (
                      <p className="text-xs text-gray-500 italic">
                        Prompt mejorado: {message.revisedPrompt}
                      </p>
                    )}
                  </div>
                ) : message.type === 'social-content' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600">Contenido para Redes Sociales</span>
                      {/* Estado de la publicación */}
                      {message.estadoPublicacion === EstadoPublicacion.PENDIENTE_CONFIRMACION && (
                        <span className="flex items-center gap-1 text-orange-600 text-sm">
                          <Clock className="w-4 h-4" />
                          Pendiente
                        </span>
                      )}
                      {message.estadoPublicacion === EstadoPublicacion.PUBLICANDO && (
                        <span className="flex items-center gap-1 text-blue-600 text-sm">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          Publicando...
                        </span>
                      )}
                      {message.estadoPublicacion === EstadoPublicacion.PUBLICADO && (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Publicado
                        </span>
                      )}
                      {message.estadoPublicacion === EstadoPublicacion.ERROR && (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Error
                        </span>
                      )}
                    </div>

                    {/* Imagen generada para redes sociales */}
                    {message.imagenGenerada && (
                      <div className="relative">
                        <img
                          src={message.imagenGenerada.startsWith('http') 
                            ? message.imagenGenerada 
                            : `${BACKEND_BASE_URL}/images/${message.imagenGenerada}`}
                          alt="Imagen para redes sociales"
                          className="max-w-full h-auto rounded-lg border"
                          onLoad={() => {
                            console.log('🖼️ Imagen de redes sociales cargada:', message.imagenGenerada);
                          }}
                          onError={(e) => {
                            console.error('❌ Error cargando imagen de redes sociales:', message.imagenGenerada);
                            console.error('❌ URL intentada:', e.currentTarget.src);
                          }}
                        />
                      </div>
                    )}

                    {/* Contenido de cada red social */}
                    {message.contenidoRedesSociales && (
                      <div className="space-y-3">
                        <div className="grid gap-3">
                          {/* Facebook */}
                          <div className="border rounded-lg p-3 bg-blue-50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">f</div>
                              <span className="font-medium">Facebook</span>
                            </div>
                            <p className="text-sm text-gray-700">{message.contenidoRedesSociales.facebook.caption}</p>
                          </div>

                          {/* Instagram */}
                          <div className="border rounded-lg p-3 bg-gradient-to-br from-purple-50 to-pink-50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-pink-600 rounded text-white text-xs flex items-center justify-center font-bold">📷</div>
                              <span className="font-medium">Instagram</span>
                            </div>
                            <p className="text-sm text-gray-700">{message.contenidoRedesSociales.instagram.caption}</p>
                          </div>

                          {/* LinkedIn */}
                          <div className="border rounded-lg p-3 bg-blue-50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">in</div>
                              <span className="font-medium">LinkedIn</span>
                            </div>
                            <p className="text-sm text-gray-700">{message.contenidoRedesSociales.linkedin.caption}</p>
                          </div>

                          {/* WhatsApp */}
                          <div className="border rounded-lg p-3 bg-green-50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">📱</div>
                              <span className="font-medium">WhatsApp Story</span>
                            </div>
                            <p className="text-sm text-gray-700">{message.contenidoRedesSociales.whatsapp.caption}</p>
                          </div>

                          {/* TikTok */}
                          <div className="border rounded-lg p-3 bg-black/5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 bg-black rounded text-white text-xs flex items-center justify-center font-bold">🎵</div>
                              <span className="font-medium">TikTok</span>
                            </div>
                            <p className="text-sm text-gray-700">{message.contenidoRedesSociales.tiktok.titulo}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Estado de generación de video IA */}
                    {message.mensajeId && aiVideoStatus[message.mensajeId] && (
                      <div className="border rounded-lg p-3 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded text-white text-xs flex items-center justify-center font-bold">🤖</div>
                          <span className="font-medium">Video IA para TikTok</span>
                        </div>
                        <div className={`text-sm ${
                          aiVideoStatus[message.mensajeId]?.status === 'generating' ? 'text-blue-600' :
                          aiVideoStatus[message.mensajeId]?.status === 'completed' ? 'text-green-600' :
                          aiVideoStatus[message.mensajeId]?.status === 'error' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {aiVideoStatus[message.mensajeId]?.message}
                        </div>
                        {aiVideoStatus[message.mensajeId]?.progress !== undefined && aiVideoStatus[message.mensajeId]?.progress! < 100 && (
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${aiVideoStatus[message.mensajeId]?.progress || 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {aiVideoStatus[message.mensajeId]?.progress || 0}% completado
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botón de confirmación o resultados */}
                    {message.estadoPublicacion === EstadoPublicacion.PENDIENTE_CONFIRMACION && message.imagenGenerada && message.mensajeId && (
                      <button
                        onClick={() => confirmarPublicacion(message.mensajeId!)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        ✅ Publicar en todas las redes sociales
                      </button>
                    )}

                    {/* Resultados de publicación */}
                    {message.estadoPublicacion === EstadoPublicacion.PUBLICADO && message.mensajeId && publishingResults[message.mensajeId] && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Resultados de la publicación:</h4>
                        {publishingResults[message.mensajeId].map((resultado, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${
                            resultado.exito ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                          }`}>
                            <div className="flex items-center gap-2">
                              {/* Ícono específico por plataforma */}
                              {resultado.plataforma === 'facebook' && (
                                <div className="w-4 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">f</div>
                              )}
                              {resultado.plataforma === 'instagram' && (
                                <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded text-white text-xs flex items-center justify-center">📷</div>
                              )}
                              {resultado.plataforma === 'linkedin' && (
                                <div className="w-4 h-4 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">in</div>
                              )}
                              {resultado.plataforma === 'whatsapp' && (
                                <div className="w-4 h-4 bg-green-600 rounded text-white text-xs flex items-center justify-center">📱</div>
                              )}

                              {resultado.plataforma === 'tiktok' && (
                                <div className="w-4 h-4 bg-black rounded text-white text-xs flex items-center justify-center">🎵</div>
                              )}  

                              <span className="font-medium capitalize">{resultado.plataforma}</span>
                              {resultado.exito ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            {/* {resultado.exito && resultado.link && (
                              <a 
                                href={resultado.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Ver post
                              </a>
                            )} */}
                            {!resultado.exito && resultado.error && (
                              <span className="text-xs text-red-600">{resultado.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
                )}

                {message.isStreaming && (
                  <div className="flex items-center mt-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">
                      {message.type === 'image' ? 'Generando con DALL-E...' : 'Escribiendo...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border border-gray-200 px-5 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    Procesando...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6 lg:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-3 w-full max-w-full">
          <input
            type="text"
            {...register("message", { required: true })}
            placeholder="Escribí tu mensaje..."
            className="flex-1 px-5 py-3.5 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping}
            className="px-5 py-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}